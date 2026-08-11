export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly fields?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    fields?: Record<string, string>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, 400, "VALIDATION_ERROR", fields);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class DuplicateError extends AppError {
  constructor(field: string, value: string) {
    super(`${field} "${value}" already exists`, 409, "DUPLICATE");
    this.name = "DuplicateError";
  }
}

export class InvalidStateError extends AppError {
  constructor(message: string) {
    super(message, 422, "INVALID_STATE");
    this.name = "InvalidStateError";
  }
}
