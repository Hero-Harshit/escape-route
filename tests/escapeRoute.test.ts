const mockFindNearbyCandidates = jest.fn();
const mockSelectBestDestination = jest.fn();
const mockComputeEscapeRoute = jest.fn();

// Mock the services before importing app
jest.mock('../src/services/places.service', () => {
  return {
    PlacesService: jest.fn().mockImplementation(() => {
      return {
        findNearbyCandidates: mockFindNearbyCandidates,
      };
    }),
  };
});

jest.mock('../src/services/gemini.service', () => {
  return {
    GeminiService: jest.fn().mockImplementation(() => {
      return {
        selectBestDestination: mockSelectBestDestination,
      };
    }),
  };
});

jest.mock('../src/services/routes.service', () => {
  return {
    RoutesService: jest.fn().mockImplementation(() => {
      return {
        computeEscapeRoute: mockComputeEscapeRoute,
      };
    }),
  };
});

import request from 'supertest';
import app from '../src/app';
import { PlacesApiError, RoutesApiError } from '../src/utils/errors';

describe('Escape Route API Tests (TomTom Integration)', () => {
  beforeEach(() => {
    mockFindNearbyCandidates.mockReset();
    mockSelectBestDestination.mockReset();
    mockComputeEscapeRoute.mockReset();
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('POST /api/escape-route', () => {
    // Test 1: Invalid coordinates are rejected
    it('Test 1: should reject requests with missing coordinates or invalid ranges', async () => {
      const missingCoordResponse = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139 });
      
      expect(missingCoordResponse.status).toBe(400);
      expect(missingCoordResponse.body.success).toBe(false);
      expect(missingCoordResponse.body.error.code).toBe('VALIDATION_ERROR');

      const invalidRangeResponse = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 120, longitude: 77.2090 });
      
      expect(invalidRangeResponse.status).toBe(400);
      expect(invalidRangeResponse.body.success).toBe(false);
      expect(invalidRangeResponse.body.error.code).toBe('VALIDATION_ERROR');
    });

    // Test 2: TomTom Places failure is handled
    it('Test 2: should handle TomTom Places search failure gracefully', async () => {
      mockFindNearbyCandidates.mockRejectedValue(
        new PlacesApiError('Failed to search nearby destinations from TomTom Search API.')
      );

      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139, longitude: 77.2090 });

      expect(response.status).toBe(502);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PLACES_API_ERROR');
    });

    // Test 3: No nearby candidates are handled
    it('Test 3: should handle zero candidates found gracefully with 404', async () => {
      mockFindNearbyCandidates.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139, longitude: 77.2090 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_ESCAPE_DESTINATION_FOUND');
    });

    // Test 4: Gemini selects a valid TomTom place ID
    it('Test 4: should proceed when Gemini selects a valid TomTom place ID', async () => {
      const candidateList = [
        {
          placeId: 'tomtom_place_hospital_123',
          name: 'City General Hospital',
          category: 'hospital',
          categories: ['hospital', 'emergency'],
          address: '456 Main St, City',
          latitude: 28.6200,
          longitude: 77.2150,
          distanceMeters: 850,
        },
      ];

      mockFindNearbyCandidates.mockResolvedValue(candidateList);
      mockSelectBestDestination.mockResolvedValue({
        selectedPlaceId: 'tomtom_place_hospital_123',
        reason: 'Staffed 24/7 hospital with immediate emergency care within 850 meters.',
        confidence: 'high',
      });
      mockComputeEscapeRoute.mockResolvedValue({
        distanceMeters: 920,
        durationSeconds: 720,
        polyline: '[{"latitude":28.6139,"longitude":77.2090},{"latitude":28.6200,"longitude":77.2150}]',
        legs: [
          {
            distanceMeters: 920,
            durationSeconds: 720,
            points: [
              { latitude: 28.6139, longitude: 77.2090 },
              { latitude: 28.6200, longitude: 77.2150 },
            ],
          },
        ],
        steps: [],
      });

      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139, longitude: 77.2090 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendedDestination.placeId).toBe('tomtom_place_hospital_123');
      expect(response.body.decision.selectedPlaceId).toBe('tomtom_place_hospital_123');
      expect(mockComputeEscapeRoute).toHaveBeenCalledTimes(1);
    });

    // Test 5: Gemini selects an invalid place ID (Routing API must NOT be called)
    it('Test 5: should handle Gemini selecting an invalid place ID without calling TomTom Routing API', async () => {
      const candidateList = [
        {
          placeId: 'tomtom_valid_police_456',
          name: 'Central Police Station',
          category: 'police',
          address: '789 Police Blvd',
          latitude: 28.6180,
          longitude: 77.2120,
          distanceMeters: 600,
        },
      ];

      mockFindNearbyCandidates.mockResolvedValue(candidateList);
      mockSelectBestDestination.mockResolvedValue({
        selectedPlaceId: 'hallucinated_unknown_id',
        reason: 'Hallucinated destination.',
        confidence: 'low',
      });

      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139, longitude: 77.2090 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DESTINATION_SELECTED');
      // Crucial verification: Routing API must NOT be called
      expect(mockComputeEscapeRoute).not.toHaveBeenCalled();
    });

    // Test 6: TomTom Routing API succeeds
    it('Test 6: should succeed when TomTom Routing API returns valid route geometry and timing', async () => {
      const candidateList = [
        {
          placeId: 'tomtom_police_999',
          name: 'City Police Station',
          category: 'police',
          address: '10 Safety Lane',
          latitude: 28.6150,
          longitude: 77.2100,
          distanceMeters: 300,
        },
      ];

      mockFindNearbyCandidates.mockResolvedValue(candidateList);
      mockSelectBestDestination.mockResolvedValue({
        selectedPlaceId: 'tomtom_police_999',
        reason: 'Close police facility offering immediate protection.',
        confidence: 'high',
      });
      mockComputeEscapeRoute.mockResolvedValue({
        distanceMeters: 340,
        durationSeconds: 260,
        polyline: '[{"latitude":28.6139,"longitude":77.2090}]',
        legs: [],
        steps: [{ message: 'Walk north on Road' }],
      });

      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139, longitude: 77.2090 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.route.distanceMeters).toBe(340);
      expect(response.body.route.durationSeconds).toBe(260);
      expect(response.body.route.steps).toBeDefined();
    });

    // Test 7: TomTom Routing API fails
    it('Test 7: should handle TomTom Routing API failure gracefully', async () => {
      const candidateList = [
        {
          placeId: 'tomtom_place_pharmacy_777',
          name: '24/7 Pharmacy',
          category: 'pharmacy',
          address: '24 Market St',
          latitude: 28.6145,
          longitude: 77.2095,
          distanceMeters: 200,
        },
      ];

      mockFindNearbyCandidates.mockResolvedValue(candidateList);
      mockSelectBestDestination.mockResolvedValue({
        selectedPlaceId: 'tomtom_place_pharmacy_777',
        reason: 'Open well-lit commercial pharmacy nearby.',
        confidence: 'high',
      });
      mockComputeEscapeRoute.mockRejectedValue(
        new RoutesApiError('Failed to compute route from TomTom Routing API.')
      );

      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139, longitude: 77.2090 });

      expect(response.status).toBe(502);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ROUTES_API_ERROR');
    });

    // Test 8: Complete successful flow
    it('Test 8: should execute complete successful end-to-end flow: User Coordinates -> TomTom Search -> Candidates -> Gemini -> Validated Candidate -> TomTom Routing -> Normalized Response', async () => {
      const candidateList = [
        {
          placeId: 'tomtom_destination_101',
          name: 'Metro Hospital & Trauma Centre',
          category: 'hospital',
          categories: ['hospital', 'emergency'],
          address: 'Ring Road, Delhi',
          latitude: 28.6250,
          longitude: 77.2200,
          distanceMeters: 1400,
        },
      ];

      mockFindNearbyCandidates.mockResolvedValue(candidateList);
      mockSelectBestDestination.mockResolvedValue({
        selectedPlaceId: 'tomtom_destination_101',
        reason: 'Designated trauma hospital with 24/7 active security and medical presence.',
        confidence: 'high',
      });
      mockComputeEscapeRoute.mockResolvedValue({
        distanceMeters: 1550,
        durationSeconds: 1200,
        polyline: '[{"latitude":28.6139,"longitude":77.2090},{"latitude":28.6250,"longitude":77.2200}]',
        legs: [
          {
            distanceMeters: 1550,
            durationSeconds: 1200,
            points: [
              { latitude: 28.6139, longitude: 77.2090 },
              { latitude: 28.6250, longitude: 77.2200 },
            ],
          },
        ],
        steps: [{ message: 'Head east toward Ring Road' }],
      });

      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139, longitude: 77.2090 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        userLocation: {
          latitude: 28.6139,
          longitude: 77.2090,
        },
        recommendedDestination: {
          placeId: 'tomtom_destination_101',
          name: 'Metro Hospital & Trauma Centre',
          category: 'hospital',
          address: 'Ring Road, Delhi',
          latitude: 28.6250,
          longitude: 77.2200,
        },
        decision: {
          selectedPlaceId: 'tomtom_destination_101',
          confidence: 'high',
        },
        route: {
          distanceMeters: 1550,
          durationSeconds: 1200,
        },
      });

      // Check internal fields are sanitized
      expect(response.body.recommendedDestination.categories).toBeUndefined();
      expect(response.body.recommendedDestination.distanceMeters).toBeUndefined();
      expect(response.body.generatedAt).toBeDefined();
    });
  });
});
