import { EscapeRouteRequest } from '../types/escapeRoute.types';
import { ValidationError } from './errors';

export const validateEscapeRouteRequest = (body: any): EscapeRouteRequest => {
  if (!body) {
    throw new ValidationError('Request body is missing.');
  }

  const { latitude, longitude } = body;

  if (latitude === undefined || latitude === null) {
    throw new ValidationError('Latitude is missing.');
  }

  if (longitude === undefined || longitude === null) {
    throw new ValidationError('Longitude is missing.');
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new ValidationError('Latitude and Longitude must be numeric values.');
  }

  if (latitude < -90 || latitude > 90) {
    throw new ValidationError('Latitude must be between -90 and 90.');
  }

  if (longitude < -180 || longitude > 180) {
    throw new ValidationError('Longitude must be between -180 and 180.');
  }

  return { latitude, longitude };
};
