import dotenv from 'dotenv';

// Load environment variables from .env file if it exists
dotenv.config();

interface Env {
  PORT: number;
  TOMTOM_API_KEY: string;
  GEMINI_API_KEY: string;
  PLACES_SEARCH_RADIUS_METERS: number;
  DEFAULT_TRAVEL_MODE: string;
  NODE_ENV: string;
}

const getEnv = (): Env => {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY || '';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  const PLACES_SEARCH_RADIUS_METERS = parseInt(process.env.PLACES_SEARCH_RADIUS_METERS || '5000', 10);
  const DEFAULT_TRAVEL_MODE = process.env.DEFAULT_TRAVEL_MODE || 'pedestrian';
  const NODE_ENV = process.env.NODE_ENV || 'development';

  if (!TOMTOM_API_KEY) {
    console.warn('WARNING: TOMTOM_API_KEY is not set in the environment.');
  }

  if (!GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not set in the environment.');
  }

  return {
    PORT,
    TOMTOM_API_KEY,
    GEMINI_API_KEY,
    PLACES_SEARCH_RADIUS_METERS,
    DEFAULT_TRAVEL_MODE,
    NODE_ENV,
  };
};

export const env = getEnv();
