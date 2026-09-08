import { PlacesService } from './places.service';
import { GeminiService } from './gemini.service';
import { RoutesService } from './routes.service';
import { EscapeRouteResponse, UserLocation } from '../types/escapeRoute.types';
import { InvalidDestinationSelectedError, NoDestinationsFoundError } from '../utils/errors';

export class EscapeRouteService {
  private placesService: PlacesService;
  private geminiService: GeminiService;
  private routesService: RoutesService;

  constructor() {
    this.placesService = new PlacesService();
    this.geminiService = new GeminiService();
    this.routesService = new RoutesService();
  }

  public async generateEscapeRoute(userLocation: UserLocation): Promise<EscapeRouteResponse> {
    console.log(`[EscapeRoute] Received location: ${userLocation.latitude}, ${userLocation.longitude}`);
    
    // STEP 3: Determine server time
    const serverTime = new Date().toISOString();

    // STEP 4 & 5 & 6: Fetch, normalize, and filter candidates
    console.log('[EscapeRoute] Searching nearby places');
    const candidates = await this.placesService.findNearbyCandidates(userLocation);
    
    if (candidates.length === 0) {
      console.log('[EscapeRoute] No candidates found.');
      throw new NoDestinationsFoundError();
    }
    
    console.log(`[EscapeRoute] Found ${candidates.length} candidates`);

    // STEP 7 & 8: Prepare prompt, call Gemini, and get decision
    console.log('[EscapeRoute] Requesting Gemini decision');
    const decision = await this.geminiService.selectBestDestination(
      userLocation,
      serverTime,
      candidates
    );

    // STEP 14: Gemini Output Validation
    console.log(`[EscapeRoute] Gemini selected place ID: ${decision.selectedPlaceId}`);
    const selectedCandidate = candidates.find(c => c.placeId === decision.selectedPlaceId);

    if (!selectedCandidate) {
      console.error('[EscapeRoute] Gemini selected an unknown place ID.');
      throw new InvalidDestinationSelectedError();
    }

    // STEP 9 & 10: Call TomTom Routing API with origin and destination coordinates
    console.log('[EscapeRoute] Calculating route');
    const route = await this.routesService.computeEscapeRoute(
      userLocation,
      {
        latitude: selectedCandidate.latitude,
        longitude: selectedCandidate.longitude,
      }
    );

    console.log('[EscapeRoute] Escape route generated successfully');

    // Remove internal properties that shouldn't go to the client for the recommended destination
    const { categories, openNow, businessStatus, distanceMeters, ...safeDestination } = selectedCandidate;

    // STEP 11: Return clean response
    return {
      success: true,
      userLocation,
      recommendedDestination: safeDestination,
      decision,
      route,
      generatedAt: serverTime,
    };
  }
}
