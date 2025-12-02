import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Code2, Download, Lock, Share2, Loader2, Copy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import PaymentDialog from "@/components/PaymentDialog";
import jsPDF from "jspdf";

interface EvaluationData {
  id: string;
  overall_score: number;
  scores: {
    readability: number;
    efficiency: number;
    maintainability: number;
    security: number;
  };
  summary: string;
  strengths: Array<{ title: string; description: string; code_snippet?: string }>;
  improvements: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    line_numbers: number[];
    suggestion: string;
    refactored_example: string;
  }>;
  refactored_code?: string;
  is_unlocked: boolean;
  created_at: string;
  task?: {
    title: string;
    language: string;
    created_at: string;
  };
}

const Evaluation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const handleShare = async () => {
    if (!evaluation || !id) return;

    const url = `${window.location.origin}/evaluation/${id}`;
    const title = `Code Evaluation: ${evaluation.task?.title || "Report"}`;
    const text = `Overall score: ${evaluation.overall_score}/100. ${evaluation.summary || ""}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        toast.success("Share dialog opened");
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      // User may cancel share; only show error for real failures
      console.error("Share failed:", err);
      toast.error("Unable to share link");
    }
  };

  const handleDownloadPdf = () => {
    if (!evaluation || !id) return;

    try {
      const doc = new jsPDF({
        unit: "pt",
        format: "a4",
      });

      const marginLeft = 40;
      const marginTop = 40;
      const lineHeight = 16;
      const maxWidth = 515; // A4 width (595pt) - margins
      let y = marginTop;

      const addLine = (text: string = "", options: { bold?: boolean } = {}) => {
        const fontStyle = options.bold ? "bold" : "normal";
        doc.setFont("helvetica", fontStyle, 10);
        const lines = doc.splitTextToSize(text, maxWidth);
        const requiredHeight = lines.length * lineHeight;

        // Add new page if needed
        if (y + requiredHeight > doc.internal.pageSize.getHeight() - marginTop) {
          doc.addPage();
          y = marginTop;
        }

        lines.forEach((line) => {
          doc.text(line, marginLeft, y);
          y += lineHeight;
        });
      };

      // Title
      doc.setFont("helvetica", "bold", 16);
      doc.text(evaluation.task?.title || "Code Evaluation Report", marginLeft, y);
      y += lineHeight * 2;

      // Meta info
      doc.setFont("helvetica", "normal", 10);
      addLine(`Evaluation ID: ${evaluation.id}`);
      addLine(`Language: ${evaluation.task?.language || "Unknown"}`);
      addLine(`Date: ${new Date(evaluation.created_at).toLocaleString()}`);
      addLine();

      // Overall score
      addLine(`Overall Score: ${evaluation.overall_score}/100`, { bold: true });
      addLine(
        `Scores: Readability ${evaluation.scores.readability}/10, ` +
          `Efficiency ${evaluation.scores.efficiency}/10, ` +
          `Maintainability ${evaluation.scores.maintainability}/10, ` +
          `Security ${evaluation.scores.security}/10`
      );
      addLine();

      // Summary
      addLine("Summary:", { bold: true });
      addLine(evaluation.summary || "No summary provided.");
      addLine();

      // Strengths
      if (evaluation.strengths?.length) {
        addLine("Strengths:", { bold: true });
        evaluation.strengths.forEach((s, idx) => {
          addLine(`${idx + 1}. ${s.title}`, { bold: true });
          addLine(s.description);
          if (s.code_snippet) {
            addLine("Code snippet:");
            s.code_snippet.split("\n").forEach((line) => {
              addLine(`  ${line}`);
            });
          }
          addLine();
        });
      }

      // Improvements
      if (evaluation.improvements?.length) {
        addLine("Improvements:", { bold: true });
        evaluation.improvements.forEach((imp, idx) => {
          addLine(`${idx + 1}. ${imp.title} [${imp.priority}]`, { bold: true });
          addLine(imp.description);
          if (imp.suggestion) {
            addLine("Before:");
            imp.suggestion.split("\n").forEach((line) => {
              addLine(`  ${line}`);
            });
          }
          if (imp.refactored_example) {
            addLine("After:");
            imp.refactored_example.split("\n").forEach((line) => {
              addLine(`  ${line}`);
            });
          }
          addLine();
        });
      }

      // Refactored code
      if (evaluation.refactored_code) {
        addLine("Full Refactored Code:", { bold: true });
        evaluation.refactored_code.split("\n").forEach((line) => {
          addLine(`  ${line}`);
        });
      }

      doc.save(`evaluation-${id}.pdf`);
      toast.success("PDF report downloaded");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download report");
    }
  };

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!id) {
        setError('Evaluation ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Try to get full evaluation first (if unlocked)
        try {
          const fullData = await apiClient.getEvaluationFull(id);
          if (fullData && typeof fullData === 'object') {
            setEvaluation(fullData as EvaluationData);
          }
        } catch (fullError: unknown) {
          // If locked, get preview
          const errorMessage = fullError instanceof Error ? fullError.message : String(fullError);
          if (errorMessage.includes('locked') || errorMessage.includes('403')) {
            const previewData = await apiClient.getEvaluationPreview(id);
            if (previewData && typeof previewData === 'object') {
              const preview = previewData as {
                id: string;
                overall_score: number;
                summary: string;
                strengths_preview?: Array<{ title: string; description: string; code_snippet?: string }>;
                scores: {
                  readability: number;
                  efficiency: number;
                  maintainability: number;
                  security: number;
                };
                is_unlocked: boolean;
                created_at: string;
              };
              setEvaluation({
                id: preview.id,
                overall_score: preview.overall_score,
                summary: preview.summary,
                scores: preview.scores,
                strengths: preview.strengths_preview || [],
                improvements: [],
                refactored_code: undefined,
                is_unlocked: preview.is_unlocked,
                created_at: preview.created_at,
              });
            }
          } else {
            throw fullError;
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load evaluation';
        setError(errorMessage);
        toast.error('Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading evaluation...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Evaluation not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isUnlocked = evaluation.is_unlocked;
  const taskTitle = evaluation.task?.title || 'Code Evaluation';
  const taskLanguage = evaluation.task?.language || 'Unknown';
  const taskDate = evaluation.task?.created_at 
    ? new Date(evaluation.task.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date(evaluation.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Evaluation Report</h1>
            </div>
          </div>
          <div className="flex gap-2">
            {!isUnlocked && (
              <Button 
                onClick={() => setPaymentDialogOpen(true)} 
                size="sm"
                className="bg-primary"
              >
                <Lock className="w-4 h-4 mr-2" />
                Unlock Full Report
              </Button>
            )}
            {isUnlocked && (
              <>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Task Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{taskTitle}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                  <Badge variant="outline">{taskLanguage}</Badge>
                  <span>Submitted on {taskDate}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Overall Score */}
        <Card className="mb-6 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{evaluation.overall_score}</div>
                    <div className="text-sm text-muted-foreground">out of 100</div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              {evaluation.summary || 'Evaluation completed successfully.'}
            </p>
          </CardContent>
        </Card>

        {/* Strengths */}
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                Strengths Identified
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {evaluation.strengths.map((strength, i) => (
                <div key={i} className="flex flex-col gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1">{strength.title}</h4>
                      <p className="text-sm text-muted-foreground">{strength.description}</p>
                    </div>
                  </div>
                  {strength.code_snippet && (
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-2 h-7 w-7"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(strength.code_snippet || "");
                            toast.success("Code snippet copied");
                          } catch {
                            toast.error("Failed to copy code");
                          }
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <pre className="p-3 pr-10 rounded bg-muted text-xs md:text-sm overflow-x-auto mt-1">
                        <code>{strength.code_snippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Locked/Unlocked Content */}
        {!isUnlocked ? (
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10 backdrop-blur-sm" />
            <CardHeader>
              <CardTitle>Detailed Analysis & Improvements</CardTitle>
              <CardDescription>Areas for improvement with refactored examples</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 blur-sm select-none">
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Detailed improvements available</h4>
                <p className="text-sm text-muted-foreground">
                  Unlock to see comprehensive analysis and refactored code examples...
                </p>
              </div>
            </CardContent>

            {/* Unlock Card */}
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <Card className="max-w-md mx-4 shadow-2xl">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>Unlock Full Report</CardTitle>
                  <CardDescription>
                    Get comprehensive insights and refactored code examples
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">₹99</div>
                    <p className="text-sm text-muted-foreground">One-time payment</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    {[
                      "Detailed line-by-line analysis",
                      "Performance optimization suggestions",
                      "Refactored code examples",
                      "Security vulnerability assessment",
                      "Best practices recommendations",
                      "Download PDF report",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => setPaymentDialogOpen(true)} 
                    className="w-full" 
                    size="lg"
                  >
                    Unlock Full Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </Card>
        ) : (
          <>
            {/* Detailed Score Breakdown */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Detailed Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Readability", score: evaluation.scores.readability },
                  { label: "Efficiency", score: evaluation.scores.efficiency },
                  { label: "Maintainability", score: evaluation.scores.maintainability },
                  { label: "Security", score: evaluation.scores.security },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.score}/10 ({Math.round((item.score / 10) * 100)}%)
                      </span>
                    </div>
                    <Progress value={(item.score / 10) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Improvements */}
            {evaluation.improvements && evaluation.improvements.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {evaluation.improvements.map((improvement, i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-warning/10 text-warning">
                          {improvement.priority}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{improvement.title}</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {improvement.description}
                          </p>
                          
                          {improvement.refactored_example && (
                            <div className="grid md:grid-cols-2 gap-4">
                              {improvement.suggestion && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium">Before:</p>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(improvement.suggestion || "");
                                          toast.success("Original code copied");
                                        } catch {
                                          toast.error("Failed to copy code");
                                        }
                                      }}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                                    <code>{improvement.suggestion}</code>
                                  </pre>
                                </div>
                              )}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium">After:</p>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(improvement.refactored_example || "");
                                        toast.success("Refactored code copied");
                                      } catch {
                                        toast.error("Failed to copy code");
                                      }
                                    }}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                                <pre className="p-4 rounded-lg bg-accent/5 text-sm overflow-x-auto border border-accent/20">
                                  <code>{improvement.refactored_example}</code>
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Refactored Code */}
            {evaluation.refactored_code && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Refactored Code</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(evaluation.refactored_code || "");
                          toast.success("Refactored code copied");
                        } catch {
                          toast.error("Failed to copy code");
                        }
                      }}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 rounded-lg bg-accent/5 text-sm overflow-x-auto border border-accent/20">
                    <code>{evaluation.refactored_code}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Payment Dialog */}
        {id && (
          <PaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            evaluationId={id}
            amount={99}
            onSuccess={async () => {
              // Refetch evaluation data to get unlocked version
              try {
                setLoading(true);
                const fullData = await apiClient.getEvaluationFull(id);
                if (fullData && typeof fullData === 'object') {
                  setEvaluation(fullData as EvaluationData);
                  toast.success('Report unlocked successfully!');
                }
              } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load evaluation';
                toast.error(errorMessage);
              } finally {
                setLoading(false);
              }
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Evaluation;
