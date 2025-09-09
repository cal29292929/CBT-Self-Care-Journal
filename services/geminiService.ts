
import { GoogleGenAI } from "@google/genai";
import { CbtEntry } from '../types';
import { formatDate } from "../utils";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBalancedThought = async (
    situation: string,
    mood: string,
    rating: number,
    negativeThought: string
): Promise<string> => {
    const prompt = `以下の状況と気分に基づいて、ネガティブな思考に対するよりバランスの取れた、建設的な考え方を提案してください。
    状況: ${situation}
    気分: ${mood} (5段階評価: ${rating})
    ネガティブ思考: ${negativeThought}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed in getBalancedThought:", error);
        throw new Error("Failed to get a balanced thought suggestion.");
    }
};

export const getEntriesAnalysis = async (entries: CbtEntry[]): Promise<string> => {
    const recentEntries = entries.slice(0, 10);
    const formattedEntries = recentEntries.map(entry => {
        const customFieldsText = Object.entries(entry)
            .filter(([key, value]) => key.startsWith('custom_') && value)
            .map(([key, value]) => `${key.replace('custom_', '')}: ${value}`)
            .join(', ');
        
        return `日付: ${formatDate(entry.timestamp)}, 気分: ${entry.mood} (${entry.rating}点), ネガティブ思考: ${entry.negativeThought}${customFieldsText ? `, ${customFieldsText}` : ''}`;
    }).join('\n');

    const prompt = `以下の自己管理ノートの記録を分析し、ユーザーの感情の傾向や繰り返されるネガティブ思考のパターンを要約してください。
    そして、認知行動療法（CBT）の考え方に基づき、現状を改善するための短く建設的なアドバイスを提案してください。
    記録:\n${formattedEntries}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed in getEntriesAnalysis:", error);
        throw new Error("Failed to get entries analysis.");
    }
};

export const getAnalysisTTS = async (textToSpeak: string): Promise<{ audioData: string, mimeType: string }> => {
    const payload = {
        contents: [{
            parts: [{ text: textToSpeak }]
        }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Kore" }
                }
            }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.API_KEY}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("TTS API Error Body:", errorBody);
            throw new Error(`TTS API error: ${response.statusText}`);
        }

        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType) {
            return { audioData, mimeType };
        } else {
            throw new Error('Audio data not found in TTS response.');
        }

    } catch (error) {
        console.error("TTS API call failed:", error);
        throw new Error("Failed to generate audio from text.");
    }
};
