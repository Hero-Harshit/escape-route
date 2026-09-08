import request from 'supertest';
import app from '../src/app';

// Mock the services before importing controllers or routes that might use them
jest.mock('../src/services/places.service', () => {
  return {
    PlacesService: jest.fn().mockImplementation(() => {
      return {
        findNearbyCandidates: jest.fn().mockImplementation((location) => {
          if (location.latitude === 10 && location.longitude === 10) {
            return Promise.resolve([]);
          }
          if (location.latitude === 20 && location.longitude === 20) {
            return Promise.reject(new Error('Places API Error'));
          }
          return Promise.resolve([
            {
              placeId: 'test_place_1',
              name: 'Test Hospital',
              type: 'hospital',
              types: ['hospital'],
              address: '123 Test St',
              latitude: 28.5672,
              longitude: 77.2100,
              businessStatus: 'OPERATIONAL',
              openNow: true,
              rating: 4.5,
              distanceMeters: 3500,
            }
          ]);
        })
      };
    })
  };
});

jest.mock('../src/services/gemini.service', () => {
  return {
    GeminiService: jest.fn().mockImplementation(() => {
      return {
        selectBestDestination: jest.fn().mockImplementation((loc, time, candidates) => {
          if (loc.latitude === 30 && loc.longitude === 30) {
            return Promise.resolve({
              selectedPlaceId: 'unknown_place_id',
              reason: 'I hallucinated this.',
              confidence: 'low'
            });
          }
          return Promise.resolve({
            selectedPlaceId: 'test_place_1',
            reason: 'It is a hospital.',
            confidence: 'high'
          });
        })
      };
    })
  };
});

jest.mock('../src/services/routes.service', () => {
  return {
    RoutesService: jest.fn().mockImplementation(() => {
      return {
        computeEscapeRoute: jest.fn().mockImplementation((loc, placeId) => {
          if (loc.latitude === 40 && loc.longitude === 40) {
            return Promise.reject(new Error('Routes API Error'));
          }
          return Promise.resolve({
            distanceMeters: 3500,
            durationSeconds: 2700,
            polyline: 'test_polyline',
            steps: []
          });
        })
      };
    })
  };
});


describe('Escape Route API Tests', () => {
  
  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('POST /api/escape-route', () => {
    it('should reject requests with missing coordinates', async () => {
      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139 });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid coordinate ranges', async () => {
      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 100, longitude: 77.2090 });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle Places API failure gracefully (500 internal error mapped by error handler if mocked simply)', async () => {
      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 20, longitude: 20 });
      
      // Since it's a generic Error thrown by the mock or mapped to 500
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle zero candidates found gracefully', async () => {
      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 10, longitude: 10 });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_ESCAPE_DESTINATION_FOUND');
    });

    it('should handle Gemini selecting an unknown place ID gracefully', async () => {
      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 30, longitude: 30 });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DESTINATION_SELECTED');
    });

    it('should handle Routes API failure gracefully', async () => {
      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 40, longitude: 40 });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should return a successful route with expected structure', async () => {
      const response = await request(app)
        .post('/api/escape-route')
        .send({ latitude: 28.6139, longitude: 77.2090 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.userLocation).toBeDefined();
      expect(response.body.recommendedDestination).toBeDefined();
      expect(response.body.decision).toBeDefined();
      expect(response.body.route).toBeDefined();
      
      // Verify safe destination object (should not have 'types' or 'openNow')
      expect(response.body.recommendedDestination.types).toBeUndefined();
      expect(response.body.recommendedDestination.openNow).toBeUndefined();
      expect(response.body.recommendedDestination.placeId).toBe('test_place_1');
    });
  });
});
