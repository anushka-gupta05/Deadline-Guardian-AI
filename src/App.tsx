import React, { useState, useEffect, useMemo } from "react";
import { Task, DashboardStats } from "./types";
import { INITIAL_MOCK_TASKS } from "./mockData";
import DashboardHeader from "./components/DashboardHeader";
import TaskForm from "./components/TaskForm";
import TaskControls from "./components/TaskControls";
import TaskDetail from "./components/TaskDetail";
import { 
  CheckCircle, Clock, AlertTriangle, ChevronRight, Sparkles, 
  Plus, Calendar, ListTodo, ShieldCheck, RefreshCw, BarChart2, ShieldAlert,
  Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("deadline_guardian_theme");
    return savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("deadline_guardian_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("deadline_guardian_theme", "light");
    }
  }, [isDarkMode]);

  // Toast state supporting multiple operational triggers
  const [toast, setToast] = useState<{ 
    id: number; 
    message: string; 
    type: 'add' | 'completed' | 'deleted' | 'warning' | 'theme' | 'info';
    isDark?: boolean;
  } | null>(null);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (
    message: string, 
    type: 'add' | 'completed' | 'deleted' | 'warning' | 'theme' | 'info' = 'info'
  ) => {
    setToast({
      id: Date.now(),
      message,
      type
    });
  };

  const handleToggleTheme = () => {
    setIsDarkMode(prev => {
      const nextTheme = !prev;
      setToast({
        id: Date.now(),
        message: nextTheme ? "Dark mode enabled" : "Light mode enabled",
        type: "theme",
        isDark: nextTheme
      });
      return nextTheme;
    });
  };

  // Local/Offline Mode state to let users preserve their free tier Gemini quota
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    return localStorage.getItem("deadline_guardian_offline") === "true";
  });

  const handleToggleOfflineMode = () => {
    setIsOfflineMode(prev => {
      const nextVal = !prev;
      localStorage.setItem("deadline_guardian_offline", String(nextVal));
      showToast(
        nextVal 
          ? "Local Mode active: Instant offline plans enabled (Preserves API quota)." 
          : "AI Mode active: Online Gemini coaching enabled.", 
        "info"
      );
      return nextVal;
    });
  };

  // Controls state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>("all");
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>("all");
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>("all");
  const [sortBy, setSortBy] = useState<'deadline' | 'createdAt' | 'priority' | 'risk'>("deadline");
  const [mobileTab, setMobileTab] = useState<'tasks' | 'coach'>("tasks");

  // Load initial state
  useEffect(() => {
    const saved = localStorage.getItem("deadline_guardian_tasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Task[];
        setTasks(parsed);
        if (parsed.length > 0) {
          setSelectedTaskId(parsed[0].id);
        }
      } catch (e) {
        setTasks(INITIAL_MOCK_TASKS);
        setSelectedTaskId(INITIAL_MOCK_TASKS[0].id);
      }
    } else {
      setTasks(INITIAL_MOCK_TASKS);
      setSelectedTaskId(INITIAL_MOCK_TASKS[0].id);
    }
  }, []);

  // Save changes to localStorage
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("deadline_guardian_tasks", JSON.stringify(newTasks));
  };

  // Helper to parse dates securely
  const getDaysRemaining = (deadlineStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Call API to analyze a task with Gemini
  const triggerAiAnalysis = async (taskId: string, currentTasks: Task[]) => {
    const targetTask = currentTasks.find(t => t.id === taskId);
    if (!targetTask) return;

    // Set loading
    const tasksWithLoading = currentTasks.map(t => 
      t.id === taskId ? { ...t, aiLoading: true, aiError: undefined } : t
    );
    saveTasks(tasksWithLoading);

    try {
      const response = await fetch("/api/analyze-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: targetTask.title,
          deadline: targetTask.deadline,
          priority: targetTask.priority,
          description: targetTask.description || "",
          currentDate: new Date().toISOString().split("T")[0],
          offlineMode: isOfflineMode
        })
      });

      const responseText = await response.text();
      const status = response.status;

      let errorData: any = {};
      let isJson = false;
      try {
        errorData = JSON.parse(responseText);
        isJson = true;
      } catch (_) {}

      const isHtml = responseText.trim().startsWith("<") || 
                     responseText.toLowerCase().includes("<!doctype") || 
                     responseText.toLowerCase().includes("<html");

      if (!response.ok || isHtml || !isJson) {
        const msg = errorData.error || `HTTP error! Status: ${status}`;
        
        let errDetail = "";
        try {
          errDetail = JSON.stringify(errorData);
        } catch (_) {
          errDetail = String(errorData);
        }
        
        const fullErrText = `${msg} ${errDetail} ${responseText}`.toLowerCase();
        
        const isBusy = 
          status === 503 ||
          isHtml ||
          fullErrText.includes("503") ||
          fullErrText.includes("high demand") ||
          fullErrText.includes("busy") ||
          fullErrText.includes("overloaded") ||
          fullErrText.includes("resource exhausted") ||
          fullErrText.includes("rate limit") ||
          fullErrText.includes("unavailable");
          
        if (isBusy) {
          throw new Error("AI service is busy right now. Please try again in a few moments.");
        }
        throw new Error(msg || "Failed to analyze task.");
      }

      const rawAnalysis = errorData;
      
      // Inject IDs into returned milestones so they are toggleable
      const processedMilestones = (rawAnalysis.milestones || []).map((m: { title: string }, index: number) => ({
        id: `milestone-${Date.now()}-${index}`,
        title: m.title,
        completed: false
      }));

      const updatedTasks = tasksWithLoading.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            aiLoading: false,
            aiAnalysis: {
              riskScore: rawAnalysis.riskScore || "medium",
              riskExplanation: rawAnalysis.riskExplanation || "Custom assessment computed.",
              focusStep: rawAnalysis.focusStep || "Start planning your milestones.",
              milestones: processedMilestones,
              dayWisePlan: rawAnalysis.dayWisePlan || [],
              productivitySuggestions: rawAnalysis.productivitySuggestions || [],
              analyzedAt: new Date().toISOString()
            }
          };
        }
        return t;
      });

      saveTasks(updatedTasks);
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      const errMsg = err.message || "Failed to analyze task.";
      
      let errDetail = "";
      try {
        errDetail = JSON.stringify(err);
      } catch (_) {
        errDetail = String(err);
      }
      const fullErrText = `${errMsg} ${errDetail}`.toLowerCase();

      const isBusy = 
        fullErrText.includes("503") ||
        fullErrText.includes("high demand") ||
        fullErrText.includes("busy") ||
        fullErrText.includes("overloaded") ||
        fullErrText.includes("resource exhausted") ||
        fullErrText.includes("rate limit") ||
        fullErrText.includes("unavailable");

      const finalErrorMsg = isBusy 
        ? "AI service is busy right now. Please try again in a few moments."
        : errMsg;

      const updatedTasks = tasksWithLoading.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            aiLoading: false,
            aiError: finalErrorMsg
          };
        }
        return t;
      });
      saveTasks(updatedTasks);
    }
  };

  // Add a task
  const handleAddTask = (taskData: {
    title: string;
    deadline: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      deadline: taskData.deadline,
      priority: taskData.priority,
      description: taskData.description,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setSelectedTaskId(newTask.id);
    showToast(`"${newTask.title}" successfully guarded and queued!`, 'add');

    // Trigger AI analysis on background
    triggerAiAnalysis(newTask.id, updated);
  };

  // Toggle complete
  const handleToggleComplete = (taskId: string) => {
    let msg = "";
    let type: 'completed' | 'info' = 'completed';
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          msg = `"${t.title}" marked as complete! Excellent progress.`;
          type = "completed";
        } else {
          msg = `"${t.title}" marked as pending.`;
          type = "info";
        }
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        };
      }
      return t;
    });
    saveTasks(updated);
    if (msg) {
      showToast(msg, type);
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    const updated = tasks.filter(t => t.id !== taskId);
    saveTasks(updated);
    if (taskToDelete) {
      showToast(`"${taskToDelete.title}" removed from queue.`, 'deleted');
    }
    
    // Choose another task to select if the deleted one was selected
    if (selectedTaskId === taskId) {
      setSelectedTaskId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Re-analyze
  const handleReanalyze = (taskId: string) => {
    triggerAiAnalysis(taskId, tasks);
  };

  // Toggle single milestone checkbox
  const handleToggleMilestone = (taskId: string, milestoneId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId && t.aiAnalysis) {
        const updatedMilestones = t.aiAnalysis.milestones.map(m => 
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        return {
          ...t,
          aiAnalysis: {
            ...t.aiAnalysis,
            milestones: updatedMilestones
          }
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Compute Dashboard statistics
  const stats: DashboardStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let highRisk = 0;
    let medRisk = 0;
    let lowRisk = 0;
    
    tasks.forEach(t => {
      if (!t.completed) {
        const score = t.aiAnalysis?.riskScore;
        if (score === "high") highRisk++;
        else if (score === "medium") medRisk++;
        else if (score === "low") lowRisk++;
        else {
          // fallback calculation based on days
          const days = getDaysRemaining(t.deadline);
          if (days <= 2) highRisk++;
          else if (days <= 7) medRisk++;
          else lowRisk++;
        }
      }
    });

    return {
      totalTasks: total,
      completedTasks: completed,
      completionRate: rate,
      highRiskCount: highRisk,
      mediumRiskCount: medRisk,
      lowRiskCount: lowRisk,
      pendingTasksCount: total - completed
    };
  }, [tasks]);

  // Find the closest high/medium risk task to show as alert
  const closestTask = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) return null;
    
    return activeTasks.reduce((closest, current) => {
      const daysCurrent = getDaysRemaining(current.deadline);
      const daysClosest = getDaysRemaining(closest.deadline);
      return daysCurrent < daysClosest ? current : closest;
    }, activeTasks[0]);
  }, [tasks]);

  // Selected task ref
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Filter & Sort tasks list
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Status filter
    if (statusFilter === "pending") {
      result = result.filter(t => !t.completed);
    } else if (statusFilter === "completed") {
      result = result.filter(t => t.completed);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter(t => t.priority === priorityFilter);
    }

    // Risk filter
    if (riskFilter !== "all") {
      result = result.filter(t => t.aiAnalysis?.riskScore === riskFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      // Prioritize pending tasks at the top, completed tasks at the bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      if (sortBy === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "priority") {
        const priorityVal = { high: 3, medium: 2, low: 1 };
        return priorityVal[b.priority] - priorityVal[a.priority];
      }
      if (sortBy === "risk") {
        const riskVal = { high: 3, medium: 2, low: 1, undefined: 0 };
        const aRisk = a.aiAnalysis?.riskScore || "low";
        const bRisk = b.aiAnalysis?.riskScore || "low";
        return riskVal[bRisk] - riskVal[aRisk];
      }
      return 0;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, riskFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-800 dark:bg-slate-950 dark:text-slate-200 antialiased font-sans selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-200">
      
      {/* Top Navbar */}
      <nav id="navbar-top" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-500/10">
              <ShieldCheck className="w-5 sm:w-5.5 h-5 sm:h-5.5" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-display font-black text-slate-900 dark:text-white tracking-tight block truncate">
                Deadline Guardian <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <p className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-widest font-extrabold uppercase leading-none hidden sm:block">
                Coaching &amp; Execution Roadmap
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
            <a 
              href="https://ai.studio/build" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-150 font-medium hidden md:inline-block"
            >
              Google AI Studio
            </a>
            <div className="h-4 w-px bg-slate-200/80 dark:bg-slate-850 hidden md:inline-block"></div>
            
            {/* Dark Mode Toggle Button */}
            <button
              onClick={handleToggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 cursor-pointer shadow-3xs"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
 
            {/* Premium Coach Mode Selector (Toggle between Online AI and Local Offline fallback) */}
            <button
              onClick={handleToggleOfflineMode}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-[9px] sm:text-[10px] font-bold font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-3xs ${
                isOfflineMode 
                  ? "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/25" 
                  : "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/25"
              }`}
              title={isOfflineMode ? "Running in Local Offline Coaching Mode" : "Running in Online AI Coaching Mode"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOfflineMode ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500 animate-pulse'}`}></span>
              <span>{isOfflineMode ? "Local Mode" : "AI Mode"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dynamic Header Summary + High Level Stats */}
        <DashboardHeader 
          stats={stats} 
          closestTask={closestTask} 
          onSelectTask={(task) => {
            setSelectedTaskId(task.id);
            setMobileTab('coach');
          }}
        />

        {/* Mobile Segmented Workspace Navigation */}
        <div className="flex lg:hidden bg-white/95 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800/80 p-1.5 rounded-2xl gap-1.5 sticky top-16 z-40 backdrop-blur-md shadow-xs">
          <button
            onClick={() => setMobileTab('tasks')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              mobileTab === 'tasks'
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/10"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50/50 dark:bg-slate-950/40"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Queue ({filteredAndSortedTasks.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('coach')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              mobileTab === 'coach'
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/10"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50/50 dark:bg-slate-950/40"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Guardian Coach</span>
            {selectedTask && (
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Inputs, Tasks List, Search & Filters) */}
          <div className={`lg:col-span-7 space-y-6 ${mobileTab === 'tasks' ? 'block' : 'hidden lg:block'}`}>
            
            {/* Deploy New Task Card */}
            <TaskForm 
              onAddTask={handleAddTask} 
              onValidationError={(msg) => showToast(msg, 'warning')} 
            />

            {/* Controls Filter Area */}
            <TaskControls 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              riskFilter={riskFilter}
              onRiskFilterChange={setRiskFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
            />

            {/* Tasks Listing */}
            <div id="tasks-list-container" className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider font-mono flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-indigo-500" />
                  Your Protected Deadlines ({filteredAndSortedTasks.length})
                </h3>
              </div>

              {/* Congratulatory Celebration Card when all active tasks are complete */}
              {tasks.length > 0 && stats.pendingTasksCount === 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-2xs"
                >
                  {/* Custom CSS Confetti Particle Overlay */}
                  <ConfettiEffect />

                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="space-y-1 z-10 flex-1">
                    <h4 className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white">
                      Great job! You're all caught up!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                      All protected targets are secured. Your schedule is fully optimized.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono font-extrabold z-10 uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-450 px-3 py-1.5 rounded-full border border-emerald-500/20">
                    100% SECURED
                  </div>
                </motion.div>
              )}

              {tasks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-10 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto space-y-5 animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/40 shadow-2xs">
                    <ShieldCheck className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-display font-bold text-slate-900 dark:text-white">All Clear! No Deadlines Pending</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mx-auto">
                      Your schedule is perfectly secure. Add an action-oriented goal above or load our high-risk sample roadmap to see the AI Guardian Coach in action.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      saveTasks(INITIAL_MOCK_TASKS);
                      if (INITIAL_MOCK_TASKS.length > 0) {
                        setSelectedTaskId(INITIAL_MOCK_TASKS[0].id);
                      }
                      showToast("Sample targets loaded successfully.", "info");
                    }}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-indigo-500/10 transition-all duration-200 active:scale-98"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Load Sample Deadlines
                  </button>
                </div>
              ) : filteredAndSortedTasks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-8 text-center text-gray-500 dark:text-slate-400 shadow-xs">
                  <p className="text-sm font-medium">No deadlines match your filter criteria.</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Try clearing your filters or adding a new task above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredAndSortedTasks.map((t) => {
                    const isSelected = t.id === selectedTaskId;
                    const daysLeft = getDaysRemaining(t.deadline);
                    const risk = t.aiAnalysis?.riskScore || "low";
                    
                    // Calculate milestone progress for preview
                    const totalMilestones = t.aiAnalysis?.milestones.length || 0;
                    const completedMilestones = t.aiAnalysis?.milestones.filter(m => m.completed).length || 0;
                    const milestoneProgressPercent = totalMilestones > 0 
                      ? Math.round((completedMilestones / totalMilestones) * 100) 
                      : 0;

                    return (
                      <div
                        key={t.id}
                        id={`task-row-${t.id}`}
                        onClick={() => {
                          setSelectedTaskId(t.id);
                          setMobileTab('coach');
                        }}
                        className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 sm:gap-4 relative group hover:-translate-y-0.5 ${
                          isSelected 
                            ? "bg-gradient-to-r from-indigo-50/40 to-white dark:from-slate-900 dark:to-slate-900/70 border-indigo-200/80 dark:border-indigo-500/40 ring-4 ring-indigo-500/5 dark:ring-indigo-500/10 shadow-sm" 
                            : "bg-white dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                        }`}
                      >
                        {/* Selected vertical status flag bar */}
                        {isSelected && (
                          <span className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 dark:bg-indigo-500 rounded-r-full"></span>
                        )}

                        <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                           <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                              t.completed 
                                ? "bg-emerald-500" 
                                : risk === "high" 
                                ? "bg-red-500 animate-pulse" 
                                : risk === "medium" 
                                ? "bg-amber-500" 
                                : "bg-teal-500"
                            }`}></span>
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                              {t.priority} priority
                            </span>
                            {t.aiAnalysis && (
                              <span className={`text-[9px] font-bold uppercase tracking-widest font-mono px-2 py-0.5 rounded-full border ${
                                risk === 'high' 
                                  ? 'bg-red-50/80 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20' 
                                  : risk === 'medium' 
                                  ? 'bg-amber-50/80 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' 
                                  : 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                              }`}>
                                {risk} risk
                              </span>
                            )}
                            {t.aiLoading && (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-400 animate-pulse bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-500/20">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                                ANALYZING...
                              </span>
                            )}
                          </div>

                          <h4 className={`text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white break-words line-clamp-2 md:line-clamp-none tracking-tight leading-snug ${t.completed ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}>
                            {t.title}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 px-1.5 py-0.5 rounded-md text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{t.deadline}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className={`font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                              t.completed 
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20' 
                                : daysLeft <= 2 
                                ? 'text-red-600 dark:text-red-400 font-extrabold' 
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {t.completed 
                                ? "Completed" 
                                : daysLeft < 0 
                                ? "Overdue" 
                                : daysLeft === 0 
                                ? "Today!" 
                                : daysLeft === 1 
                                ? "Tomorrow" 
                                : `${daysLeft} days left`}
                            </span>

                            {totalMilestones > 0 && (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/60 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-100/40 dark:border-indigo-500/20 whitespace-nowrap">
                                  <span>{completedMilestones}/{totalMilestones} checkpoints</span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <ChevronRight className={`w-5 h-5 shrink-0 text-slate-300 dark:text-slate-600 transition-all duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 ${
                          isSelected ? "text-indigo-600 dark:text-indigo-400" : ""
                        }`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (Tailored AI Coach Insights Details) */}
          <div className={`lg:col-span-5 sticky top-24 ${mobileTab === 'coach' ? 'block' : 'hidden lg:block'}`}>
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider font-mono flex items-center gap-2 px-1">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                Coach Panel
              </h3>
              <TaskDetail 
                task={selectedTask}
                onToggleMilestone={handleToggleMilestone}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
                onReanalyze={handleReanalyze}
                onBackToQueue={() => setMobileTab('tasks')}
              />
            </div>
          </div>

        </div>

      </main>

      {/* Humble footer */}
      <footer className="border-t border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-12 mt-16 text-center text-sm text-gray-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-display font-bold text-gray-700 dark:text-slate-300">Deadline Guardian AI</p>
          <p className="max-w-md mx-auto text-xs text-gray-400 dark:text-slate-500">
            A premium personal productivity guardian powered by Gemini. Built with React, Tailwind CSS, Express, and @google/genai.
          </p>
        </div>
      </footer>

      {/* Elegant Toast Notification Panel */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-5 right-5 z-[9999] flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 py-3.5 px-4 rounded-2xl shadow-xl max-w-sm pointer-events-auto"
          >
            {(() => {
              let icon = <ListTodo className="w-4 h-4 text-indigo-500 animate-pulse" />;
              let subtitle = "Notification";
              let iconBg = "bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100/50 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400";
              
              if (toast.type === "add") {
                icon = <Plus className="w-4 h-4 text-emerald-500 animate-bounce" />;
                subtitle = "Task Queued";
                iconBg = "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100/50 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400";
              } else if (toast.type === "completed") {
                icon = <ShieldCheck className="w-4 h-4 text-emerald-500" />;
                subtitle = "Goal Secured";
                iconBg = "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100/50 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400";
              } else if (toast.type === "deleted") {
                icon = <Clock className="w-4 h-4 text-rose-500" />;
                subtitle = "Task Removed";
                iconBg = "bg-rose-50 dark:bg-rose-950/50 border border-rose-100/50 dark:border-rose-900/40 text-rose-600 dark:text-rose-450";
              } else if (toast.type === "warning") {
                icon = <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />;
                subtitle = "Action Required";
                iconBg = "bg-amber-50 dark:bg-amber-950/50 border border-amber-100/50 dark:border-amber-900/40 text-amber-600 dark:text-amber-400";
              } else if (toast.type === "theme") {
                icon = toast.isDark ? (
                  <Moon className="w-4 h-4 text-indigo-500 animate-pulse" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
                );
                subtitle = "Theme Synchronized";
                iconBg = "bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800/40";
              }

              return (
                <>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-xl border ${iconBg}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {toast.message}
                    </p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-wider font-semibold uppercase leading-none mt-0.5">
                      {subtitle}
                    </p>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline pure CSS-based premium confetti component
function ConfettiEffect() {
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // horizontal start point %
      size: Math.random() * 6 + 4, // particle size
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: Math.random() * 2.5 + 2,
      angle: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute rounded-xs animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `-15px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.angle}deg)`,
            opacity: 0.8,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
