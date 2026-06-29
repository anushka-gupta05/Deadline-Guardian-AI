import React from "react";
import { Search, ArrowUpDown, Filter } from "lucide-react";

interface TaskControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'pending' | 'completed';
  onStatusFilterChange: (filter: 'all' | 'pending' | 'completed') => void;
  priorityFilter: 'all' | 'low' | 'medium' | 'high';
  onPriorityFilterChange: (filter: 'all' | 'low' | 'medium' | 'high') => void;
  riskFilter: 'all' | 'low' | 'medium' | 'high';
  onRiskFilterChange: (filter: 'all' | 'low' | 'medium' | 'high') => void;
  sortBy: 'deadline' | 'createdAt' | 'priority' | 'risk';
  onSortByChange: (sort: 'deadline' | 'createdAt' | 'priority' | 'risk') => void;
}

export default function TaskControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  riskFilter,
  onRiskFilterChange,
  sortBy,
  onSortByChange,
}: TaskControlsProps) {
  return (
    <div id="task-controls" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
      {/* Search and Sort row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search targets or descriptive tags..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 focus:border-indigo-500/80 dark:focus:border-indigo-500 transition-all duration-200 shadow-3xs"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between lg:justify-start gap-2 shrink-0 w-full lg:w-auto bg-slate-50/60 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/80">
          <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono pl-2">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-lg font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 focus:border-indigo-500/80 dark:focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="deadline">Closest Deadline</option>
            <option value="createdAt">Date Created</option>
            <option value="priority">Priority Order</option>
            <option value="risk">Risk Severity</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        {/* Status Filter */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono block">Status filter</span>
          <div className="flex bg-slate-100/50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/30 dark:border-slate-850">
            {(['all', 'pending', 'completed'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onStatusFilterChange(opt)}
                className={`flex-1 py-1.5 text-[10px] xs:text-xs capitalize rounded-lg font-bold transition duration-200 cursor-pointer px-1 xs:px-2 tracking-tight whitespace-nowrap truncate ${
                  statusFilter === opt
                    ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-extrabold ring-1 ring-slate-200/30 dark:ring-slate-800/50"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono block">Priority filter</span>
          <div className="flex bg-slate-100/50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/30 dark:border-slate-850">
            {(['all', 'low', 'medium', 'high'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onPriorityFilterChange(opt)}
                className={`flex-1 py-1.5 text-[10px] xs:text-xs capitalize rounded-lg font-bold transition duration-200 cursor-pointer px-1 xs:px-2 tracking-tight whitespace-nowrap truncate ${
                  priorityFilter === opt
                    ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-extrabold ring-1 ring-slate-200/30 dark:ring-slate-800/50"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Filter */}
        <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono block">Risk filter</span>
          <div className="flex bg-slate-100/50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/30 dark:border-slate-850">
            {(['all', 'low', 'medium', 'high'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onRiskFilterChange(opt)}
                className={`flex-1 py-1.5 text-[10px] xs:text-xs capitalize rounded-lg font-bold transition duration-200 cursor-pointer px-1 xs:px-2 tracking-tight whitespace-nowrap truncate ${
                  riskFilter === opt
                    ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-extrabold ring-1 ring-slate-200/30 dark:ring-slate-800/50"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {opt === "all" ? "All" : opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

