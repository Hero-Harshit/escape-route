import { Request, Response, NextFunction } from 'express';
import { EscapeRouteService } from '../services/escapeRoute.service';
import { validateEscapeRouteRequest } from '../utils/validation';

export class EscapeRouteController {
  private escapeRouteService: EscapeRouteService;

  constructor() {
    this.escapeRouteService = new EscapeRouteService();
  }

  public generateEscapeRoute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate request payload
      const validRequest = validateEscapeRouteRequest(req.body);

      // Orchestrate business logic
      const response = await this.escapeRouteService.generateEscapeRoute(validRequest);

      // Return successful response
      res.status(200).json(response);
    } catch (error) {
      // Pass error to centralized error handler
      next(error);
    }
  };
}
