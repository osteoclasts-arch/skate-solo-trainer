

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
    ? "Respond in Korean. Use natural, encouraging coaching tone." 
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
        Language: ${language === 'KR' ? 'Korean (Hangul)' : 'English'}.
        
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
            const base64String = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64Data = base64String.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const analyzeMedia = async (file: File, language: Language, trickHint?: string, userStance: 'Regular' | 'Goofy' = 'Regular'): Promise<VisionAnalysis | null> => {
    if (!apiKey) return null;

    const ai = getAI();
    
    // Check file size (client-side safety check)
    // 20MB limit
    if (file.size > 20 * 1024 * 1024) {
        throw new Error("File too large");
    }

    const mediaPart = await fileToPart(file);
    
    const analysisSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            trickName: { type: Type.STRING, description: "One of: OLLIE, KICKFLIP, HEELFLIP, POP_SHOVE_IT, FS_180_OLLIE, BS_180_OLLIE, UNKNOWN" },
            confidence: { type: Type.NUMBER, description: "0 to 100" },
            formScore: { type: Type.NUMBER, description: "0 to 100 (Integer)" },
            heightEstimate: { type: Type.STRING, description: "e.g. '30cm'. Must be 0-50cm." },
            physicsReasoning: { type: Type.STRING, description: "Detailed check: Did board flip? Did board spin? Did body rotate? WHY is it this trick?" },
            postureAnalysis: { type: Type.STRING, description: "Analysis of knees, shoulders, and landing stability" },
            landingAnalysis: { type: Type.STRING, description: "Cleanliness of landing (bolts, toe drag, etc)" },
            improvementTip: { type: Type.STRING, description: "Strict corrective advice" }
        },
        required: ["trickName", "confidence", "formScore", "heightEstimate", "physicsReasoning", "postureAnalysis", "landingAnalysis", "improvementTip"]
    };

    let hintInstruction = "";
    if (trickHint && trickHint.trim().length > 0) {
        hintInstruction = `User claims this is: "${trickHint}". Verify strict compliance with definitions. If it does not match physically, reject the user's claim.`;
    }

    const prompt = `
        You are a STRICT SKATEBOARDING REFEREE and PHYSICS ANALYZER.
        Your job is to judge flatground tricks with conservative, data-driven precision.
        Do NOT guess. If unsure, output UNKNOWN.

        USER PROFILE:
        - Natural Stance: ${userStance}
        - Language Output: ${language === 'KR' ? 'Korean (Hangul)' : 'English'}
        ${hintInstruction}

        ===================================================
        CRITICAL: OLLIE VS KICKFLIP DISTINCTION
        ===================================================
        Common Error: Mistaking a stylish Ollie (where the rider kicks their foot out) for a Kickflip.
        
        1. OLLIE CHECKLIST (MUST MEET ALL):
           - [ ] The board stays relatively flat (grip tape up) or goes vertical (rocket).
           - [ ] The board NEVER flips upside down.
           - [ ] The board NEVER reveals its graphic side to the sky during the peak.
           - [ ] Board rotation on Roll axis = 0 degrees.
        
        2. KICKFLIP CHECKLIST (MUST MEET ALL):
           - [ ] The board rotates 360 degrees on its Roll axis.
           - [ ] You MUST see the graphic (bottom) of the board facing up at some point.
           - [ ] If you do not clearly see the graphic side, IT IS NOT A FLIP. It is an Ollie.

        ===================================================
        TRICK DEFINITIONS
        ===================================================
        1. OLLIE: Jump with board. No flip. No spin.
        2. KICKFLIP: Full 360 lateral flip (Toe-side).
        3. HEELFLIP: Full 360 lateral flip (Heel-side).
        4. POP_SHOVE_IT: 180 vertical spin. No flip.
        5. FS_180_OLLIE: Body + Board rotate 180 Frontside.
        6. BS_180_OLLIE: Body + Board rotate 180 Backside.

        [SCORING RUBRIC]
        1. jump_height_cm: Conservative 0-50cm.
        2. posture_score: 0-100 based on style/stability.

        ===================================================
        ANALYSIS PROCEDURE (CHAIN OF THOUGHT)
        ===================================================
        1. **Board Identification**: Locate the skateboard.
        2. **Physics Verification**:
           - Did the board rotate on the Y-axis (Spin)?
           - Did the board rotate on the X-axis (Flip)? -> IF NO FLIP DETECTED, IT IS AN OLLIE.
        3. **Body Verification**: Did the rider's chest/back rotate 180?
        4. **Classify**: Assign trick name based on physics.
        5. **Report**: Fill 'physicsReasoning' with your findings (e.g., "Board lifted but did not rotate X-axis. Grip tape remained visible. Classified as Ollie.").

        Output JSON only.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                role: 'user',
                parts: [mediaPart, { text: prompt }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0, // Zero temperature for strict, deterministic judging
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as VisionAnalysis;
        }
        return null;
    } catch (error) {
        console.error("Error analyzing media:", error);
        return null;
    }
};
