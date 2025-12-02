import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Code2, FileText, Lock, TrendingUp, Upload, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabase-client";

interface Evaluation {
  id: string;
  name: string;
  date: string;
  score: number;
  status: "unlocked" | "locked";
  language: string;
  task_id: string;
}

interface DashboardStats {
  totalTasks: number;
  unlockedCount: number;
  avgScore: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalTasks: 0, unlockedCount: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Developer");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get user info
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          if (profile?.full_name) {
            setUserName(profile.full_name);
          }
        }

        // Get evaluations
        const data = await apiClient.getEvaluations();
        setEvaluations(data.evaluations || []);
        setStats(data.stats || { totalTasks: 0, unlockedCount: 0, avgScore: 0 });
      } catch (error: any) {
        toast.error('Failed to load dashboard data');
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      await apiClient.signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-accent/10 text-accent hover:bg-accent/20";
    if (score >= 60) return "bg-warning/10 text-warning hover:bg-warning/20";
    return "bg-destructive/10 text-destructive hover:bg-destructive/20";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">SnapReview AI</h1>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {userName}! 👋</h2>
          <p className="text-muted-foreground">Here's an overview of your code evaluation journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardDescription>Total Tasks Submitted</CardDescription>
              <CardTitle className="text-3xl">{stats.totalTasks}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1 text-accent" />
                <span>All time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">{stats.avgScore}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1 text-accent" />
                <span>Overall performance</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-3">
              <CardDescription>Reports Unlocked</CardDescription>
              <CardTitle className="text-3xl">{stats.unlockedCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="w-4 h-4 mr-1" />
                <span>{stats.totalTasks - stats.unlockedCount} pending unlock</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Submit New Task
              </CardTitle>
              <CardDescription>Get AI-powered feedback on your code</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/submit")} className="w-full">
                Start Evaluation
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                View All Reports
              </CardTitle>
              <CardDescription>Access your evaluation history</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/reports")} variant="outline" className="w-full">
                Browse Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Evaluations</CardTitle>
            <CardDescription>Your latest code submissions and their results</CardDescription>
          </CardHeader>
          <CardContent>
            {evaluations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No evaluations yet. Submit your first code task to get started!</p>
                <Button onClick={() => navigate("/submit")} className="mt-4">
                  Submit Code
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.language}</Badge>
                      </TableCell>
                      <TableCell>{report.date}</TableCell>
                      <TableCell>
                        <Badge className={getScoreBadgeColor(report.score)}>
                          {report.score}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.status === "unlocked" ? (
                          <Badge className="bg-accent/10 text-accent">Unlocked</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="w-3 h-3" />
                            Locked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => navigate(`/evaluation/${report.id}`)}
                          variant="ghost"
                          size="sm"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
