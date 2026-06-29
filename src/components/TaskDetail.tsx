import React, { useState, useEffect } from "react";
import { Task, Milestone } from "../types";
import { 
  Sparkles, ShieldAlert, AlertCircle, CheckCircle, Clock, CheckSquare, Square, 
  Trash2, Flame, ThumbsUp, RefreshCw, ChevronRight, Check, Zap, Target, HelpCircle
} from "lucide-react";

interface TaskDetailProps {
  task: Task | null;
  onToggleMilestone: (taskId: string, milestoneId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onReanalyze: (taskId: string) => void;
  onBackToQueue?: () => void;
}

export default function TaskDetail({ 
  task, 
  onToggleMilestone, 
  onToggleComplete, 
  onDeleteTask, 
  onReanalyze,
  onBackToQueue
}: TaskDetailProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Reset confirmation state when switching tasks
  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [task?.id]);

  if (!task) {
    return (
      <div id="no-task-selected-placeholder" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 text-center shadow-xs flex flex-col items-center justify-center h-full min-h-[440px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-450 mb-5 shadow-xs border border-indigo-100/50 dark:border-indigo-900/40">
          <Sparkles className="w-7 h-7 animate-pulse text-indigo-500 dark:text-indigo-400" />
        </div>
        <h4 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">Consult Your Guardian AI</h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mt-2 leading-relaxed font-sans font-light mb-6">
          Select any target from your protected deadlines queue to load the personalized coach analysis, risk mitigation roadmap, and execution checkpoints.
        </p>
        {onBackToQueue && (
          <button
            onClick={onBackToQueue}
            className="lg:hidden inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-100/40 dark:border-indigo-900/40 cursor-pointer shadow-3xs transition duration-200"
          >
            ← Back to Deadlines Queue
          </button>
        )}
      </div>
    );
  }

  const analysis = task.aiAnalysis;
  const isCompleted = task.completed;

  // Calculate days remaining
  const getDaysRemainingText = (deadlineStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due Today!";
    if (diffDays === 1) return "Due Tomorrow!";
    return `${diffDays} days left`;
  };

  const getRiskBadgeStyles = (risk?: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20';
      case 'low':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20';
      default:
        return 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800';
    }
  };

  const getPriorityBadgeStyles = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20 font-bold';
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 font-bold';
      case 'low':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 font-bold';
    }
  };

  return (
    <div id={`task-detail-${task.id}`} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden divide-y divide-slate-100/80 dark:divide-slate-800/80 animate-fade-in">
      
      {/* Detail Header & Main Meta */}
      <div className="p-6 space-y-5">
        
        {onBackToQueue && (
          <button
            onClick={onBackToQueue}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition duration-150 mb-2 cursor-pointer bg-indigo-50/50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-100/40 dark:border-indigo-900/40"
          >
            ← Back to Deadlines Queue
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${getRiskBadgeStyles(analysis?.riskScore)} capitalize font-mono shadow-3xs`}>
              Risk Severity: {analysis?.riskScore || "Pending"}
            </span>
            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${getPriorityBadgeStyles(task.priority)} capitalize font-mono`}>
              {task.priority} Priority
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isConfirmingDelete ? (
              <>
                <button
                  onClick={() => onToggleComplete(task.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-3xs ${
                    isCompleted 
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600" 
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {isCompleted ? "Completed" : "Secure Goal"}
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 bg-red-50/50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 px-2.5 py-1 rounded-xl animate-fade-in">
                <span className="text-[10px] font-bold text-red-700 dark:text-red-400 font-mono uppercase tracking-wider">Delete?</span>
                <button
                  onClick={() => {
                    onDeleteTask(task.id);
                    setIsConfirmingDelete(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className={`text-xl md:text-2xl font-display font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight ${isCompleted ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}>
            {task.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold">Target: {task.deadline}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">{getDaysRemainingText(task.deadline)}</span>
          </div>
        </div>

        {task.description && (
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50/70 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100/60 dark:border-slate-800/60 font-sans">
            {task.description}
          </p>
        )}
      </div>

      {/* Coach Analysis Section */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Guardian Coaching Panel</h3>
          </div>
          <button
            onClick={() => onReanalyze(task.id)}
            disabled={task.aiLoading}
            className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 font-bold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl transition duration-200 disabled:opacity-50 cursor-pointer border border-indigo-100/50 dark:border-indigo-900/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${task.aiLoading ? 'animate-spin' : ''}`} />
            {task.aiLoading ? "Consulting..." : "Re-Analyze"}
          </button>
        </div>

        {task.aiLoading ? (
          <div className="space-y-5 py-4 animate-fade-in">
            <div className="flex items-center gap-2.5 text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Gemini is generating custom day-by-day coaching plan...</span>
            </div>
            
            {/* High-Fidelity Sliding Progress Bar */}
            <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-progress-slide"></div>
            </div>

            <div className="space-y-3 animate-pulse">
              <div className="h-12 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl w-full border border-slate-100/10 dark:border-slate-800/10"></div>
              <div className="h-8 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl w-2/3 border border-slate-100/10 dark:border-slate-800/10"></div>
              <div className="h-24 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl w-full border border-slate-100/10 dark:border-slate-800/10"></div>
            </div>
          </div>
        ) : task.aiError ? (
          (() => {
            const isBusy = task.aiError.toLowerCase().includes("busy") || 
                           task.aiError.toLowerCase().includes("demand") || 
                           task.aiError.toLowerCase().includes("moment") ||
                           task.aiError.includes("503");
            
            if (isBusy) {
              return (
                <div className="p-5 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-extrabold text-amber-950 dark:text-amber-200 block">AI Guardian Coach is Busy</span>
                      <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed mt-1">
                        AI service is busy right now. Please try again in a few moments.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onReanalyze(task.id)}
                      className="text-xs bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold transition duration-150 cursor-pointer shadow-sm active:scale-98"
                    >
                      Retry Coaching Analysis
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-5 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-450 rounded-2xl border border-red-200/50 dark:border-red-900/40 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-950 dark:text-red-300 block">Coaching Analysis Interrupted</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">{task.aiError}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onReanalyze(task.id)}
                    className="text-xs bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold transition duration-150 cursor-pointer shadow-sm active:scale-98"
                  >
                    Re-Invoke Guardian Coach
                  </button>
                </div>
              </div>
            );
          })()
        ) : analysis ? (
          <div className="space-y-6">
            
            {/* Risk Assessment Block */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 p-5 rounded-2xl border border-slate-800/80 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Flame className={`w-4 h-4 ${analysis.riskScore === 'high' ? 'text-red-400 animate-pulse' : analysis.riskScore === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-300">Coaching Risk Matrix</span>
                </div>
                <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  analysis.riskScore === 'high' 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : analysis.riskScore === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                } border`}>
                  {analysis.riskScore.toUpperCase()}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans font-light">
                {analysis.riskExplanation}
              </p>
            </div>

            {/* Immediate Next step focus box */}
            <div className="bg-gradient-to-r from-indigo-50/50 to-indigo-50/10 dark:from-indigo-950/40 dark:to-slate-900/20 border border-indigo-100/70 dark:border-indigo-500/20 p-4.5 rounded-2xl space-y-1.5 shadow-3xs">
              <span className="text-[9px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                IMMEDIATE FOCUS STEP
              </span>
              <p className="text-xs md:text-sm text-indigo-950 dark:text-indigo-200 font-extrabold font-sans">
                {analysis.focusStep}
              </p>
            </div>

            {/* Milepost Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Bite-sized Milestones</h4>
                <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/50 border border-indigo-100/40 dark:border-indigo-900/40 px-2 py-0.5 rounded-md">
                  {analysis.milestones.filter(m => m.completed).length} / {analysis.milestones.length} Done
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {analysis.milestones.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onToggleMilestone(task.id, m.id)}
                    className="flex items-start text-left gap-3 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 hover:-translate-y-0.5 transition duration-200 group cursor-pointer shadow-3xs bg-white dark:bg-slate-950"
                  >
                    <span className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-550 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition duration-200">
                      {m.completed ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-450" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </span>
                    <span className={`text-xs md:text-sm ${m.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200 font-bold'}`}>
                      {m.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Day Wise Plan */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Day-by-Day Action Roadmap</h4>
              <div className="relative border-l border-slate-200/60 dark:border-slate-800/80 pl-4 ml-2.5 space-y-5">
                {analysis.dayWisePlan.map((d, idx) => (
                  <div key={idx} className="relative group">
                    {/* Circle timeline dot */}
                    <span className="absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 border border-white dark:border-slate-900 ring-4 ring-slate-50 dark:ring-slate-950/20 transition group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 group-hover:ring-indigo-100 dark:group-hover:ring-indigo-950/50"></span>
                    <div className="space-y-1">
                      <span className="text-[9px] font-extrabold text-indigo-700 dark:text-indigo-400 font-mono uppercase bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-md border border-indigo-100/40 dark:border-indigo-900/40">{d.day}</span>
                      <h5 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{d.title}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-sans">{d.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Productivity suggestions */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">FLOW GUARD RECOMMENDATIONS</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {analysis.productivitySuggestions.map((suggestion, index) => (
                  <div key={index} className="flex gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 hover:shadow-3xs transition duration-200">
                    <span className="mt-0.5 text-indigo-600 shrink-0">
                      <Zap className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans font-light">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center bg-white dark:bg-slate-950">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Coaching Summary Computed</h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mb-3">
              This task has not been processed by the Guardian Coach. Get immediate tailored recommendations.
            </p>
            <button
              onClick={() => onReanalyze(task.id)}
              disabled={task.aiLoading}
              className="bg-indigo-600 dark:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer"
            >
              Analyze with Gemini
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

