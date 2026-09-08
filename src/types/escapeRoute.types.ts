export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface EscapeCandidate {
  placeId: string;
  name: string;
  type: string;
  types: string[];
  address: string;
  latitude: number;
  longitude: number;
  businessStatus: string;
  openNow: boolean;
  rating?: number;
  distanceMeters?: number; // Straight-line distance
}

export interface GeminiDecision {
  selectedPlaceId: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
  steps: any[]; // Depending on what Google Routes returns
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
