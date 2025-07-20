export enum ErrorCode {
  // Client errors (400-499)
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  VALIDATION_ERROR = 422,
  RATE_LIMITED = 429,
  
  // Server errors (500-599)
  INTERNAL_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

export enum CarrierErrorCode {
  CARRIER_TIMEOUT = 'carrier_timeout',
  CARRIER_UNAVAILABLE = 'carrier_unavailable',
  INVALID_ADDRESS = 'invalid_address',
  INSUFFICIENT_POSTAGE = 'insufficient_postage',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  COVERAGE_NOT_AVAILABLE = 'coverage_not_available',
  PO_BOX_NOT_SUPPORTED = 'po_box_not_supported',
}

export interface StandardizedError {
  code: ErrorCode;
  carrierCode?: CarrierErrorCode;
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: Date;
}

export class ErrorHandler {
  static standardizeError(error: any, context?: string): StandardizedError {
    const timestamp = new Date();
    
    // Handle known Jiayou errors
    if (error.message?.includes('Chinese error message') || error.code === 0) {
      return {
        code: ErrorCode.BAD_GATEWAY,
        carrierCode: CarrierErrorCode.CARRIER_UNAVAILABLE,
        message: "Shipping service temporarily unavailable",
        details: error,
        retryable: true,
        timestamp,
      };
    }

    // Handle PO Box errors
    if (error.message?.toLowerCase().includes('p.o. box') || 
        error.message?.toLowerCase().includes('po box')) {
      return {
        code: ErrorCode.BAD_REQUEST,
        carrierCode: CarrierErrorCode.PO_BOX_NOT_SUPPORTED,
        message: "PO Box addresses are not supported for this shipping service",
        details: error,
        retryable: false,
        timestamp,
      };
    }

    // Handle coverage errors
    if (error.message?.toLowerCase().includes('coverage') ||
        error.message?.toLowerCase().includes('不支持')) {
      return {
        code: ErrorCode.BAD_REQUEST,
        carrierCode: CarrierErrorCode.COVERAGE_NOT_AVAILABLE,
        message: "Shipping not available to this location",
        details: error,
        retryable: false,
        timestamp,
      };
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        code: ErrorCode.GATEWAY_TIMEOUT,
        carrierCode: CarrierErrorCode.CARRIER_TIMEOUT,
        message: "Request to shipping service timed out",
        details: error,
        retryable: true,
        timestamp,
      };
    }

    // Handle rate limiting
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return {
        code: ErrorCode.RATE_LIMITED,
        carrierCode: CarrierErrorCode.RATE_LIMIT_EXCEEDED,
        message: "Rate limit exceeded. Please try again later",
        details: error,
        retryable: true,
        timestamp,
      };
    }

    // Handle validation errors
    if (error.name === 'ValidationError' || error.status === 422) {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: error.message || "Invalid request data",
        details: error,
        retryable: false,
        timestamp,
      };
    }

    // Default server error
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message || "An unexpected error occurred",
      details: error,
      retryable: true,
      timestamp,
    };
  }

  static shouldRetry(error: StandardizedError): boolean {
    return error.retryable && 
           error.code >= 500 || 
           error.carrierCode === CarrierErrorCode.CARRIER_TIMEOUT ||
           error.carrierCode === CarrierErrorCode.RATE_LIMIT_EXCEEDED;
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 1 minute
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = delay * 0.1 * Math.random();
    return delay + jitter;
  }
}