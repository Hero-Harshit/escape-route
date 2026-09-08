import dotenv from 'dotenv';

// Load environment variables from .env file if it exists
dotenv.config();

interface Env {
  PORT: number;
  GOOGLE_MAPS_API_KEY: string;
  GEMINI_API_KEY: string;
  PLACES_SEARCH_RADIUS_METERS: number;
  DEFAULT_TRAVEL_MODE: string;
  NODE_ENV: string;
}

const getEnv = (): Env => {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  const PLACES_SEARCH_RADIUS_METERS = parseInt(process.env.PLACES_SEARCH_RADIUS_METERS || '5000', 10);
  const DEFAULT_TRAVEL_MODE = process.env.DEFAULT_TRAVEL_MODE || 'WALK';
  const NODE_ENV = process.env.NODE_ENV || 'development';

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('WARNING: GOOGLE_MAPS_API_KEY is not set in the environment.');
  }

  if (!GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not set in the environment.');
  }

  return {
    PORT,
    GOOGLE_MAPS_API_KEY,
    GEMINI_API_KEY,
    PLACES_SEARCH_RADIUS_METERS,
    DEFAULT_TRAVEL_MODE,
    NODE_ENV,
  };
};

export const env = getEnv();
