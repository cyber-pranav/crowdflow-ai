import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, hasGemini } from './environment';

let genAI: GoogleGenerativeAI | null = null;

if (hasGemini) {
  try {
    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    console.log('✅ Gemini API initialized');
  } catch (error) {
    console.warn('⚠️  Gemini API init failed, AI assistant will use fallback:', error);
  }
} else {
  console.log('ℹ️  Gemini API key not provided, AI assistant will use rule-based fallback');
}

export const geminiClient = genAI;
export const getGeminiModel = (modelName: string = 'gemini-2.0-flash') => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: modelName });
};
