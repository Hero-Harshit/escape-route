export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class PlacesApiError extends AppError {
  constructor(message: string) {
    super(message, 502, 'PLACES_API_ERROR');
  }
}

export class NoDestinationsFoundError extends AppError {
  constructor(message: string = 'No suitable nearby destinations were found.') {
    super(message, 404, 'NO_ESCAPE_DESTINATION_FOUND');
  }
}

export class GeminiApiError extends AppError {
  constructor(message: string) {
    super(message, 502, 'GEMINI_API_ERROR');
  }
}

export class RoutesApiError extends AppError {
  constructor(message: string) {
    super(message, 502, 'ROUTES_API_ERROR');
  }
}

export class InvalidDestinationSelectedError extends AppError {
  constructor(message: string = 'The selected destination is invalid or not in the candidate list.') {
    super(message, 500, 'INVALID_DESTINATION_SELECTED');
  }
}
