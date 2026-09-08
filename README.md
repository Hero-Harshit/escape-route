# Escape Route Backend Module

This repository contains the Escape Route backend feature for the women's safety application.
It exposes an API endpoint to find a safe destination nearby in an emergency and calculate a pedestrian route to it.

## Architecture & Flow

```text
User GPS coordinates
        ↓
TomTom Search API (Points of Interest / Nearby Search)
        ↓
Nearby candidate places (normalized factual metadata)
        ↓
Gemini Flash LLM
        ↓
Selects ONE candidate destination using its TomTom place ID
        ↓
Backend validates selected place ID against candidate list
        ↓
TomTom Routing API (Calculate Route)
        ↓
Pedestrian route to selected destination
        ↓
Backend returns normalized escape-route response
```

## Features
- **TomTom Search API (POI / Nearby Search)**: Discovers factual nearby candidate destinations (police stations, hospitals, pharmacies, transit stations, populated commercial venues).
- **Gemini Flash Decision Layer**: Acts as an intelligent emergency navigation advisor, evaluating candidate safety profiles, current server time, operational suitability, and distances.
- **TomTom Routing API**: Calculates pedestrian navigation geometry, distances, and durations to the validated candidate destination.
- **Provider Isolation & Normalization**: Keeps provider-specific schemas abstracted away from clients.

## Requirements
- Node.js 18+
- TypeScript
- TomTom API Key (with Search API and Routing API enabled)
- Gemini API Key

## Setup & Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and configure the variables (see `.env.example`).
   ```bash
   PORT=3000
   TOMTOM_API_KEY=your_tomtom_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PLACES_SEARCH_RADIUS_METERS=5000
   DEFAULT_TRAVEL_MODE=pedestrian
   ```

3. **Run in Development Mode**
   ```bash
   npm run dev
   ```

4. **Build the Application**
   ```bash
   npm run build
   ```

5. **Start Production Build**
   ```bash
   npm start
   ```

6. **Run Tests**
   ```bash
   npm test
   ```

## API Documentation

### POST /api/escape-route

Calculates an emergency escape destination and pedestrian route based on current user coordinates.

**Request Body:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "userLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "recommendedDestination": {
    "placeId": "73210900012345",
    "name": "AIIMS New Delhi",
    "category": "hospital",
    "address": "Sri Aurobindo Marg, Ansari Nagar, New Delhi",
    "latitude": 28.5672,
    "longitude": 77.2100
  },
  "decision": {
    "selectedPlaceId": "73210900012345",
    "reason": "Staffed emergency facility with round-the-clock security and assistance within reasonable walking distance.",
    "confidence": "high"
  },
  "route": {
    "distanceMeters": 1550,
    "durationSeconds": 1200,
    "polyline": "[{\"latitude\":28.6139,\"longitude\":77.2090},{\"latitude\":28.5672,\"longitude\":77.2100}]",
    "legs": [
      {
        "distanceMeters": 1550,
        "durationSeconds": 1200,
        "points": [
          { "latitude": 28.6139, "longitude": 77.2090 },
          { "latitude": 28.5672, "longitude": 77.2100 }
        ]
      }
    ],
    "steps": [
      {
        "message": "Head south on Janpath Road"
      }
    ]
  },
  "generatedAt": "2026-09-08T16:20:00.000Z"
}
```

**Error Response (Example):**
```json
{
  "success": false,
  "error": {
    "code": "NO_ESCAPE_DESTINATION_FOUND",
    "message": "No suitable nearby destinations were found."
  }
}
```

### GET /health

Returns the service health status:
```json
{
  "status": "ok",
  "timestamp": "2026-09-08T16:20:00.000Z"
}
```

## Build and Deployment (Render)

This application is configured for deployment on Render as a Web Service.

- **Build Command:**
  ```bash
  npm install && npm run build
  ```

- **Start Command:**
  ```bash
  npm start
  ```

- **Required Environment Variables in Render Dashboard:**
  - `TOMTOM_API_KEY`: Your TomTom developer API key.
  - `GEMINI_API_KEY`: Your Google AI Studio Gemini API key.
  - `PORT`: (Optional, defaults to 3000 or Render's assigned port).
  - `PLACES_SEARCH_RADIUS_METERS`: (Optional, defaults to 5000).
  - `DEFAULT_TRAVEL_MODE`: (Optional, defaults to `pedestrian`).

## Folder Structure
- `src/app.ts` & `src/server.ts`: Express application and server entry points.
- `src/config/`: Configuration files (`env.ts`, `escapeRoute.config.ts`).
- `src/controllers/`: Express route controllers.
- `src/middleware/`: Centralized error handling and Express middleware.
- `src/prompts/`: Gemini prompt templates.
- `src/routes/`: Express routers (`POST /api/escape-route`).
- `src/services/`: Core services:
  - `places.service.ts`: TomTom Search API integration.
  - `gemini.service.ts`: Gemini decision engine.
  - `routes.service.ts`: TomTom Routing API integration.
  - `escapeRoute.service.ts`: Orchestrator and validator.
- `src/utils/`: Error classes, coordinate validation, and Haversine distance.
- `tests/`: Jest automated unit & integration test suite.
