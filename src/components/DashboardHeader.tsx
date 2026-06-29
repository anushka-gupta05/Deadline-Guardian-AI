import React from "react";
import { DashboardStats, Task } from "../types";
import { AlertCircle, CheckCircle2, Flame, ListTodo, ShieldAlert, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

interface DashboardHeaderProps {
  stats: DashboardStats;
  closestTask: Task | null;
  onSelectTask: (task: Task) => void;
}

export default function DashboardHeader({ stats, closestTask, onSelectTask }: DashboardHeaderProps) {
  // Calculate countdown days
  const getDaysRemaining = (deadlineStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const closestDays = closestTask ? getDaysRemaining(closestTask.deadline) : 0;

  // Adaptive Coach Motivation
  const getCoachSentence = () => {
    if (stats.totalTasks === 0) {
      return "Welcome to your command bridge. Create your first task to summon the Deadline Guardian.";
    }
    if (stats.completionRate === 100) {
      return "Incredible work! Every Single target has been completely secured. Outstanding precision.";
    }
    if (stats.highRiskCount > 0) {
      return `Warning: You have ${stats.highRiskCount} high-risk target${stats.highRiskCount > 1 ? "s" : ""} on your radar. Review the custom day-wise coach plans now.`;
    }
    if (stats.completionRate >= 50) {
      return `You are in a great flow state! ${stats.completedTasks} tasks guarded successfully. Keep executing.`;
    }
    return "Focus loops activated. Break down your milestones and tackle your first bite-sized action item first.";
  };

  return (
    <div id="dashboard-header" className="space-y-6 animate-fade-in">
      {/* Top Banner & Title Area */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 rounded-3xl p-5 sm:p-6 md:p-8 text-white shadow-xl border border-slate-800/80">
        
        {/* Subtle Background Glow Decors */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 -mb-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
 
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 md:space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] sm:text-[10px] font-bold font-mono tracking-wider">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 animate-pulse" />
              GUARDIAN AI ACTIVE ENGINE
            </div>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight leading-tight">
              Deadline Guardian <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300">AI</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed font-sans font-light">
              Most planner apps only trigger passive alerts. We operate as your dedicated <span className="text-indigo-300 font-semibold">personal productivity guard</span>, breaking massive bottlenecks down into bite-sized milestones and calculating target risk matrices.
            </p>
            <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-start sm:items-center gap-2 font-mono pt-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse mt-1 sm:mt-0 shrink-0"></span>
              <span className="font-semibold tracking-wide text-slate-300">
                COACH BROADCAST: <span className="font-normal text-indigo-200 block sm:inline">{getCoachSentence()}</span>
              </span>
            </div>
          </div>
 
          {/* Closest Deadline Alert Card */}
          {closestTask && (
            <button
              onClick={() => onSelectTask(closestTask)}
              id="closest-deadline-card"
              className="relative flex items-center gap-3 sm:gap-4 bg-slate-900/60 hover:bg-slate-900/90 active:scale-[0.98] transition-all duration-300 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-left max-w-sm w-full group cursor-pointer shadow-lg hover:border-indigo-500/50 hover:shadow-indigo-500/5"
            >
              <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${
                closestDays <= 2 
                  ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" 
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                <ShieldAlert className="w-5 sm:w-5.5 h-5 sm:h-5.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] sm:text-[10px] text-indigo-300 font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                  Next Critical Deadline
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-1 group-hover:text-indigo-300 transition-colors">
                  {closestTask.title}
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-mono">
                  {closestDays < 0 
                    ? `Overdue by ${Math.abs(closestDays)} days!` 
                    : closestDays === 0 
                    ? "Due Today! Execute first." 
                    : closestDays === 1 
                    ? "Due Tomorrow!" 
                    : `Due in ${closestDays} days`}
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
 
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total & Completion Progress */}
        <div id="stat-card-progress" className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-500/30 rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono truncate">Completion Rate</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 transition group-hover:bg-indigo-100/70 dark:group-hover:bg-indigo-900/50 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-xl xs:text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stats.completionRate}%</span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                ({stats.completedTasks}/{stats.totalTasks})
              </span>
            </div>
            {/* Elegant micro progress bar */}
            <div className="w-full bg-slate-100/80 dark:bg-slate-800 h-1 sm:h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
 
        {/* High Risk Count */}
        <div id="stat-card-high-risk" className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 hover:border-red-200 dark:hover:border-red-500/30 rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono truncate">High Risk Matrix</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 transition group-hover:bg-red-100/70 dark:group-hover:bg-red-900/40 shrink-0">
              <Flame className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <span className="text-xl xs:text-2xl sm:text-3xl font-display font-extrabold text-red-600 dark:text-red-500">{stats.highRiskCount}</span>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-mono truncate">
              Action plans required
            </p>
          </div>
        </div>
 
        {/* Medium Risk Count */}
        <div id="stat-card-med-risk" className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 hover:border-amber-200 dark:hover:border-amber-500/30 rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono truncate">Medium Risk</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 transition group-hover:bg-amber-100/70 dark:group-hover:bg-amber-900/40 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <span className="text-xl xs:text-2xl sm:text-3xl font-display font-extrabold text-amber-600 dark:text-amber-500">{stats.mediumRiskCount}</span>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-mono truncate">
              Monitor closely
            </p>
          </div>
        </div>
 
        {/* Low Risk Count */}
        <div id="stat-card-low-risk" className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 hover:border-emerald-200 dark:hover:border-emerald-500/30 rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono truncate">Low Risk</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500 transition group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/40 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <span className="text-xl xs:text-2xl sm:text-3xl font-display font-extrabold text-emerald-600 dark:text-emerald-500">{stats.lowRiskCount}</span>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-mono truncate">
              Paced &amp; Secured
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

