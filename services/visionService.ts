
import { VisionAnalysis } from "../types";

/**
 * MOCK VISION SERVICE
 * 
 * This service simulates the backend logic that would normally:
 * 1. Accept a video file.
 * 2. Run Pose Estimation (MediaPipe) & Action Classification.
 * 3. Return structured data about the trick.
 * 
 * Currently, it returns randomized but realistic data for demonstration.
 */

const MOCK_TRICKS = [
    { name: "Ollie", avgHeight: 0.3, difficulty: 1 },
    { name: "Kickflip", avgHeight: 0.4, difficulty: 1.5 },
    { name: "Heelflip", avgHeight: 0.35, difficulty: 1.5 },
    { name: "Pop Shove-it", avgHeight: 0.2, difficulty: 1.2 },
    { name: "Frontside 180", avgHeight: 0.25, difficulty: 1.3 },
    { name: "Backside 180", avgHeight: 0.25, difficulty: 1.4 },
    { name: "Tre Flip", avgHeight: 0.45, difficulty: 2.5 },
];

export const analyzeVideoMock = async (file: File): Promise<VisionAnalysis> => {
    // Simulate network latency (2-4 seconds)
    const delay = 2000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Randomly select a trick result
    const randomTrick = MOCK_TRICKS[Math.floor(Math.random() * MOCK_TRICKS.length)];
    
    // Simulate Success/Fail (70% success rate for demo)
    const isLanded = Math.random() > 0.3;
    
    // Calculate Score based on success and random variance
    // Success: 70-100, Fail: 10-60
    let score = isLanded 
        ? 70 + Math.floor(Math.random() * 30)
        : 10 + Math.floor(Math.random() * 50);

    // Calculate realistic height
    const heightVariance = (Math.random() * 0.1) - 0.05; // +/- 5cm
    const height = Math.max(0.1, randomTrick.avgHeight + heightVariance);

    return {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        trickName: randomTrick.name,
        isLanded: isLanded,
        confidence: 0.92, // Mocking a high confidence model
        score: score,
        heightMeters: parseFloat(height.toFixed(2)),
        rotationDegrees: randomTrick.name.includes("180") ? 175 + Math.random() * 10 : 0,
        
        // These will be populated by Gemini later, but we init them here
        feedbackText: "",
        improvementTip: ""
    };
};
