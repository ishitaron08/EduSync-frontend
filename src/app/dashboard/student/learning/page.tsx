"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { describeApiError } from "@/lib/apiErrors";
import { useDashboardGuard } from "@/lib/authGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, BookOpen, Briefcase, Code, Sparkles, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

type TaskRecommendation = {
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  durationMinutes: number;
  basePoints: number;
  probability: number;
};

type ActiveTask = {
  _id: string;
  title: string;
  status: string;
  pointsAwarded?: number;
};

export default function StudentLearningPage() {
  const allowed = useDashboardGuard("student");
  const searchParams = useSearchParams();
  const requestedDuration = searchParams.get("duration") || "60";
  
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const [profRes, tasksRes] = await Promise.all([
        api.get("/student/profile"),
        api.get("/student/tasks")
      ]);
      setProfile(profRes.data);
      const pendingTasks = tasksRes.data.filter((t: any) => t.status !== "completed");
      setActiveTasks(pendingTasks);
      
      if (profRes.data?.learningGoal && pendingTasks.length === 0) {
        // Fetch recommendations if no active tasks
        const recsRes = await api.get(`/student/tasks/recommendations?duration=${requestedDuration}`);
        setRecommendations(recsRes.data);
      }
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    fetchState();
  }, [allowed, requestedDuration]);

  if (!allowed || loading) {
    return <main className="p-6"><div className="flex items-center gap-2"><Loader2 className="animate-spin text-[var(--accent-primary)]" /> Loading AI Engine...</div></main>;
  }

  const handleSetGoal = async (goal: string) => {
    try {
      setLoading(true);
      await api.patch("/student/profile", { learningGoal: goal });
      await fetchState();
    } catch (err) {
      setError(describeApiError(err));
      setLoading(false);
    }
  };

  const handleAcceptTask = async (rec: TaskRecommendation) => {
    try {
      setProcessingId(rec.title);
      // Create task in DB
      await api.post("/student/tasks", {
        title: rec.title,
        category: rec.category,
        difficulty: rec.difficulty,
        durationMinutes: rec.durationMinutes,
        basePoints: rec.basePoints
      });
      await fetchState();
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setProcessingId(taskId);
      await api.patch(`/student/tasks/${taskId}/complete`);
      await fetchState();
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  // State 1: Goal Selection
  if (!profile?.learningGoal) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-[var(--accent-primary)]/10 p-3 rounded-full mb-4">
            <Target className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--text-primary)]">Set Your Learning Goal</h1>
          <p className="text-[var(--text-muted)] mt-2 max-w-lg mx-auto">To personalize your AI recommendations, please select what you want to focus on this semester.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 flex flex-col gap-4 border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 transition-colors cursor-pointer group" onClick={() => handleSetGoal("Academic Improvement")}>
            <BookOpen className="w-8 h-8 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">Academic Improvement</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Improve grades in current subjects and get subject-wise practice.</p>
            </div>
            <Button variant="ghost" className="mt-auto justify-between group-hover:bg-[var(--accent-primary)] group-hover:text-white">
              Select Goal <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>

          <Card className="p-6 flex flex-col gap-4 border-[var(--border-subtle)] hover:border-[var(--accent-amber)]/50 transition-colors cursor-pointer group" onClick={() => handleSetGoal("Placement Preparation")}>
            <Briefcase className="w-8 h-8 text-[var(--accent-amber)] group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">Placement Preparation</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Prepare for campus placements with aptitude and interview tasks.</p>
            </div>
            <Button variant="ghost" className="mt-auto justify-between group-hover:bg-[var(--accent-amber)] group-hover:text-white">
              Select Goal <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>

          <Card className="p-6 flex flex-col gap-4 border-[var(--border-subtle)] hover:border-[var(--accent-secondary)]/50 transition-colors cursor-pointer group" onClick={() => handleSetGoal("Skill Development")}>
            <Code className="w-8 h-8 text-[var(--accent-secondary)] group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">Skill Development</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Learn new technologies, frameworks, and build projects.</p>
            </div>
            <Button variant="ghost" className="mt-auto justify-between group-hover:bg-[var(--accent-secondary)] group-hover:text-white">
              Select Goal <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--accent-primary)]/10 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--text-primary)]">
              AI Smart Learning
            </h1>
            <p className="text-sm text-[var(--text-muted)]">Goal: <span className="font-medium text-[var(--text-primary)]">{profile.learningGoal}</span></p>
          </div>
        </div>
      </header>

      {error && <p className="text-sm text-[var(--accent-danger)] bg-[var(--accent-danger)]/10 p-3 rounded-md">{error}</p>}

      {activeTasks.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Your Active Tasks</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeTasks.map(task => (
              <Card key={task._id} className="p-6 border-[var(--accent-primary)] bg-[var(--accent-primary)]/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--text-primary)]">{task.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Status: In Progress</p>
                  </div>
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin" />
                  </div>
                </div>
                <Button 
                  onClick={() => handleCompleteTask(task._id)} 
                  disabled={processingId === task._id}
                  className="w-full gap-2" 
                  variant="filled"
                >
                  {processingId === task._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Mark Complete
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recommended for You</h2>
            <span className="text-xs font-mono bg-[var(--bg-elevated)] px-2 py-1 rounded text-[var(--text-muted)]">
              Slot Time: {requestedDuration} min
            </span>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-3">
            {recommendations.map((rec, idx) => (
              <Card key={idx} className="flex flex-col p-0 overflow-hidden border-[var(--border-subtle)] hover:shadow-lg transition-shadow">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      rec.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      rec.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {rec.difficulty}
                    </span>
                    <span className="text-xs font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-1 rounded">
                      {(rec.probability * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-lg leading-tight mb-2">{rec.title}</h3>
                  <div className="text-sm text-[var(--text-muted)] space-y-1">
                    <p>Est. time: {rec.durationMinutes} min</p>
                    <p>Reward: {rec.basePoints} points</p>
                  </div>
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)]">
                  <Button 
                    onClick={() => handleAcceptTask(rec)} 
                    disabled={processingId === rec.title}
                    variant="default" 
                    className="w-full"
                  >
                    {processingId === rec.title ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept Task"}
                  </Button>
                </div>
              </Card>
            ))}
            {recommendations.length === 0 && (
              <div className="col-span-3 text-center py-12 text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-xl border border-dashed border-[var(--border-subtle)]">
                No recommendations found for a {requestedDuration} minute slot.
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
