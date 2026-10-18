export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }

  static badRequest = (message: string, details?: unknown) => new ApiError(400, 'BAD_REQUEST', message, details);
  static unauthorized = (message = 'Authentication required') => new ApiError(401, 'UNAUTHORIZED', message);
  static forbidden = (message = 'You do not have access to this resource') => new ApiError(403, 'FORBIDDEN', message);
  static notFound = (entity: string) => new ApiError(404, 'NOT_FOUND', `${entity} not found`);
  static conflict = (message: string) => new ApiError(409, 'CONFLICT', message);
}
