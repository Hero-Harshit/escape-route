import { env } from './env';

export const escapeRouteConfig = {
  // Default search radius in meters around the user's location
  searchRadiusMeters: env.PLACES_SEARCH_RADIUS_METERS,

  // Maximum number of candidates to process and send to Gemini
  maxCandidates: 15,

  // The default travel mode to use when requesting a route
  defaultTravelMode: env.DEFAULT_TRAVEL_MODE,

  // Supported candidate place categories to search for in Google Places API
  // These correspond to the Primary Types in Google Places API (New)
  supportedPlaceTypes: [
    'police',
    'hospital',
    'subway_station',
    'train_station',
    'shopping_mall',
    'supermarket',
    'pharmacy',
    'gas_station',
    'hotel',
    'restaurant',
    'convenience_store',
  ],

  // AI model settings
  gemini: {
    model: 'gemini-1.5-flash', // Using 1.5-flash as the latest standard fast model
    temperature: 0.1, // Low temperature for deterministic output
  }
};
