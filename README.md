# Escape Route Backend Module

This repository contains the Escape Route backend feature for the women's safety application.
It exposes an API endpoint to find a safe destination nearby in an emergency and calculate a route to it.

## Features
- Fetches real nearby candidate destinations using Google Places API.
- Intelligently selects the single best safe destination using Gemini.
- Calculates an escape route using Google Routes API.

## Requirements
- Node.js 18+
- TypeScript
- Google Maps Platform API Key (with Places API New and Routes API enabled)
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
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   GEMINI_API_KEY=your_gemini_key
   PLACES_SEARCH_RADIUS_METERS=5000
   DEFAULT_TRAVEL_MODE=WALK
   ```

3. **Run in Development Mode**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## API Documentation

### POST /api/escape-route

Calculates an escape route based on the user's current coordinates.

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
    "placeId": "ChIJc1X...oU",
    "name": "AIIMS New Delhi",
    "type": "hospital",
    "address": "Sri Aurobindo Marg, Ansari Nagar, New Delhi",
    "latitude": 28.5672,
    "longitude": 77.2100
  },
  "decision": {
    "selectedPlaceId": "ChIJc1X...oU",
    "reason": "Open emergency facility offering a reliable populated destination at a practical travel distance.",
    "confidence": "high"
  },
  "route": {
    "distanceMeters": 3500,
    "durationSeconds": 2700,
    "polyline": "encoded_polyline_here...",
    "steps": []
  },
  "generatedAt": "2026-09-08T14:30:00.000Z"
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

Returns the health status of the application.

## Build and Deployment (Render)

This application is ready for deployment on Render as a Web Service.

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

Ensure you configure the Environment Variables (`GOOGLE_MAPS_API_KEY`, `GEMINI_API_KEY`, etc.) in the Render dashboard.

## Folder Structure
- `src/app.ts` & `src/server.ts`: Express application and server entry points.
- `src/config/`: Configuration files and environment variables.
- `src/controllers/`: Express route controllers.
- `src/middleware/`: Express middleware, including centralized error handling.
- `src/prompts/`: Gemini prompt generation.
- `src/routes/`: Express API routers.
- `src/services/`: Core logic (Places, Gemini, Routes).
- `src/utils/`: Helper utilities (validation, errors, distance).
- `tests/`: Jest test suite.
