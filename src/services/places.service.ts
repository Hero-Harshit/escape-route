import axios from 'axios';
import { env } from '../config/env';
import { escapeRouteConfig } from '../config/escapeRoute.config';
import { EscapeCandidate, UserLocation } from '../types/escapeRoute.types';
import { PlacesApiError } from '../utils/errors';
import { calculateDistanceMeters } from '../utils/distance';

export class PlacesService {
  private readonly baseUrl = 'https://places.googleapis.com/v1/places:searchNearby';

  public async findNearbyCandidates(location: UserLocation): Promise<EscapeCandidate[]> {
    try {
      const fieldMask = [
        'places.id',
        'places.displayName',
        'places.primaryType',
        'places.types',
        'places.formattedAddress',
        'places.location',
        'places.businessStatus',
        'places.currentOpeningHours',
        'places.rating',
      ].join(',');

      const payload = {
        includedPrimaryTypes: escapeRouteConfig.supportedPlaceTypes,
        locationRestriction: {
          circle: {
            center: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            radius: escapeRouteConfig.searchRadiusMeters,
          },
        },
        maxResultCount: escapeRouteConfig.maxCandidates,
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': fieldMask,
        },
      });

      const places = response.data.places || [];

      // Map raw API response to internal EscapeCandidate structure
      const candidates: EscapeCandidate[] = places.map((p: any) => {
        const candidateLat = p.location?.latitude || 0;
        const candidateLng = p.location?.longitude || 0;

        const candidate: EscapeCandidate = {
          placeId: p.id,
          name: p.displayName?.text || 'Unknown',
          type: p.primaryType || 'unknown',
          types: p.types || [],
          address: p.formattedAddress || 'Unknown Address',
          latitude: candidateLat,
          longitude: candidateLng,
          businessStatus: p.businessStatus || 'UNKNOWN',
          openNow: p.currentOpeningHours?.openNow || false,
          rating: p.rating,
          distanceMeters: calculateDistanceMeters(location, {
            latitude: candidateLat,
            longitude: candidateLng,
          }),
        };
        return candidate;
      });

      // Filter out permanently closed businesses or those without valid coordinates
      return candidates.filter((c) => {
        const validCoords = c.latitude !== 0 && c.longitude !== 0;
        const notClosed = c.businessStatus !== 'CLOSED_PERMANENTLY';
        return validCoords && notClosed;
      });
    } catch (error: any) {
      console.error('[PlacesService] Error finding candidates:', error?.response?.data || error.message);
      throw new PlacesApiError('Failed to fetch nearby places from Google API.');
    }
  }
}
