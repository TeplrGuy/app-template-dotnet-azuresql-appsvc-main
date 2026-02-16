import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponse } from '../errors/error-response';

interface ExceptionResponseObject {
  message?: string;
  error?: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined;
    let details: unknown;
    let retryable = false;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else {
        const objResponse = exResponse as ExceptionResponseObject;
        message = objResponse.message ?? exception.message;
        error = objResponse.error;
        details = objResponse.details;
      }
    } else if (this.isPrismaError(exception)) {
      const mapped = this.mapPrismaError(exception);
      status = mapped.status;
      message = mapped.message;
      error = mapped.error;
      retryable = mapped.retryable;
    }

    // Transient failures are retryable
    if (
      status === HttpStatus.SERVICE_UNAVAILABLE ||
      status === HttpStatus.GATEWAY_TIMEOUT
    ) {
      retryable = true;
    }

    const body: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(error ? { error } : {}),
      ...(details ? { details } : {}),
      ...(retryable ? { retryable } : {}),
    };

    response.status(status).json(body);
  }

  private isPrismaError(
    exception: unknown,
  ): exception is { code: string; meta?: Record<string, unknown> } {
    return (
      typeof exception === 'object' && exception !== null && 'code' in exception
    );
  }

  private mapPrismaError(exception: {
    code: string;
    meta?: Record<string, unknown>;
  }) {
    switch (exception.code) {
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
          retryable: false,
        };
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Unique constraint violation',
          error: 'Conflict',
          retryable: false,
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          error: 'Bad Request',
          retryable: false,
        };
      case 'P1001':
      case 'P1002':
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database connection error',
          error: 'Service Unavailable',
          retryable: true,
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
          error: 'Internal Server Error',
          retryable: false,
        };
    }
  }
}
