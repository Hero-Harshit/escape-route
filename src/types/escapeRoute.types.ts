export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface EscapeCandidate {
  placeId: string;
  name: string;
  category?: string;
  categories?: string[];
  address?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number; // Straight-line distance from user origin (meters)
  businessStatus?: string;
  openNow?: boolean;
  rating?: number;
}

export interface GeminiDecision {
  selectedPlaceId: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RouteLeg {
  distanceMeters?: number;
  durationSeconds?: number;
  points?: Array<{ latitude: number; longitude: number }>;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline?: string;
  legs?: RouteLeg[];
  steps?: any[];
}

export interface EscapeRouteResponse {
  success: boolean;
  userLocation?: UserLocation;
  recommendedDestination?: Omit<EscapeCandidate, 'types' | 'openNow' | 'businessStatus' | 'distanceMeters'>;
  decision?: GeminiDecision;
  route?: RouteResult;
  generatedAt?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface EscapeRouteRequest {
  latitude: number;
  longitude: number;
}
