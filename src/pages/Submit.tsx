import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Code2, Upload, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

const Submit = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [code, setCode] = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !code.trim() || !language) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (code.trim().length < 10) {
      toast.error("Code must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create task
      const taskResult = await apiClient.createTask({
        title: title.trim(),
        code: code.trim(),
        language,
        description: description.trim(),
        category: category || 'general',
        difficulty_level: difficulty,
      });

      const taskId = taskResult.task.id;

      // Navigate to progress page for real-time evaluation
      navigate(`/evaluation-progress/${taskId}`);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || "Failed to submit task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Submit Task</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                <span className={step >= s ? "text-foreground" : "text-muted-foreground"}>
                  {s === 1 && "Task Details"}
                  {s === 2 && "Code Upload"}
                  {s === 3 && "Evaluation Criteria"}
                </span>
                {s < 3 && <div className="w-16 h-0.5 bg-border mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-3xl">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
              <CardDescription>Provide information about your coding task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Binary Search Implementation"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Max 100 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Task Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your code does and what you're trying to achieve..."
                  rows={4}
                  className="resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Optional</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Programming Language *</Label>
                  <Select value={language} onValueChange={setLanguage} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Task Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="algorithm">Algorithm</SelectItem>
                      <SelectItem value="webdev">Web Development</SelectItem>
                      <SelectItem value="datastructures">Data Structures</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                      <SelectItem value="frontend">Frontend</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <RadioGroup value={difficulty} onValueChange={setDifficulty}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner" className="font-normal cursor-pointer">
                      Beginner
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate" className="font-normal cursor-pointer">
                      Intermediate
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced" className="font-normal cursor-pointer">
                      Advanced
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!title.trim() || !language}
              >
                Next: Upload Code
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Code</CardTitle>
              <CardDescription>Paste your code or upload a file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="code">Your Code *</Label>
                  <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline text-sm">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Upload File
                  </Label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.php,.rb,.swift,.kt,.scala,.r,.m,.sql,.html,.css,.vue,.svelte"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          setCode(content);
                          toast.success(`File "${file.name}" loaded successfully`);
                        };
                        reader.onerror = () => {
                          toast.error('Failed to read file');
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </div>
                <Textarea
                  id="code"
                  placeholder="Paste your code here or upload a file..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={16}
                  className="font-mono text-sm resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {code.length} characters (minimum 10 required)
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="flex-1"
                  disabled={code.trim().length < 10}
                >
                  Next: Evaluation Criteria
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Criteria</CardTitle>
              <CardDescription>
                Choose what aspects you want the AI to focus on (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {[
                  { id: "quality", label: "Code quality & readability" },
                  { id: "performance", label: "Performance & efficiency" },
                  { id: "practices", label: "Best practices adherence" },
                  { id: "security", label: "Security considerations" },
                  { id: "errors", label: "Error handling" },
                  { id: "docs", label: "Documentation" },
                ].map((criterion) => (
                  <div key={criterion.id} className="flex items-center space-x-2">
                    <Checkbox id={criterion.id} defaultChecked />
                    <label
                      htmlFor={criterion.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {criterion.label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim() || !code.trim() || !language}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Submit for Evaluation"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Submit;
