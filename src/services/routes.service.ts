import axios from 'axios';
import { env } from '../config/env';
import { escapeRouteConfig } from '../config/escapeRoute.config';
import { RouteResult, UserLocation } from '../types/escapeRoute.types';
import { RoutesApiError } from '../utils/errors';

export class RoutesService {
  private readonly baseUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  public async computeEscapeRoute(
    origin: UserLocation,
    destinationPlaceId: string
  ): Promise<RouteResult> {
    try {
      const fieldMask = [
        'routes.distanceMeters',
        'routes.duration',
        'routes.polyline.encodedPolyline',
        'routes.legs.steps'
      ].join(',');

      const payload = {
        origin: {
          location: {
            latLng: {
              latitude: origin.latitude,
              longitude: origin.longitude,
            },
          },
        },
        destination: {
          placeId: destinationPlaceId,
        },
        travelMode: escapeRouteConfig.defaultTravelMode,
        routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': fieldMask,
        },
      });

      const routes = response.data.routes || [];

      if (routes.length === 0) {
        throw new Error('No routes returned from Google Routes API.');
      }

      const route = routes[0];
      
      // Parse duration which comes as e.g. "2700s"
      const durationSeconds = route.duration 
        ? parseInt(route.duration.replace('s', ''), 10) 
        : 0;

      return {
        distanceMeters: route.distanceMeters || 0,
        durationSeconds,
        polyline: route.polyline?.encodedPolyline || '',
        steps: route.legs && route.legs[0] ? route.legs[0].steps || [] : [],
      };
    } catch (error: any) {
      console.error('[RoutesService] Error computing route:', error?.response?.data || error.message);
      throw new RoutesApiError('Failed to compute route from Google Routes API.');
    }
  }
}
