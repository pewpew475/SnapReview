import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Code2, Lock, Search, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface Report {
  id: string;
  name: string;
  date: string;
  score: number;
  status: "unlocked" | "locked";
  language: string;
  task_id: string;
}

const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getEvaluations();
        setReports(data.evaluations || []);
        setFilteredReports(data.evaluations || []);
      } catch (error: any) {
        toast.error('Failed to load reports');
        console.error('Reports error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  useEffect(() => {
    let filtered = [...reports];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (report) =>
          report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.language.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Filter by language
    if (languageFilter !== "all") {
      filtered = filtered.filter((report) => report.language === languageFilter);
    }

    setFilteredReports(filtered);
  }, [searchQuery, statusFilter, languageFilter, reports]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-accent/10 text-accent";
    if (score >= 60) return "bg-warning/10 text-warning";
    return "bg-destructive/10 text-destructive";
  };

  const uniqueLanguages = Array.from(new Set(reports.map((r) => r.language))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold">All Reports</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unlocked">Unlocked</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {reports.length === 0
                  ? "No reports yet. Submit your first code task to get started!"
                  : "No reports match your filters."}
              </p>
              {reports.length === 0 && (
                <Button onClick={() => navigate("/submit")}>Submit Code</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-2">{report.name}</CardTitle>
                    {report.status === "locked" && (
                      <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{report.language}</Badge>
                    <Badge className={getScoreBadgeColor(report.score)}>
                      {report.score}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Submitted: {report.date}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={report.status === "unlocked" ? "default" : "outline"}
                        className={
                          report.status === "unlocked"
                            ? "bg-accent/10 text-accent"
                            : "gap-1"
                        }
                      >
                        {report.status === "unlocked" ? (
                          "Unlocked"
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            Locked
                          </>
                        )}
                      </Badge>
                      <Button
                        onClick={() => navigate(`/evaluation/${report.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
