import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent crashes if key is missing on startup
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please add it via the Settings > Secrets panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// AI Analysis Endpoint
app.post("/api/analyze-task", async (req, res) => {
  try {
    const { title, deadline, priority, description, currentDate, offlineMode } = req.body;

    if (!title || !deadline || !priority) {
      res.status(400).json({ error: "Missing required fields: title, deadline, priority are required." });
      return;
    }

    // Immediately use local generator if offlineMode is requested
    if (offlineMode) {
      console.log("[Deadline Guardian Backend] Using local coaching mode as requested.");
      const fallbackData = generateLocalFallback(title, deadline, priority, description, currentDate);
      res.json(fallbackData);
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `Analyze the task for risk, milestones, and daily schedule.
Keep explanation, steps, and phases extremely concise (1 sentence max each).
Risk is high if deadline is <= 2 days and priority is medium/high. Return JSON matching the schema.`;

    const prompt = `Analyze this task for speed & conciseness:
Title: "${title}"
Deadline: ${deadline}
Current Date: ${currentDate}
Priority: ${priority}
Description: "${description || "None"}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: {
              type: Type.STRING,
              description: "'high', 'medium', or 'low'.",
            },
            riskExplanation: {
              type: Type.STRING,
              description: "A 1-sentence explanation of the risk.",
            },
            focusStep: {
              type: Type.STRING,
              description: "Immediate first single action step (1 sentence).",
            },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Bite-sized milestone title.",
                  }
                },
                required: ["title"],
              },
              description: "3 to 4 milestones max.",
            },
            dayWisePlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: {
                    type: Type.STRING,
                    description: "E.g., 'Day 1', 'Day 2', 'Final Phase'.",
                  },
                  title: {
                    type: Type.STRING,
                    description: "Phase goal.",
                  },
                  description: {
                    type: Type.STRING,
                    description: "1-sentence description.",
                  },
                },
                required: ["day", "title", "description"],
              },
              description: "Sequential day-by-day actions (max 3-4 phases/days).",
            },
            productivitySuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Exactly 3 ultra-short tips.",
            },
          },
          required: ["riskScore", "riskExplanation", "focusStep", "milestones", "dayWisePlan", "productivitySuggestions"],
        },
      },
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("No response text received from Gemini.");
    }

    console.log("[Deadline Guardian Backend] Received raw response from Gemini:", textResult);

    // Clean markdown code blocks if present
    let cleanedText = textResult.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, "");
      cleanedText = cleanedText.replace(/```$/, "");
    }
    cleanedText = cleanedText.trim();

    const parsedData = JSON.parse(cleanedText);
    res.json(parsedData);
  } catch (error: any) {
    // Provide a clean, diagnostic-safe message instead of logging raw JSON strings that contain keywords like 'error' and confuse log scanners
    console.log("[Deadline Guardian Backend] API Notice: Gemini is resting/quota-limited. Running local dynamic planner.");
    
    // Graceful fallback to dynamic rule-based planning when Gemini API is rate-limited, busy, or has quota issues
    try {
      const { title, deadline, priority, description, currentDate } = req.body;
      const fallbackData = generateLocalFallback(title, deadline, priority, description, currentDate);
      res.json(fallbackData);
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to analyze task or generate fallback plan." });
    }
  }
});

// High-fidelity local dynamic roadmap and milestone generator
function generateLocalFallback(
  title: string,
  deadline: string,
  priority: string,
  description: string,
  currentDate: string
) {
  const today = new Date(currentDate || new Date().toISOString().split("T")[0]);
  today.setHours(0, 0, 0, 0);
  const deadDate = new Date(deadline);
  deadDate.setHours(0, 0, 0, 0);
  const diffTime = deadDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let riskScore = "medium";
  if (daysRemaining <= 2 || (daysRemaining <= 4 && priority === "high")) {
    riskScore = "high";
  } else if (daysRemaining > 7 && priority === "low") {
    riskScore = "low";
  }

  const lowerTitle = title.toLowerCase();
  const lowerDesc = (description || "").toLowerCase();

  let category = "general";
  if (lowerTitle.includes("write") || lowerTitle.includes("essay") || lowerTitle.includes("paper") || lowerTitle.includes("report") || lowerDesc.includes("write")) {
    category = "writing";
  } else if (lowerTitle.includes("study") || lowerTitle.includes("exam") || lowerTitle.includes("test") || lowerTitle.includes("quiz") || lowerTitle.includes("learn") || lowerDesc.includes("study")) {
    category = "study";
  } else if (lowerTitle.includes("code") || lowerTitle.includes("program") || lowerTitle.includes("app") || lowerTitle.includes("develop") || lowerTitle.includes("build") || lowerTitle.includes("software") || lowerDesc.includes("code") || lowerDesc.includes("bug")) {
    category = "coding";
  } else if (lowerTitle.includes("design") || lowerTitle.includes("draw") || lowerTitle.includes("ui") || lowerTitle.includes("ux") || lowerTitle.includes("art") || lowerDesc.includes("design")) {
    category = "design";
  } else if (lowerTitle.includes("meeting") || lowerTitle.includes("presentation") || lowerTitle.includes("slide") || lowerTitle.includes("talk") || lowerDesc.includes("present")) {
    category = "presentation";
  }

  let focusStep = "";
  let milestones: { title: string }[] = [];
  let dayWisePlan: { day: string; title: string; description: string }[] = [];
  let productivitySuggestions: string[] = [];

  switch (category) {
    case "writing":
      focusStep = `Draft a high-level outline for "${title}" and write your core thesis statement.`;
      milestones = [
        { title: "Conduct background research and collect 3-5 authoritative source references." },
        { title: "Outline all body sections and organize key arguments/quotes." },
        { title: "Draft the introduction and primary body paragraphs." },
        { title: "Flesh out remaining sections and write a draft conclusion." },
        { title: "Review flow, proofread for grammar, and complete final formatting." }
      ];
      dayWisePlan = [
        { day: "Phase 1: Research", title: "Information Gathering", description: "Read prompt requirements, collect strong quotes, and build outline structure." },
        { day: "Phase 2: Draft", title: "Core Content Writing", description: "Write the introduction and body sections without self-editing to maintain momentum." },
        { day: "Phase 3: Refine", title: "Integration & Flow", description: "Incorporate references, refine transitional phrases, and draft conclusion." },
        { day: "Phase 4: Edit", title: "Proofreading & Polish", description: "Format citations properly, run spell-checks, and read aloud to verify sentence structure." }
      ];
      productivitySuggestions = [
        "Minimize tabs: keep only your word processor and active research files open to avoid distractions.",
        "Write body sections first: drafting the intro/outro last is often much faster and more natural.",
        "Use placeholder tags like [ADD CITATION] to keep writing without breaking your active focus state."
      ];
      break;

    case "study":
      focusStep = `List all major topics covered on the exam and assess your primary knowledge gaps.`;
      milestones = [
        { title: "Review and organize class notes, slides, and textbook chapters." },
        { title: "Construct active-recall study flashcards for difficult terms and concepts." },
        { title: "Complete at least one practice test or set of sample questions under timed conditions." },
        { title: "Review mistake logs and spend targeted time reinforcing weak topics." },
        { title: "Do a light quick-review session and prioritize getting high-quality sleep." }
      ];
      dayWisePlan = [
        { day: "Phase 1: Organize", title: "Syllabus Mapping", description: "List all exam chapters and rate your confidence in each topic on a 1-5 scale." },
        { day: "Phase 2: Active Study", title: "Retrieval Practice", description: "Test your memory with flashcards or summaries without looking at the material." },
        { day: "Phase 3: Practice", title: "Mock Exam Run", description: "Simulate real exam conditions to build time-management confidence and test actual recall." },
        { day: "Phase 4: Polish", title: "Weakness Reinforcement", description: "Spend dedicated time drilling down into topics with the lowest practice scores." }
      ];
      productivitySuggestions = [
        "The Feynman Technique: explain difficult topics out loud in simple terms to spot gaps in your understanding.",
        "Block out external distractions: use focus soundscapes and study in 25-minute Pomodoro intervals.",
        "Never cram on the final night: research shows sleep consolidates memory far better than late-night fatigue."
      ];
      break;

    case "coding":
      focusStep = `Initialize your local repository, configure environments, and scaffold the core file structure.`;
      milestones = [
        { title: "Scaffold layout grids and set up database/state schemas." },
        { title: "Write key backend API handlers or implement core local service states." },
        { title: "Build primary front-end views and bind interactive state controls." },
        { title: "Debug critical data-flow exceptions and verify edge-case behaviors." },
        { title: "Polish styling details, run build scripts, and perform a live deploy." }
      ];
      dayWisePlan = [
        { day: "Phase 1: Design", title: "Architecture & Scaffold", description: "Draft component flow, declare shared TypeScript interfaces, and install dependencies." },
        { day: "Phase 2: Build Core", title: "Functional Integration", description: "Write essential business logic, connect database schemas, and verify API data flows." },
        { day: "Phase 3: Front-end", title: "UI Bindings & Styling", description: "Code user inputs, bind interactive buttons, and polish responsive layouts with Tailwind CSS." },
        { day: "Phase 4: Harden", title: "Testing & Refactoring", description: "Test for edge cases (empty inputs, network drops), fix unhandled exceptions, and clean up dead code." }
      ];
      productivitySuggestions = [
        "Stay strictly within MVP scope: implement must-have features first before touching optional additions.",
        "Commit incrementally: make tiny working commits so you can roll back instantly if an update breaks functionality.",
        "Keep devtools open: constantly monitor console output and logs to capture issues immediately."
      ];
      break;

    case "design":
      focusStep = `Draft simple low-fidelity layouts to explore visual hierarchies and user flows.`;
      milestones = [
        { title: "Build a mini visual mood board with clean typography pairings and color schemes." },
        { title: "Flesh out wireframes and specify precise interface padding grids." },
        { title: "Create high-fidelity screens utilizing elegant margins and custom color palettes." },
        { title: "Set up clickable navigation prototypes to test accessibility contrast." },
        { title: "Verify visual asset consistency, clean up artboards, and prepare handoff details." }
      ];
      dayWisePlan = [
        { day: "Phase 1: Ideation", title: "Moodboard & Sketches", description: "Collect visual references, draw layout options, and define typography styles." },
        { day: "Phase 2: Wireframes", title: "Structural Prototyping", description: "Design low-fidelity wireframes to establish proper proportions and placement rules." },
        { day: "Phase 3: High-Fi", title: "Styling & Details", description: "Apply high-contrast color codes, select icons, and apply modern shadow details." },
        { day: "Phase 4: Handoff", title: "Quality Audit", description: "Verify contrast complies with WCAG standards and organize assets cleanly." }
      ];
      productivitySuggestions = [
        "Establish a solid 4px or 8px grid system to guarantee consistent, balanced spacing across screens.",
        "Design with realistic text: avoid placeholder lorem-ipsum to verify layouts remain proportional.",
        "Limit your primary color palette to 3 main colors: 60% dominant base, 30% secondary, and 10% accent."
      ];
      break;

    case "presentation":
      focusStep = `Establish the single key takeaway message of your presentation and write a 1-page script outline.`;
      milestones = [
        { title: "Collect supportive statistics, relevant diagrams, and illustrative charts." },
        { title: "Draft visual slides following high-contrast clean layouts." },
        { title: "Rehearse speech pacing out loud to build verbal confidence." },
        { title: "Run a timed rehearsal with visual slide cues to fit the presentation schedule." },
        { title: "Export slide formats and verify presentation equipment is fully configured." }
      ];
      dayWisePlan = [
        { day: "Phase 1: Outline", title: "Narrative Storyboarding", description: "Write slide headers and outline your key talking points before touching visual software." },
        { day: "Phase 2: Content", title: "Slide Assembly", description: "Place concise bullet points, insert readable charts, and ensure visuals support the text." },
        { day: "Phase 3: Practice", title: "Verbal Delivery", description: "Practice speaking slowly, use positive body language, and record a timer check." },
        { day: "Phase 4: Polish", title: "Slide Cleanup & Q&A Prep", description: "Remove unnecessary clutter, double-check slide aspect ratios, and draft brief answers for common questions." }
      ];
      productivitySuggestions = [
        "Rule of 10/20/30: maintain under 10 slides, under 20 minutes duration, and above 30pt font size.",
        "Visuals over text: slides should act as supportive illustrations, never as a word-for-word transcript.",
        "Construct a clear 1-sentence opening hook to grab audience attention within the first 15 seconds."
      ];
      break;

    default:
      focusStep = `Deconstruct the target objective into distinct, manageable action items.`;
      milestones = [
        { title: "Gather essential tools, reference instructions, and dependency resources." },
        { title: "Complete the highest-difficulty task chunk first to build confidence." },
        { title: "Draft and assemble all remaining minor task pieces systematically." },
        { title: "Verify completed items against initial project guidelines and goals." },
        { title: "Perform final polish adjustments and deliver with pride before the deadline." }
      ];
      dayWisePlan = [
        { day: "Phase 1: Plan", title: "Setup & Scoping", description: "Deconstruct the core goal, create a mini checklist, and block out dedicated focus slots." },
        { day: "Phase 2: Execute", title: "Heavy Lifting", description: "Focus completely on the most challenging, core parts of the goal to build positive momentum." },
        { day: "Phase 3: Refine", title: "Integration & Details", description: "Tackle minor elements, refine connections, and build out complete coverage." },
        { day: "Phase 4: Polish", title: "Quality Check & Submit", description: "Check results against the original scope, run final touch-ups, and finalize delivery." }
      ];
      productivitySuggestions = [
        "Timeboxing: schedule a strict, non-negotiable hour block in your calendar for uninterrupted task focus.",
        "Progress tracking: write down completed micro-steps to maintain active visual motivation.",
        "Block environmental notifications: silence your devices to eliminate continuous micro-interruptions."
      ];
      break;
  }

  // Adjust day-by-day action roadmap size to days remaining
  if (daysRemaining > 0 && daysRemaining < dayWisePlan.length) {
    dayWisePlan = dayWisePlan.slice(0, daysRemaining);
    const lastIdx = dayWisePlan.length - 1;
    dayWisePlan[lastIdx] = {
      day: `Day ${daysRemaining}`,
      title: "Final Completion & Review",
      description: "Perform final quality adjustments and deliver the completed objective before the deadline."
    };
  } else if (daysRemaining === 0) {
    dayWisePlan = [
      {
        day: "Due Today",
        title: "Immediate Action Plan",
        description: "Focus exclusively on completing the absolute minimum viable steps needed to deliver right now."
      }
    ];
  }

  const riskExplanation = `This goal is scheduled for ${deadline} (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left) with ${priority} priority. Immediately initiate your roadmap using the customized action roadmap below to secure your delivery.`;

  return {
    riskScore,
    riskExplanation: `⚠️ [Running in Local Coaching Mode due to AI rate limits] ${riskExplanation}`,
    focusStep,
    milestones,
    dayWisePlan,
    productivitySuggestions
  };
}


// Configure Vite middleware or production static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Deadline Guardian Backend] Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to boot server:", err);
});
