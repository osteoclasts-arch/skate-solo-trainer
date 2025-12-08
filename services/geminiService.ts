
declare var process: {
  env: {
    API_KEY: string;
  };
};

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Trick, SessionSettings, Difficulty, TrickCategory, SessionResult, TrickTip, Language, AnalyticsInsight, VisionAnalysis } from "../types";
import { TRICK_TIPS_DB, BASE_TRICKS } from "../constants";

const apiKey = process.env.API_KEY || '';

// Safely initialize GenAI only if key exists (handled in calls)
const getAI = () => new GoogleGenAI({ apiKey });

export const generateAISession = async (settings: SessionSettings): Promise<Trick[]> => {
  if (!apiKey) {
    console.warn("No API Key found, returning empty list from AI service.");
    return [];
  }

  const ai = getAI();
  // Filter stances based on settings
  const stanceInstructions = settings.selectedStances.length > 0 
    ? `Apply a random mix of these stances ONLY: ${settings.selectedStances.join(', ')}.`
    : `Apply a random mix of stances suitable for the difficulty level.`;

  const prompt = `
    Generate a list of skateboard tricks for a training session.
    Count: ${settings.trickCount}.
    Difficulty Level: ${settings.difficulty}.
    Allowed Categories: ${settings.categories.join(', ')}.
    Stances: ${stanceInstructions}.
    User Focus: ${settings.customFocus || "Balanced session"}.
    
    The output should be a JSON array of tricks. Each trick must have a name, category, difficulty, and stance.
  `;

  // Define schema for structured output
  const trickSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        category: { type: Type.STRING, enum: Object.values(TrickCategory) },
        difficulty: { type: Type.STRING, enum: Object.values(Difficulty) },
        stance: { type: Type.STRING },
      },
      required: ["name", "category", "difficulty", "stance"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: trickSchema,
        systemInstruction: "You are a professional skateboarding coach. Generate realistic trick lists."
      },
    });

    const text = response.text;
    if (!text) return [];
    
    const rawTricks = JSON.parse(text);
    return rawTricks.map((t: any, idx: number) => ({
      id: `ai-trick-${idx}-${Date.now()}`,
      name: t.name,
      category: t.category,
      difficulty: t.difficulty,
      stance: t.stance
    }));
  } catch (error) {
    console.error("Error generating AI session:", error);
    return [];
  }
};

export const getSessionAnalysis = async (result: SessionResult, language: Language): Promise<string> => {
  const fallbackMsg = language === 'KR' 
    ? "수고하셨습니다! 꾸준히 연습하여 일관성을 높이세요." 
    : "Great session! Keep practicing to improve your consistency.";

  if (!apiKey) return fallbackMsg;

  const ai = getAI();
  
  const landedNames = result.trickHistory.filter(t => t.landed).map(t => `${t.trick.stance ? t.trick.stance + ' ' : ''}${t.trick.name}`).join(', ');
  const failedNames = result.trickHistory.filter(t => !t.landed).map(t => `${t.trick.stance ? t.trick.stance + ' ' : ''}${t.trick.name}`).join(', ');

  const langInstruction = language === 'KR' 
    ? "Respond in Korean (Hangul). Use natural, encouraging coaching tone." 
    : "Respond in English.";

  const prompt = `
    Analyze this skateboarding session.
    Landed: ${landedNames || 'None'}.
    Failed: ${failedNames || 'None'}.
    Total Success Rate: ${Math.floor((result.landedCount / result.totalTricks) * 100)}%.
    
    Provide a short, motivating paragraph (max 3 sentences) with specific advice on what to improve based on the failures. Speak like a skate coach. ${langInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });
    return response.text || fallbackMsg;
  } catch (error) {
    console.error("Error getting analysis:", error);
    return fallbackMsg;
  }
};

export const getTrickTip = async (trickName: string, language: Language): Promise<TrickTip> => {
    // 1. Check Local Database first
    const dbTips = TRICK_TIPS_DB[trickName];
    if (dbTips && dbTips.length > 0) {
        // Return a random tip from DB
        const randomTip = dbTips[Math.floor(Math.random() * dbTips.length)];
        return randomTip;
    }

    // 2. Fallback to AI
    if (!apiKey) {
        return { 
            text: { EN: "Visualize the landing and commit your shoulders.", KR: "착지를 시각화하고 어깨를 맡기세요." },
            source: "AI Coach",
            video: "General Basics"
        };
    }

    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Give me one pro tip for landing a ${trickName} on a skateboard. Max 15 words. Speak like a pro. Return output in English and Korean. Format: EN|KR`,
        });
        const [en, kr] = (response.text || "").split("|");
        return {
            text: { EN: en || "Commit to the landing.", KR: kr || "착지에 집중하세요." },
            source: "AI Coach",
            video: `How to ${trickName}`
        };
    } catch (e) {
        return {
            text: { EN: "Commit to the landing.", KR: "착지에 집중하세요." },
            source: "AI Coach",
            video: `How to ${trickName}`
        };
    }
}

export const getAnalyticsInsight = async (
    stats: { 
        totalSessions: number, 
        successRate: number, 
        weaknesses: {name: string, rate: number}[],
        recentHistory: {date: string, rate: number}[]
    }, 
    language: Language,
    daysSkating?: number
): Promise<AnalyticsInsight | null> => {
    if (!apiKey) return null;

    const ai = getAI();
    
    const insightSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            diagnosis: { type: Type.STRING, description: "One-line overall assessment title (Korean)" },
            summary: { type: Type.STRING, description: "2-3 sentences summarizing performance (Korean)" },
            weaknessAnalysis: { type: Type.STRING, description: "Comment on the specific weaknesses (Korean)" },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 specific actionable tips (Korean)" },
            aiFeedback: { type: Type.STRING, description: "Motivating closing comment (Korean)" }
        },
        required: ["diagnosis", "summary", "weaknessAnalysis", "improvementSuggestions", "aiFeedback"]
    };

    let experienceContext = "";
    if (daysSkating !== undefined) {
        if (daysSkating <= 60) {
            experienceContext = "User is a BEGINNER (0-60 days). Be very encouraging. Focus on basics like Ollie, balance, and having fun. Don't be too harsh.";
        } else if (daysSkating <= 180) {
            experienceContext = "User is INTERMEDIATE (61-180 days). Challenge them to improve consistency and try harder tricks. Focus on technique refinement.";
        } else {
            experienceContext = "User is ADVANCED (180+ days). Provide high-level pro tips, focus on style, fluidity, and perfect consistency.";
        }
    }

    const prompt = `
        Act as a professional skateboard coach. Analyze this player's progression data.
        Language: ${language === 'KR' ? 'Korean (Hangul) ONLY' : 'English'}.
        
        Context: ${experienceContext}
        Days Skating: ${daysSkating || 'Unknown'}.

        Stats:
        - Total Sessions: ${stats.totalSessions}
        - Global Success Rate: ${stats.successRate}%
        - Top Weaknesses: ${stats.weaknesses.map(w => `${w.name} (${w.rate}% landed)`).join(', ')}
        - Recent History (Last 5): ${stats.recentHistory.map(h => `${h.date}: ${h.rate}%`).join(', ')}

        Provide a comprehensive diagnosis.
        1. Diagnosis: A catchy title for their current state.
        2. Summary: Analyze the trend. Are they improving? Stagnating?
        3. Weakness Analysis: Specific advice for the listed weaknesses.
        4. Improvements: 3 distinct bullet points for what to practice next.
        5. AI Feedback: A friendly, motivating final word tailored to their experience level.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: insightSchema
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as AnalyticsInsight;
        }
        return null;
    } catch (error) {
        console.error("Error generating analytics insight:", error);
        return null;
    }
};

const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (!reader.result) {
                reject(new Error("Failed to read file"));
                return;
            }
            const base64String = reader.result as string;
            // Robustly extract base64 data: check if comma exists before splitting
            const base64Data = base64String.includes(',') 
                ? base64String.split(',')[1] 
                : base64String;
            
            resolve({
                inlineData: {
                    data: base64Data,
                    // Provide fallback mimeType to prevent SDK errors if file.type is empty
                    mimeType: file.type || 'video/mp4'
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// --- VISION ANALYSIS ---

export const analyzeMedia = async (
    file: File, 
    language: Language, 
    userContext: string[] = [],
    trickHint?: string,
    startTime?: number,
    endTime?: number
): Promise<VisionAnalysis | null> => {
    if (!apiKey) return null;

    const ai = getAI();

    // Use full base tricks list
    const allTricks = BASE_TRICKS.map(t => t.name).join(", ");
    
    // Create User Context string
    const contextStr = userContext.length > 0 
        ? `The user has recently practiced or corrected these tricks: ${userContext.join(", ")}. Prioritize these if the visual evidence is ambiguous.` 
        : "";

    // Time Range Context
    const timeRangeStr = (startTime !== undefined && endTime !== undefined)
        ? `IMPORTANT: Analyze the video strictly between timestamp ${startTime}s and ${endTime}s. IGNORE any actions before ${startTime}s or after ${endTime}s.`
        : "";

    const prompt = `
# Role
You are the world's most precise AI Skateboard Trick Analyst and Competition Judge. Your goal is to identify the exact name of the skateboard trick in the video by analyzing the physics of the board and the rider's interaction with obstacles.

# Analysis Scope
${timeRangeStr}

# Analysis Logic (Chain of Thought)
You must analyze the video step-by-step in the following order. Do not jump to a conclusion until you have evaluated all factors.

## STEP 1: Stance & Pop Mechanism
- Analyze which foot pops the board (Back foot vs. Front foot).
- Determine the approach (Forward or Backward/Fakie).
- Identify the starting stance context if possible (Ollie, Nollie, Fakie, Switch).

## STEP 2: Board Dynamics (CRITICAL)
Analyze the board's rotation on 3 axes INDEPENDENTLY from the rider's body:
1. **Flip Axis (X-axis):** Does the board flip along its length? (e.g., Kickflip, Heelflip)
2. **Shove-it Axis (Y-axis):** Does the board spin horizontally? (e.g., Shove-it, 360 Shove-it)
3. **Combined:** Is it a combination? (e.g., Kickflip + 360 Shove-it = Tre Flip/360 Flip)
   - *Warning:* If the board flips but the body also rotates 180, check if it's a "Sex Change/Body Varial" or a "180 Flip".

## STEP 3: Body Dynamics
- Does the rider's body rotate? (180, 360, etc.)
- Does the body rotate in the SAME direction as the board, or OPPOSITE? (e.g., Bigspin vs. Varial)
- *Crucial Check:* If the body rotates but the board does NOT flip, it is a rotation trick (e.g., Frontside 180). If the board flips while the body rotates, it is a flip variation (e.g., Frontside Flip).

## STEP 4: Obstacle Interaction (If applicable)
- Is the rider interacting with a rail, ledge, or coping?
- **Trucks:** Are the trucks touching? (50-50, 5-0, Nosegrind, K-Grind/Crooked)
- **Deck/Wood:** Is the wood touching? (Boardslide, Lipslide, Noseslide, Tailslide)
- *Differentiation:* Distinguish between Boardslide (rail between legs) and Lipslide (tail passes over rail).

## STEP 5: Final Identification
Combine findings from Steps 1-4 to name the trick. Use standard skateboarding terminology (e.g., "Nollie Tre Flip", "Backside Smith Grind").

# Constraints & Rules
- **Look at the Board First:** The board's movement defines the trick. The body style is secondary.
- **Ignore "Style" Movements:** Do not confuse arm waving or pre-winding with the actual trick mechanics.
- **Landing:** Check if the rider lands clean. If they land and revert immediately, note it, but identify the main trick first.
- If the trick is ambiguous, list the two most likely possibilities and explain the visual evidence for the primary choice.

# Input Context
User Hint (Self-reported): ${trickHint || "None"}
User History: ${contextStr}
Possible Candidates: [${allTricks}]

# Output Format
You MUST return a JSON object with the following fields. 
IMPORTANT: 'feedbackText' and 'improvementTip' MUST be in KOREAN (Hangul).

{
  "trickName": "String (The Final Trick Name from Step 5)",
  "confidence": 0.0 to 1.0,
  "stance_pop": "String (Analysis from Step 1)",
  "board_rotation": "String (Analysis from Step 2)",
  "body_rotation": "String (Analysis from Step 3)",
  "obstacle_interaction": "String (Analysis from Step 4)",
  "reasoning": "String (Brief explanation of why this is the specific trick)",
  "score": 0-100 (Integer, based on cleanliness and height),
  "heightMeters": 0.0-2.0 (Float, approximate jump height),
  "feedbackText": "String (KOREAN: Detailed coaching feedback based on the analysis)",
  "improvementTip": "String (KOREAN: One specific tip to improve technique)"
}
    `;

    try {
        if (!file) throw new Error("No file provided");
        const videoPart = await fileToPart(file);

        // Using gemini-3-pro-preview for higher reasoning capabilities
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", 
            contents: {
                parts: [videoPart, { text: prompt }]
            },
            config: {
                responseMimeType: "application/json",
                temperature: 0.1 // Low temperature for deterministic physics judgment
            }
        });

        if (response.text) {
             const data = JSON.parse(response.text);
             return {
                 id: Date.now().toString(),
                 timestamp: new Date().toISOString(),
                 trickName: data.trickName || data.trick_name || "UNKNOWN",
                 isLanded: data.score > 40,
                 confidence: data.confidence || 0.8,
                 score: data.score,
                 heightMeters: data.heightMeters,
                 rotationDegrees: 0, // Not explicitly returned by this prompt, default to 0
                 feedbackText: data.feedbackText,
                 improvementTip: data.improvementTip
             };
        }
        return null;
    } catch (error) {
        console.error("Error analyzing media:", error);
        return null;
    }
};

export const generateCoachingFeedback = async (
    analysis: VisionAnalysis, 
    language: Language
): Promise<{ feedback: string, tips: string }> => {
    if (analysis.feedbackText && analysis.improvementTip) {
        return { feedback: analysis.feedbackText, tips: analysis.improvementTip };
    }
    
    return { 
        feedback: "분석 완료.", 
        tips: "꾸준히 연습하세요." 
    };
};
