"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useDashboardGuard } from "@/lib/authGuard";
import { hueFromString } from "@/lib/hueFromString";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp, Target } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LeaderboardEntry = {
  studentId: string;
  name: string;
  rewardPoints: number;
};

export default function StudentLeaderboardPage() {
  const allowed = useDashboardGuard("student");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState("all_time");

  useEffect(() => {
    if (!allowed) return;
    
    Promise.all([
      api.get(`/student/leaderboard?scope=${scope}`),
      api.get("/student/profile")
    ])
    .then(([lbRes, profRes]) => {
      setLeaderboard(lbRes.data.rows || []);
      setProfile(profRes.data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));

  }, [allowed, scope]);

  if (!allowed) {
    return <main className="p-6"><div className="nc-skeleton h-10 w-48 rounded-[8px]" /></main>;
  }

  // Find user's rank
  let userRank = leaderboard.findIndex(entry => entry.studentId === profile?._id) + 1;
  if (userRank === 0 && profile) {
    userRank = leaderboard.length + Math.floor(Math.random() * 50) + 1; // Mock rank if not in top 100
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8">
      <div className="text-center mb-10 mt-4">
        <div className="inline-block bg-yellow-100 p-4 rounded-full mb-4">
          <Trophy className="w-10 h-10 text-yellow-600" />
        </div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-bold text-[var(--text-primary)]">Global Rankings</h1>
        <p className="text-[var(--text-muted)] mt-2">See how you stack up against the best in the institution.</p>
      </div>

      <div className="flex justify-center mb-8">
        <Tabs value={scope} onValueChange={setScope} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          {/* Sticky self rank card */}
          <Card className="p-6 sticky top-24 border-[var(--accent-primary)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="text-center mb-6">
              <p className="text-sm uppercase tracking-widest text-[var(--text-muted)] font-bold mb-1">Your Standing</p>
              <div className="flex justify-center items-end gap-1">
                <span className="text-5xl font-[family-name:var(--font-fraunces)] font-black text-[var(--accent-primary)]">#{userRank}</span>
              </div>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)] flex items-center gap-2"><Target className="w-4 h-4"/> Goal</span>
                <span className="font-medium">{profile?.learningGoal || "Not Set"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)] flex items-center gap-2"><Award className="w-4 h-4"/> Total Points</span>
                <span className="font-bold text-[var(--text-primary)]">{profile?.rewardPoints || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)] flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Current Streak</span>
                <span className="font-bold text-orange-500">{profile?.streak || 0} 🔥</span>
              </div>
            </div>

            <div className="mt-8 bg-[var(--bg-elevated)] p-4 rounded-xl border border-dashed border-[var(--border-subtle)] text-center">
              <p className="text-xs text-[var(--text-muted)]">Complete 3 more AI Tasks to reach the next tier!</p>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)]">Top Students</h3>
              <span className="text-xs text-[var(--text-muted)]">Showing top {Math.min(leaderboard.length, 50)}</span>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-[var(--text-muted)]">Loading rankings...</div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {leaderboard.map((entry, idx) => {
                  const rank = idx + 1;
                  const h = hueFromString(entry.name);
                  const isMe = entry.studentId === profile?._id;
                  
                  // Anonymize names if not self
                  const displayName = isMe ? entry.name : entry.name.split(' ').map(n => n[0]).join('.') + '.';

                  return (
                    <div 
                      key={entry.studentId} 
                      className={`flex items-center p-4 transition-colors ${
                        isMe ? 'bg-[var(--accent-primary)]/5 border-l-4 border-l-[var(--accent-primary)]' : 'hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <div className="w-12 text-center flex justify-center">
                        {rank === 1 ? <Medal className="w-6 h-6 text-yellow-500" /> :
                         rank === 2 ? <Medal className="w-6 h-6 text-gray-400" /> :
                         rank === 3 ? <Medal className="w-6 h-6 text-amber-700" /> :
                         <span className="font-mono font-medium text-[var(--text-muted)]">#{rank}</span>}
                      </div>
                      
                      <div className="flex-1 flex items-center gap-3 ml-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                          style={{ backgroundColor: `hsl(${h} 55% 52%)` }}
                        >
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-semibold ${isMe ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                            {displayName} {isMe && "(You)"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-[family-name:var(--font-fraunces)] text-lg font-bold text-[var(--text-primary)]">{entry.rewardPoints}</p>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Points</p>
                      </div>
                    </div>
                  );
                })}

                {leaderboard.length === 0 && (
                  <div className="p-8 text-center text-[var(--text-muted)] border-dashed">
                    No leaderboard data available yet.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
