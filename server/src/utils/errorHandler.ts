/**
 * Error Handling Utilities
 *
 * This module provides centralized error handling for the Express application.
 * It includes middleware for catching and formatting errors in a consistent way.
 */

import { Request, Response, NextFunction } from "express";
import { MongoError } from "mongodb";
import { SuccessResponse, ErrorResponse } from "../types";
import logger from "./logger";

/**
 * Custom ValidationError class for field validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Global error handling middleware
 *
 * This middleware catches all unhandled errors and returns a consistent
 * error response format. It should be the last middleware in the chain.
 *
 * @param err - The error that was thrown
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error for debugging purposes
  // The logger automatically handles environment-specific behavior
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Determine the appropriate HTTP status code and error message
  const errorDetails = parseErrorDetails(err);

  const response: ErrorResponse = createErrorResponse(
    errorDetails.message,
    errorDetails.code,
    errorDetails.details
  );

  // Send the error response
  res.status(errorDetails.statusCode).json(response);
}

/**
 * Creates a standardized error response based on the error type
 *
 * @param err - The error to process
 * @returns Object containing status code, message, and optional details
 */
/**
 * Internal helper function to parse error details and determine HTTP status codes
 */
function parseErrorDetails(err: Error): {
  message: string;
  code: string;
  details?: any;
  statusCode: number;
} {
  // MongoDB specific error handling
  if (err instanceof MongoError) {
    switch (err.code) {
      case 11000:
        return {
          message: "Duplicate key error",
          code: "DUPLICATE_KEY",
          details: "A document with this data already exists",
          statusCode: 409,
        };
      case 121:
        // Document validation failed
        return {
          statusCode: 400,
          message: "Document validation failed",
          code: "DOCUMENT_VALIDATION_ERROR",
          details: err.message,
        };
      default:
        return {
          message: "Database error",
          code: "DATABASE_ERROR",
          details: err.code,
          statusCode: 500,
        };
    }
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.message,
      statusCode: 400,
    };
  }

  // Default error handling
  return {
    message: err.message || "Internal server error",
    code: "INTERNAL_ERROR",
    statusCode: 500,
  };
}

/**
 * Async wrapper function for route handlers
 *
 * This function wraps async route handlers to automatically catch
 * and forward any errors to the error handling middleware.
 *
 * Usage:
 * app.get('/route', asyncHandler(async (req, res) => {
 *   // Your async code here
 * }));
 *
 * @param fn - Async route handler function
 * @returns Express middleware function
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      fn(req, res, next).catch(next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Creates a standardized success response
 *
 * @param data - The data to include in the response
 * @param message - Optional success message
 * @returns Standardized success response object
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    message: message || "Operation completed successfully",
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized error response
 *
 * @param message - Error message
 * @param code - Optional error code
 * @param details - Optional error details
 * @returns Standardized error response object
 */
export function createErrorResponse(
  message: string,
  code?: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    message,
    error: {
      message,
      code,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates that required fields are present in the request body
 *
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @throws ValidationError if any required fields are missing
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(
    (field) => body[field] == null || body[field] === ""
  );

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(", ")}`
    );
  }
}
