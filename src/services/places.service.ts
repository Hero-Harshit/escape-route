import axios from 'axios';
import { env } from '../config/env';
import { escapeRouteConfig } from '../config/escapeRoute.config';
import { EscapeCandidate, UserLocation } from '../types/escapeRoute.types';
import { PlacesApiError } from '../utils/errors';
import { calculateDistanceMeters } from '../utils/distance';

export class PlacesService {
  // TomTom Search API v2 nearbySearch endpoint
  private readonly baseUrl = 'https://api.tomtom.com/search/2/nearbySearch/.json';

  public async findNearbyCandidates(location: UserLocation): Promise<EscapeCandidate[]> {
    if (!env.TOMTOM_API_KEY) {
      console.error('[PlacesService] Missing TOMTOM_API_KEY');
      throw new PlacesApiError('TomTom API key is not configured.');
    }

    try {
      const params = {
        key: env.TOMTOM_API_KEY,
        lat: location.latitude,
        lon: location.longitude,
        radius: escapeRouteConfig.searchRadiusMeters,
        limit: escapeRouteConfig.maxCandidates,
        categorySet: escapeRouteConfig.supportedCategorySet,
      };

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 10000,
      });

      const results = response.data?.results || [];

      // Normalize TomTom POI result format into EscapeCandidate
      const candidates: EscapeCandidate[] = results.map((item: any) => {
        const placeId = item.id ? String(item.id) : (item.poi?.name ? `${item.poi.name}_${item.position?.lat}_${item.position?.lon}` : 'unknown_place_id');
        const name = item.poi?.name || 'Unknown Location';
        const position = item.position || {};
        const latitude = typeof position.lat === 'number' ? position.lat : 0;
        const longitude = typeof position.lon === 'number' ? position.lon : 0;

        // Categories from TomTom classifications / categories
        const classifications = item.poi?.classifications || [];
        const primaryCategory = item.poi?.categories?.[0] || classifications[0]?.code || 'public_place';
        const categories = item.poi?.categories || classifications.map((c: any) => c.code || c.name).filter(Boolean);

        // Address formatting from TomTom address object
        const address = item.address?.freeformAddress || item.address?.streetName || 'Address unavailable';

        // Distance preference: use TomTom's calculated distance if provided, otherwise compute via Haversine
        let distanceMeters: number;
        if (typeof item.dist === 'number' && !isNaN(item.dist)) {
          distanceMeters = Math.round(item.dist);
        } else {
          distanceMeters = calculateDistanceMeters(location, { latitude, longitude });
        }

        const candidate: EscapeCandidate = {
          placeId,
          name,
          category: primaryCategory,
          categories: categories.length > 0 ? categories : undefined,
          address,
          latitude,
          longitude,
          distanceMeters,
        };

        // If TomTom opening hours or operational status are available, preserve them factually
        if (item.poi?.openingHours) {
          if (typeof item.poi.openingHours.openNow === 'boolean') {
            candidate.openNow = item.poi.openingHours.openNow;
          }
        }

        return candidate;
      });

      // Filter out invalid coordinates and sort by distance
      const validCandidates = candidates
        .filter(c => c.latitude !== 0 && c.longitude !== 0)
        .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));

      return validCandidates.slice(0, escapeRouteConfig.maxCandidates);
    } catch (error: any) {
      console.error('[PlacesService] Error searching nearby places with TomTom:', error?.response?.data || error.message);
      throw new PlacesApiError('Failed to search nearby destinations from TomTom Search API.');
    }
  }
}

