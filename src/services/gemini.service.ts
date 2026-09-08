import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { escapeRouteConfig } from '../config/escapeRoute.config';
import { EscapeCandidate, GeminiDecision, UserLocation } from '../types/escapeRoute.types';
import { buildEscapeRoutePrompt } from '../prompts/escapeRoute.prompt';
import { GeminiApiError } from '../utils/errors';

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  public async selectBestDestination(
    userLocation: UserLocation,
    serverTime: string,
    candidates: EscapeCandidate[]
  ): Promise<GeminiDecision> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: escapeRouteConfig.gemini.model,
        generationConfig: {
          temperature: escapeRouteConfig.gemini.temperature,
          responseMimeType: 'application/json',
        },
      });

      const prompt = buildEscapeRoutePrompt(userLocation, serverTime, candidates);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const decision: GeminiDecision = JSON.parse(responseText);

      // Basic validation of Gemini's shape
      if (!decision.selectedPlaceId || !decision.reason || !decision.confidence) {
        throw new Error('Gemini returned malformed JSON structure.');
      }

      return decision;
    } catch (error: any) {
      console.error('[GeminiService] Error selecting destination:', error);
      throw new GeminiApiError(error.message || 'Failed to get a decision from Gemini.');
    }
  }
}
