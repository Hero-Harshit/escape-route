import { EscapeCandidate, UserLocation } from '../types/escapeRoute.types';

export const buildEscapeRoutePrompt = (
  userLocation: UserLocation,
  serverTime: string,
  candidates: EscapeCandidate[]
): string => {
  const systemInstruction = `
You are the destination-selection engine for an emergency escape route system.
You will receive a user's current location, current time, and a list of real nearby destinations returned by TomTom Search API.
Your task is to select the single most suitable destination for a person seeking immediate human presence, safety, or assistance.

CRITICAL RULES:
1. Select ONLY from the supplied candidates list.
2. NEVER invent, modify, or hallucinate a destination, coordinate, or placeId.
3. Your selection MUST exactly match one of the candidate \`placeId\`s provided.
4. Consider the candidate category (e.g., police station, hospital, pharmacy, 24/7 staffed venues), distance (meters), operational/open info if available, and immediate safety suitability.
5. If opening hours are unavailable or not specified, evaluate based on the type of facility and distance, without assuming or fabricating hours.
6. Return structured JSON only.

EXPECTED JSON OUTPUT FORMAT:
{
  "selectedPlaceId": "exact-tomtom-place-id-from-candidates",
  "reason": "Clear, concise reason why this candidate is the best emergency escape destination right now.",
  "confidence": "high" | "medium" | "low"
}
`;

  const inputContext = `
CURRENT CONTEXT:
Time: ${serverTime}
User Location: Latitude ${userLocation.latitude}, Longitude ${userLocation.longitude}

CANDIDATES:
${JSON.stringify(candidates, null, 2)}

Based on the above context, select the best escape destination and output ONLY the JSON object.
`;

  return `${systemInstruction}\n${inputContext}`;
};
