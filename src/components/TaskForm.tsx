import React, { useState } from "react";
import { Plus, Calendar, AlertTriangle, FileText, Sparkles } from "lucide-react";

interface TaskFormProps {
  onAddTask: (taskData: {
    title: string;
    deadline: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }) => void;
  onValidationError?: (message: string) => void;
}

export default function TaskForm({ onAddTask, onValidationError }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>("medium");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      const msg = "Please provide an action-oriented task title.";
      setError(msg);
      if (onValidationError) {
        onValidationError(msg);
      }
      return;
    }
    if (!deadline) {
      const msg = "Please pick a target deadline date.";
      setError(msg);
      if (onValidationError) {
        onValidationError(msg);
      }
      return;
    }

    // Call callback
    onAddTask({
      title: title.trim(),
      deadline,
      priority,
      description: description.trim()
    });

    // Reset Form
    setTitle("");
    setDeadline("");
    setPriority("medium");
    setDescription("");
  };

  // Get today's date in YYYY-MM-DD for min date value
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div id="add-task-form" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
      {/* Visual Header Strip */}
      <div className="bg-gradient-to-r from-slate-50 dark:from-slate-900 via-indigo-50/10 dark:via-indigo-950/10 to-white dark:to-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <h3 className="text-base font-display font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/40">
            <Plus className="w-4.5 h-4.5" />
          </div>
          Deploy New Target Task
        </h3>
        <span className="inline-flex items-center gap-1.5 text-[9px] text-indigo-700 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full font-mono border border-indigo-100/40 dark:border-indigo-900/40">
          <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
          AUTO-BROKEN BY AI
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 text-xs rounded-xl border border-red-150 dark:border-red-900/40 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-red-950 dark:text-red-300">Operational Error</span>
              <p className="text-red-750 dark:text-red-455">{error}</p>
            </div>
          </div>
        )}

        {/* Task Title */}
        <div className="space-y-1.5">
          <label htmlFor="task-title" className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Finalize venture pitch deck or Submit compliance report"
            className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 focus:border-indigo-500/80 dark:focus:border-indigo-500 transition-all duration-200 shadow-3xs"
          />
        </div>

        {/* Date and Priority row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Deadline Picker */}
          <div className="space-y-1.5">
            <label htmlFor="task-deadline" className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              Target Deadline <span className="text-red-500">*</span>
            </label>
            <input
              id="task-deadline"
              type="date"
              value={deadline}
              min={todayStr}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 focus:border-indigo-500/80 dark:focus:border-indigo-500 transition-all duration-200 shadow-3xs cursor-pointer"
            />
          </div>

          {/* Priority Picker */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
              Impact Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPriority(lvl)}
                  className={`py-3 xs:py-2.5 sm:py-2 text-xs font-bold capitalize rounded-xl border transition-all duration-200 cursor-pointer ${
                    priority === lvl
                      ? lvl === "high"
                        ? "bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 font-extrabold shadow-sm ring-2 ring-red-500/5"
                        : lvl === "medium"
                        ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 font-extrabold shadow-sm ring-2 ring-amber-500/5"
                        : "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm ring-2 ring-emerald-500/5"
                      : "bg-slate-50/60 dark:bg-slate-950 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-900"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Description */}
        <div className="space-y-1.5">
          <label htmlFor="task-desc" className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Complexity Description <span className="text-slate-400 dark:text-slate-500 font-normal font-sans">(Optional)</span>
          </label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add dependencies (e.g., 'Awaiting financial raw sheets from HR') to generate highly specific custom suggestions."
            className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 focus:border-indigo-500/80 dark:focus:border-indigo-500 transition-all duration-200 resize-none shadow-3xs"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 hover:from-slate-950 hover:to-black text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all duration-200 cursor-pointer border border-slate-900/40 dark:border-slate-800 hover:shadow-lg hover:shadow-indigo-500/5"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Assign to Guardian Coach
        </button>
      </form>
    </div>
  );
}

