

declare var process: {
  env: {
    API_KEY: string;
  };
};

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Trick, SessionSettings, Difficulty, TrickCategory, SessionResult, TrickTip, Language, AnalyticsInsight, VisionAnalysis, TrackingDataPoint, Quest } from "../types";
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
      // Fallback: Try to find any valid JSON-like structure or return empty object string
      console.warn("No clear JSON start found, attempting to parse raw text.");
      return "{}"; 
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

export const generatePersonalizedQuests = async (
    userLandedTricks: string[],
    userLevel: string, // "Beginner", "Amateur", "Pro"
    language: Language
): Promise<Quest[]> => {
    if (!apiKey) {
        // Fallback to empty (will use default logic in dbService)
        return []; 
    }

    const ai = getAI();
    const langInstruction = language === 'KR' ? "Outputs must be in Korean (Hangul)." : "Outputs must be in English.";
    
    // Provide full list of tricks for AI context
    const allTrickNames = BASE_TRICKS.map(t => t.name).join(", ");

    const prompt = `
        You are a skateboard gamification engine. Generate 3 unique Daily Quests for a skater.
        
        User Profile:
        - Level: ${userLevel}
        - Tricks they have LANDED before: [${userLandedTricks.join(', ')}]
        - All available tricks in database: [${allTrickNames}]
        
        Goal:
        1. Login Quest (Always included, just label it creatively)
        2. "First Steps" or "Challenge" Quest:
           - If they have NEVER landed a basic trick (like Ollie, Shuvit, Nollie), suggest "First Steps: Try [Trick]".
           - If they are advanced, suggest a hard variation or "Land 3 [Hard Trick]".
           - Make it fun!
        3. Consistency Quest: Suggest landing a trick they ALREADY know multiple times (e.g. "Land 10 Kickflips").
        
        ${langInstruction}
        
        Return JSON Array of 3 Quest Objects:
        [{
           "title": "String (Short, Fun Title, e.g. 'First Nollie Attempt' or 'Ollie Master')",
           "xp": Integer (20-100),
           "target": Integer (Amount to do, e.g. 1, 5, 10),
           "type": String (Enum: 'login', 'session', 'practice', 'land_tricks', 'perfect_session')
        }]
    `;

    const questSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                xp: { type: Type.INTEGER },
                target: { type: Type.INTEGER },
                type: { type: Type.STRING, enum: ['login', 'session', 'practice', 'land_tricks', 'perfect_session'] }
            },
            required: ["title", "xp", "target", "type"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: questSchema
            }
        });

        if (response.text) {
            try {
                const cleaned = cleanJson(response.text);
                const rawQuests = JSON.parse(cleaned);
                
                // Add IDs and progress fields
                return rawQuests.map((q: any, idx: number) => ({
                    id: `ai-quest-${Date.now()}-${idx}`,
                    title: q.title,
                    xp: q.xp,
                    target: q.target,
                    type: q.type,
                    progress: 0,
                    isCompleted: false
                }));
            } catch (e) {
                console.error("Failed to parse AI Quests", e);
                return [];
            }
        }
        return [];
    } catch (e) {
        console.error("AI Quest Gen Error", e);
        return [];
    }
}

export const generateSkateLine = async (
    knownTricks: string[], 
    obstacles: string[], 
    style: string, 
    language: Language
): Promise<{ name: string, sequence: string[] }> => {
    if (!apiKey) return { name: "Default Line", sequence: ["Ollie", "Push", "Manual", "Ollie"] };
    
    const ai = getAI();
    const langInstruction = language === 'KR' 
        ? "Respond in Korean (Hangul). Use natural skate terms like '알리', '킥플립'." 
        : "Respond in English.";
    
    const contextTricks = knownTricks.length > 0 
        ? `User's landed tricks: ${knownTricks.join(', ')}. Use these if possible, or simple variations.`
        : `User is a beginner. Use very basic tricks (Ollie, Shuvit, Manual).`;

    const prompt = `
        Create a cool 3-4 trick skateboard line sequence.
        Obstacles available: ${obstacles.join(', ')}.
        Style/Vibe: ${style}.
        ${contextTricks}
        
        The line should flow logically (e.g., set up tricks before obstacles, consistent stance).
        Format "How about this line?":
        1. A catchy Line Name.
        2. An array of strings describing the sequence (e.g. "Ollie up the curb", "Backside 50-50").
        
        ${langInstruction}
    `;

    const lineSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            sequence: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "sequence"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: lineSchema
            }
        });
        
        if (response.text) {
             const cleaned = cleanJson(response.text);
             return JSON.parse(cleaned);
        }
        return { name: "Basic Line", sequence: ["Push", "Ollie", "Powerslide"] };
    } catch (e) {
        console.error("Line Gen Error", e);
        return { name: "Basic Line", sequence: ["Push", "Ollie", "Powerslide"] };
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

// Expert Knowledge for specific tricks
const OLLIE_GUIDE = `
1. **발 위치**: 앞발은 앞 볼트 뒤 중앙/살짝 비스듬히. 뒷발은 테일 끝 중앙. 무게중심은 보드 중앙.
2. **준비**: 가벼운 스쿼트. 상체가 뒤로 빠지지 않게 무릎과 어깨를 보드 위에 유지.
3. **팝(Pop)**: 누르지 말고 스냅으로 '쳐라'. 약간 뒤쪽 대각선으로 밀어 차는 느낌.
4. **점프 타이밍**: 팝과 동시에 점프. 앞발만 들지 말고 몸 전체가 떠야 함. 주행 시에는 약간 앞쪽으로 점프.
5. **슬라이드**: 발목을 꺾어(제기차기) 신발 옆면으로 노즈 끝까지 밀어올리기.
6. **뒷발 올리기**: 팝 직후 뒷발을 과감하게 들어올려(무릎 접기) 데크 수평 맞추기.
7. **균형**: 어깨는 데크와 평행. 시선은 주행 방향.
8. **흔한 실수**: 점프 없이 다리만 들기, 슬라이드 부족(보드 안 붙음), 상체 뒤로 빠짐.
`;

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
    if (!apiKey) {
        console.error("API Key missing for analysis");
        return null;
    }

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
    
    // Hint Logic & Expert Guide Injection
    let hintStr = "";
    let expertGuide = "";

    const isOllie = trickHint?.toLowerCase().includes('ollie') || trickHint?.includes('알리');

    if (trickHint) {
        hintStr = `USER CLAIM: The user states this trick is a "${trickHint}".
        INSTRUCTION: Treat "${trickHint}" as the Target Trick. 
        Do not guess what the trick is. Assume the user is attempting "${trickHint}".
        Your job is to judge IF they landed "${trickHint}" and provide feedback on their form for THIS specific trick.`;

        if (isOllie) {
            expertGuide = `
            \n*** EXPERT OLLIE GUIDELINES (USE THIS FOR CRITIQUE) ***
            ${OLLIE_GUIDE}
            INSTRUCTION: Compare the user's form strictly against these 8 points.
            - If they don't slide ankle -> Cite point 5.
            - If back foot hangs down -> Cite point 6.
            - If they lean back -> Cite point 7.
            `;
        }
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
${expertGuide}

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
  "feedbackText": "String (${langCode}: Detailed coaching feedback. Explain WHY it is this trick and how to improve. If Ollie, reference the Expert Guidelines.)",
  "improvementTip": "String (${langCode}: One specific tip based on the Expert Guidelines if applicable)"
}
    `;

    try {
        if (!file) throw new Error("No file provided");
        const videoPart = await fileToPart(file);

        // Using gemini-2.5-flash for speed and stability on video analysis
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: {
                parts: [videoPart, { text: prompt }]
            },
            config: {
                responseMimeType: "application/json",
                temperature: 0.2 // Low temp for factual consistency
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