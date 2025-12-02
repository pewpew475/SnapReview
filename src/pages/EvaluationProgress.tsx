import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle, Code2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const EvaluationProgress = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("initializing");
  const [message, setMessage] = useState<string>("Preparing code analysis...");
  const [elapsed, setElapsed] = useState(0);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setError("Task ID is required");
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Start evaluation stream
    apiClient.evaluateTaskStream(taskId, {
      onStatus: (newStatus, newMessage) => {
        setStatus(newStatus);
        setMessage(newMessage);
      },
      onProgress: (newProgress, newMessage) => {
        setProgress(newProgress);
        if (newMessage) {
          setMessage(newMessage);
        }
      },
      onComplete: (evalId, elapsedTime) => {
        setIsComplete(true);
        setProgress(100);
        setMessage("Evaluation complete!");
        if (evalId) {
          setEvaluationId(evalId);
        }
        clearInterval(interval);
        
        // Navigate to evaluation page after a short delay
        setTimeout(() => {
          if (evalId) {
            navigate(`/evaluation/${evalId}`);
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        clearInterval(interval);
        toast.error(`Evaluation failed: ${errorMessage}`);
      },
    }).catch((err) => {
      // Extract error message - it should already be formatted by the API client
      let errorMsg = "Failed to start evaluation";
      
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      
      // If the error message still contains status code, format it better
      if (errorMsg.includes('401') || errorMsg.includes('status code')) {
        errorMsg = 'Authentication failed. Your session may have expired. Please sign in again.';
      }
      
      setError(errorMsg);
      clearInterval(interval);
      toast.error(errorMsg);
      
      // If it's an auth error, redirect to sign in
      if (errorMsg.includes('Authentication') || errorMsg.includes('401') || errorMsg.includes('session')) {
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    });

    return () => {
      clearInterval(interval);
    };
  }, [taskId, navigate]);

  const getStatusIcon = () => {
    if (error) {
      return <AlertCircle className="w-8 h-8 text-destructive" />;
    }
    if (isComplete) {
      return <CheckCircle2 className="w-8 h-8 text-green-500" />;
    }
    return <Loader2 className="w-8 h-8 animate-spin text-primary" />;
  };

  const getStatusColor = () => {
    if (error) return "text-destructive";
    if (isComplete) return "text-green-500";
    return "text-primary";
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getEstimatedTime = () => {
    if (progress === 0) return "Calculating...";
    if (elapsed === 0) return "Starting...";
    
    // Estimate based on current progress
    const estimatedTotal = Math.ceil((elapsed / progress) * 100);
    const remaining = Math.max(0, estimatedTotal - elapsed);
    
    if (remaining < 10) return "Almost done...";
    return `~${formatTime(remaining)} remaining`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">Code Evaluation in Progress</CardTitle>
          <CardDescription>
            {error ? "An error occurred during evaluation" : "Analyzing your code with AI"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="text-primary hover:underline"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{message}</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="font-medium capitalize">{status.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Time Elapsed</p>
                  <p className="font-medium">{formatTime(elapsed)}</p>
                </div>
              </div>

              {/* Estimated Time */}
              {!isComplete && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Estimated time remaining: {getEstimatedTime()}
                  </p>
                </div>
              )}

              {/* Stage Indicators */}
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium mb-3">Evaluation Stages</p>
                <div className="space-y-2">
                  {[
                    { key: 'initializing', label: 'Initializing analysis', icon: Code2 },
                    { key: 'analyzing', label: 'Analyzing code structure', icon: Code2 },
                    { key: 'parsing', label: 'Parsing results', icon: Code2 },
                    { key: 'saving', label: 'Saving evaluation', icon: Code2 },
                  ].map((stage) => {
                    const isActive = status === stage.key;
                    const isCompleted = 
                      (status === 'parsing' && ['initializing', 'analyzing'].includes(stage.key)) ||
                      (status === 'saving' && ['initializing', 'analyzing', 'parsing'].includes(stage.key)) ||
                      isComplete;
                    
                    return (
                      <div
                        key={stage.key}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary/10 border border-primary/20'
                            : isCompleted
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-muted/50'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                        )}
                        <span
                          className={`text-sm ${
                            isActive
                              ? 'font-medium text-primary'
                              : isCompleted
                              ? 'text-green-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isComplete && (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Redirecting to evaluation results...
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationProgress;

