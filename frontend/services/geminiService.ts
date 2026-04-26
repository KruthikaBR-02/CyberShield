
import { GoogleGenAI } from "@google/genai";
import { RiskType } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this example, we'll log an error.
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeImage = async (file: File): Promise<{ risk: RiskType; details: string }> => {
  try {
    const imagePart = await fileToGenerativePart(file);
    const prompt = `Analyze this image and classify it into one of the following categories strictly: 'NSFW', 'Document', 'Normal Image'. If it's a document, specify what kind (e.g., ID card, invoice, receipt). Provide a brief one-sentence explanation. Your entire response must be in this format: CATEGORY: Details. Example: NSFW: Contains explicit content. or DOCUMENT: It appears to be an invoice.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    });

    const text = response.text.trim();
    
    if (text.startsWith("NSFW:")) {
      return { risk: RiskType.NSFW, details: text.replace("NSFW:", "").trim() };
    }
    if (text.startsWith("DOCUMENT:")) {
      return { risk: RiskType.DOCUMENT, details: text.replace("DOCUMENT:", "").trim() };
    }
    return { risk: RiskType.SAFE, details: "Image appears to be safe." };
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return { risk: RiskType.SAFE, details: "Could not analyze image. Defaulting to safe." };
  }
};


export const analyzeFileName = async (fileName: string): Promise<{ risk: RiskType; details: string }> => {
  try {
    const prompt = `Analyze this file name: "${fileName}". Is it potentially suspicious or malicious for a typical user on a phone (e.g. looks like malware, phishing attempt, or junkware)? Respond with only 'Suspicious' or 'Safe', followed by a colon and a brief explanation. Example: Suspicious: Contains unusual extensions and random characters.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const text = response.text.trim();

    if (text.toLowerCase().startsWith('suspicious')) {
        return { risk: RiskType.SUSPICIOUS, details: text.split(':').slice(1).join(':').trim() };
    }
    return { risk: RiskType.SAFE, details: 'File name appears to be safe.' };

  } catch (error) {
    console.error("Error analyzing file name with Gemini:", error);
    return { risk: RiskType.SAFE, details: "Could not analyze file name." };
  }
};
