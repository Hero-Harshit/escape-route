import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred.';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else {
    console.error('Unhandled Exception:', err);
  }

  // Do not expose stack traces or raw errors in production
  const errorResponse: any = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (env.NODE_ENV !== 'production' && !(err instanceof AppError)) {
    errorResponse.error.details = err.message;
  }

  res.status(statusCode).json(errorResponse);
};
