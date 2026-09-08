import { env } from './env';

export const escapeRouteConfig = {
  // Default search radius in meters around the user's location
  searchRadiusMeters: env.PLACES_SEARCH_RADIUS_METERS,

  // Maximum number of candidates to process and send to Gemini
  maxCandidates: 15,

  // The default travel mode to use when requesting a route with TomTom Routing API
  // Supported TomTom modes: pedestrian, car, bicycle, truck, motorcycle, van, etc.
  defaultTravelMode: env.DEFAULT_TRAVEL_MODE,

  // Supported candidate place categories to search for in TomTom Search API.
  // Standard TomTom categorySet IDs for public, emergency, and populated destinations:
  // 7321: Hospital / Polyclinic
  // 7322: Police Station
  // 7324: Fire Station
  // 7326: Pharmacy
  // 7311: Petrol Station / Gas Station
  // 7389: Public Transport Stop / Metro / Bus Stop
  // 7380: Railway Station
  // 7373: Shopping Centre / Mall
  // 7372: Supermarket / Groceries
  // 7315: Restaurant
  // 7314: Hotel / Motel
  // 7342: Convenience Store / Kiosk
  supportedCategorySet: [
    '7321', // Hospital / Emergency
    '7322', // Police Station
    '7324', // Fire Station
    '7326', // Pharmacy
    '7311', // Petrol / Gas Station
    '7389', // Public Transport / Metro / Transit
    '7380', // Railway Station
    '7373', // Shopping Mall
    '7372', // Supermarket
    '7315', // Restaurant
    '7314', // Hotel
    '7342', // Convenience Store
  ].join(','),

  // Fallback category names for POI search / query filtering if needed
  supportedCategoryNames: [
    'police station',
    'hospital',
    'pharmacy',
    'shopping centre',
    'supermarket',
    'railway station',
    'metro station',
    'gas station',
    'hotel',
    'convenience store',
    'restaurant',
  ],

  // AI model settings
  gemini: {
    model: 'gemini-1.5-flash',
    temperature: 0.1, // Low temperature for deterministic output
  },
};
