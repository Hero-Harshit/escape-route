import axios from 'axios';
import { env } from '../config/env';
import { escapeRouteConfig } from '../config/escapeRoute.config';
import { RouteLeg, RouteResult, UserLocation } from '../types/escapeRoute.types';
import { RoutesApiError } from '../utils/errors';

export class RoutesService {
  // TomTom Routing API v1 calculateRoute endpoint
  private readonly baseUrl = 'https://api.tomtom.com/routing/1/calculateRoute';

  public async computeEscapeRoute(
    origin: UserLocation,
    destination: UserLocation
  ): Promise<RouteResult> {
    if (!env.TOMTOM_API_KEY) {
      console.error('[RoutesService] Missing TOMTOM_API_KEY');
      throw new RoutesApiError('TomTom API key is not configured.');
    }

    try {
      // TomTom calculateRoute path format: /{locations}/json
      // Format: {startLat},{startLon}:{destLat},{destLon}
      const locations = `${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}`;
      const url = `${this.baseUrl}/${locations}/json`;

      const params = {
        key: env.TOMTOM_API_KEY,
        travelMode: escapeRouteConfig.defaultTravelMode, // pedestrian by default
        routeType: 'fastest',
        instructionsType: 'text',
      };

      const response = await axios.get(url, {
        params,
        timeout: 10000,
      });

      const routes = response.data?.routes || [];

      if (routes.length === 0) {
        throw new Error('No routes returned from TomTom Routing API.');
      }

      const route = routes[0];
      const summary = route.summary || {};
      const distanceMeters = summary.lengthInMeters || 0;
      const durationSeconds = summary.travelTimeInSeconds || 0;

      // Extract legs and coordinate points if provided by TomTom
      const legs: RouteLeg[] = (route.legs || []).map((leg: any) => ({
        distanceMeters: leg.summary?.lengthInMeters,
        durationSeconds: leg.summary?.travelTimeInSeconds,
        points: (leg.points || []).map((pt: any) => ({
          latitude: pt.latitude,
          longitude: pt.longitude,
        })),
      }));

      // Extract guidance instructions/steps if present
      const steps = (route.guidance?.instructions || []).map((inst: any) => ({
        message: inst.message,
        maneuver: inst.maneuver,
        street: inst.street,
        distanceMeters: inst.routeOffsetInMeters,
        travelTimeInSeconds: inst.travelTimeInSeconds,
        point: inst.point ? { latitude: inst.point.latitude, longitude: inst.point.longitude } : undefined,
      }));

      return {
        distanceMeters,
        durationSeconds,
        polyline: route.legs?.[0]?.points ? JSON.stringify(route.legs[0].points) : undefined,
        legs: legs.length > 0 ? legs : undefined,
        steps: steps.length > 0 ? steps : undefined,
      };
    } catch (error: any) {
      console.error('[RoutesService] Error computing route with TomTom:', error?.response?.data || error.message);
      throw new RoutesApiError('Failed to compute route from TomTom Routing API.');
    }
  }
}

