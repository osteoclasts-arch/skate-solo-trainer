
declare var process: {
  env: {
    API_KEY: string;
  };
};

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Trick, SessionSettings, Difficulty, TrickCategory, SessionResult, TrickTip, Language, AnalyticsInsight, VisionAnalysis, TrackingDataPoint } from "../types";
import { TRICK_TIPS_DB, BASE_TRICKS } from "../constants";

const apiKey = process.env.API_KEY || '';

// Safely initialize GenAI only if key exists (handled in calls)
const getAI = () => new GoogleGenAI({ apiKey });

/**
 * Helper to clean JSON string from AI response.
 * Robustly extracts the JSON object or array from the text.
 * Throws error if no valid JSON structure is found to prevent SyntaxError in JSON.parse
 */
const cleanJson = (text: string): string => {
  if (!text) throw new Error("Empty response from AI");

  // 1. Remove generic markdown code block indicators
  let clean = text.replace(/```json/g, '').replace(/```/g, '');

  // 2. Locate the first '{' or '['
  const firstCurly = clean.indexOf('{');
  const firstSquare = clean.indexOf('[');
  
  let startIndex = -1;
  let isObject = false;

  if (firstCurly !== -1 && firstSquare !== -1) {
    if (firstCurly < firstSquare) {
      startIndex = firstCurly;
      isObject = true;
    } else {
      startIndex = firstSquare;
    }
  } else if (firstCurly !== -1) {
    startIndex = firstCurly;
    isObject = true;
  } else if (firstSquare !== -1) {
    startIndex = firstSquare;
  }

  // CRITICAL FIX: If no JSON start found, throw error instead of returning garbage
  if (startIndex === -1) {
      throw new Error("No JSON object or array found in response");
  }

  // 3. Locate the last '}' or ']' based on type
  const lastCurly = clean.lastIndexOf('}');
  const lastSquare = clean.lastIndexOf(']');
  
  let endIndex = -1;

  if (isObject) {
      endIndex = lastCurly;
  } else {
      endIndex = lastSquare;
  }

  if (endIndex !== -1 && endIndex >= startIndex) {
      return clean.substring(startIndex, endIndex + 1);
  }

  // Fallback: return from start index to end
  return clean.substring(startIndex).trim();
};

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
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: trickSchema,
        systemInstruction: "You are a professional skateboarding coach. Generate realistic trick lists."
      },
    });

    const text = response.text;
    if (!text) return [];
    
    // Clean and parse with safety
    try {
        const cleaned = cleanJson(text);
        const rawTricks = JSON.parse(cleaned);
        return rawTricks.map((t: any, idx: number) => ({
          id: `ai-trick-${idx}-${Date.now()}`,
          name: t.name,
          category: t.category,
          difficulty: t.difficulty,
          stance: t.stance
        }));
    } catch (parseError) {
        console.error("Failed to parse AI Session JSON:", parseError);
        return [];
    }
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
      model: "gemini-2.5-flash",
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
            model: "gemini-2.5-flash",
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
            diagnosis: { type: Type.STRING, description: "One-line overall assessment title" },
            summary: { type: Type.STRING, description: "2-3 sentences summarizing performance" },
            weaknessAnalysis: { type: Type.STRING, description: "Comment on the specific weaknesses" },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 specific actionable tips" },
            aiFeedback: { type: Type.STRING, description: "Motivating closing comment" }
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
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: insightSchema
            }
        });

        if (response.text) {
            try {
                const cleaned = cleanJson(response.text);
                return JSON.parse(cleaned) as AnalyticsInsight;
            } catch (parseError) {
                console.error("Failed to parse Analytics Insight:", parseError);
                return null;
            }
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
            
            // Map common container formats to standard mime types Gemini supports
            let mimeType = file.type;
            if (file.name.toLowerCase().endsWith('.mov')) mimeType = 'video/quicktime';
            if (!mimeType || mimeType === '') mimeType = 'video/mp4'; // Fallback for iPhone sometimes missing type

            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
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
    endTime?: number,
    trackingData?: TrackingDataPoint[],
    motionDataCsv?: string, // Added CSV input for strict physics
    stance?: "Regular" | "Goofy" // Added Stance
): Promise<VisionAnalysis | null> => {
    if (!apiKey) return null;

    const ai = getAI();

    // Use full base tricks list for context, though Stage 2 will determine the specific one
    const allTricks = BASE_TRICKS.map(t => t.name).join(", ");
    
    // Create User Context string
    const contextStr = userContext.length > 0 
        ? `The user has recently practiced or corrected these tricks: ${userContext.join(", ")}. Prioritize these if the visual evidence is ambiguous.` 
        : "";

    // Time Range Context
    const timeRangeStr = (startTime !== undefined && endTime !== undefined)
        ? `IMPORTANT: Analyze the video strictly between timestamp ${startTime}s and ${endTime}s. IGNORE any actions before ${startTime}s or after ${endTime}s.`
        : "";
    
    // Hint Logic
    let hintStr = "";
    if (trickHint) {
        hintStr = `USER CLAIM: The user states this trick is a "${trickHint}".
        INSTRUCTION: Treat "${trickHint}" as the Target Trick. 
        Do not guess what the trick is. Assume the user is attempting "${trickHint}".
        Your job is to judge IF they landed "${trickHint}" and provide feedback on their form for THIS specific trick.
        Only if the visual evidence is COMPLETELY unrelated (e.g. user says Kickflip but does a manual), then correct them. Otherwise, respect the user's claim.`;
    } else {
        hintStr = "No trick name provided. Identify the trick from visual evidence.";
    }

    // Language Logic
    const langName = language === 'KR' ? 'KOREAN (Hangul)' : 'ENGLISH';
    const langCode = language === 'KR' ? 'KOREAN' : 'ENGLISH';
    
    // Stance Logic
    const stanceStr = stance ? `Rider Stance: ${stance}` : "Rider Stance: Unknown";

    // USER PROVIDED PROMPT FOR 2-STAGE ANALYSIS
    const prompt = `
# SYSTEM INSTRUCTION: MULTI-MODAL SKATEBOARD ANALYSIS
You are an AI Skateboard Judge. You are provided with:
1. **The Video**: Visual context, style, body rotation.
2. **Motion Data CSV**: Frame-by-frame physics (Ankle Y, Board Angle).

**User Context:**
- ${stanceStr}
- ${hintStr}

**CRITICAL RULE:** 
If the CSV says "BoardAngle" stayed near 0, it is NOT a flip, even if the video looks blurry.
If the CSV shows BoardHeight change, it IS a pop.

--- CSV DATA ANALYSIS ---
${motionDataCsv ? `Here is the Motion Data extracted by the physics engine:\n${motionDataCsv.substring(0, 3000)}... (truncated)` : "No CSV data provided, rely on visual analysis."}

Use the CSV to determine:
- **BoardAngle Change**: Did it rotate ~180 (Shuvit) or stay 0?
- **BoardHeight**: Did it go high (Ollie) or stay low?

--- TRICK IDENTIFICATION LOGIC ---
1. **Analyze Board Physics (From CSV + Video):**
   - **ROLL Axis (Flip):** Board spins like a rolling log. (Kickflip/Heelflip).
   - **YAW Axis (Shuvit):** Board spins horizontally. (Pop Shuvit, 360 Shuvit).
   - **MIXED:** Tre Flip, Varial.
   - **NONE:** Ollie, 180 Ollie (if body rotates).

2. **Analyze Body Physics (From Video):**
   - Does the rider rotate? (180, 360).
   - Same direction as board?

3. **Identification:** Combine Physics + Body + User Claim.

# Input Context
Analysis Scope: ${timeRangeStr}
User History: ${contextStr}
Possible Candidates: [${allTricks}]

# Output Format
Return a SINGLE JSON object.
IMPORTANT: 'feedbackText' and 'improvementTip' MUST be in ${langName}.
'board_physics_desc' MUST also be in ${langName}.

{
  "trickName": "String (The Final Trick Name - Prioritize User Claim if plausible)",
  "confidence": 0.0 to 1.0,
  "rotation_axis": "String (ROLL, YAW, MIXED, NONE)",
  "board_physics_desc": "String (${langCode}: Explain the physics seen in CSV/Video)",
  "score": 0-100,
  "heightMeters": 0.0-2.0,
  "feedbackText": "String (${langCode}: Detailed coaching feedback. Explain WHY it is this trick and how to improve)",
  "improvementTip": "String (${langCode}: One specific tip)"
}
    `;

    try {
        if (!file) throw new Error("No file provided");
        const videoPart = await fileToPart(file);

        // Using gemini-3-pro-preview for highest reasoning capability
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", 
            contents: {
                parts: [videoPart, { text: prompt }]
            },
            config: {
                responseMimeType: "application/json",
                temperature: 0.1 // Low temp for factual consistency
            }
        });

        if (response.text) {
             // Clean JSON before parsing
             try {
                const cleanedText = cleanJson(response.text);
                const data = JSON.parse(cleanedText);
                
                return {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    trickName: data.trickName || data.trick_name || "UNKNOWN",
                    isLanded: data.score > 40,
                    confidence: data.confidence || 0.8,
                    score: data.score,
                    heightMeters: data.heightMeters,
                    rotationDegrees: 0, 
                    feedbackText: data.feedbackText,
                    improvementTip: data.improvementTip,
                    boardPhysics: {
                        axis: data.rotation_axis || "NONE",
                        description: data.board_physics_desc || "Analysis unavailable"
                    }
                };
             } catch (parseError) {
                 console.error("Failed to parse Vision Analysis JSON:", parseError);
                 console.log("Raw AI Response:", response.text);
                 return null;
             }
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
