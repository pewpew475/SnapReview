import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Code2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">SnapReview AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Login
            </Button>
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        <div className="container mx-auto px-6 py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Code Evaluation
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
              Elevate Your Code Quality with{" "}
              <span className="text-primary">AI</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 text-balance">
              Get instant, comprehensive feedback on your code. Identify improvements, optimize performance, and master best practices with AI-powered analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg">
                Start Free Evaluation
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Why Choose SnapReview AI?</h3>
            <p className="text-muted-foreground text-lg">
              Comprehensive code analysis powered by advanced AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Analysis",
                description: "Get detailed feedback on your code in seconds, not hours.",
                color: "text-primary",
              },
              {
                icon: TrendingUp,
                title: "Performance Insights",
                description: "Identify bottlenecks and optimize for better efficiency.",
                color: "text-accent",
              },
              {
                icon: CheckCircle2,
                title: "Best Practices",
                description: "Learn industry standards and improve code maintainability.",
                color: "text-warning",
              },
            ].map((feature, i) => (
              <Card key={i} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">How It Works</h3>
            <p className="text-muted-foreground text-lg">
              Three simple steps to better code
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Submit Your Code",
                description: "Upload or paste your code with details about your project.",
              },
              {
                step: "2",
                title: "AI Analysis",
                description: "Our AI evaluates code quality, performance, and best practices.",
              },
              {
                step: "3",
                title: "Get Insights",
                description: "Receive detailed feedback and refactored code examples.",
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-4xl font-bold mb-6">Ready to Improve Your Code?</h3>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of developers using AI to write better code
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg">
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <span className="font-semibold">SnapReview AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 SnapReview AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
