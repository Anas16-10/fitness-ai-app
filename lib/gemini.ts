// lib/gemini.ts
// Official Google Generative AI client

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "GEMINI_API_KEY is not set. AI features will not work until you add it to .env.local."
  );
}

// Global instance to reuse the client
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Default model to use
export const MAIN_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * Ensures the API key is available before generation
 */
export function getGeminiModel(modelName: string = MAIN_MODEL) {
  if (!genAI) {
    throw new Error("Missing GEMINI_API_KEY; set it in .env.local to use AI features.");
  }
  return genAI.getGenerativeModel({ model: modelName });
}