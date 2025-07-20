import { auditLogger } from "./audit-logger";
import { ErrorHandler, StandardizedError } from "./error-handler";
import { retryQueue } from "./retry-queue";

export interface CarrierResponse<T = any> {
  success: boolean;
  data?: T;
  error?: StandardizedError;
  rawResponse?: any;
}

export interface CarrierService {
  createShipment(order: any): Promise<CarrierResponse>;
  trackShipment(trackingNumber: string): Promise<CarrierResponse>;
  printLabel(trackingNumbers: string[]): Promise<CarrierResponse>;
  validateAddress?(address: any): Promise<CarrierResponse>;
  checkCoverage?(address: any): Promise<CarrierResponse>;
}

export class CarrierWrapper {
  constructor(
    private carrierName: string,
    private carrierService: any,
    private organizationId?: number,
    private userId?: number
  ) {}

  async executeWithLogging<T>(
    operation: string,
    apiCall: () => Promise<T>,
    payload?: any,
    resourceId?: string
  ): Promise<CarrierResponse<T>> {
    const startTime = Date.now();
    let rawResponse: any;
    let success = false;
    let error: StandardizedError | undefined;

    try {
      rawResponse = await apiCall();
      success = this.isSuccessfulResponse(rawResponse);
      
      if (!success) {
        error = ErrorHandler.standardizeError(
          new Error(this.extractErrorMessage(rawResponse)),
          `${this.carrierName}_${operation}`
        );
      }

      return {
        success,
        data: success ? rawResponse : undefined,
        error,
        rawResponse,
      };
    } catch (err) {
      error = ErrorHandler.standardizeError(err, `${this.carrierName}_${operation}`);
      success = false;

      // Add to retry queue if retryable
      if (ErrorHandler.shouldRetry(error)) {
        await retryQueue.addJob({
          type: `${this.carrierName}_${operation}`,
          payload: { ...payload, resourceId },
          organizationId: this.organizationId,
          maxAttempts: 3,
        });
      }

      return {
        success: false,
        error,
        rawResponse: err,
      };
    } finally {
      const duration = Date.now() - startTime;

      // Log to audit system
      await auditLogger.log({
        organizationId: this.organizationId,
        userId: this.userId,
        action: `${this.carrierName}_${operation}`,
        resource: this.carrierName.toLowerCase(),
        resourceId,
        requestData: this.sanitizePayload(payload),
        responseData: this.sanitizeResponse(rawResponse),
        success,
        error: error?.message,
        duration,
      });

      // Store raw response for debugging if operation failed
      if (!success && rawResponse) {
        await this.storeRawResponse(operation, payload, rawResponse, error);
      }
    }
  }

  private isSuccessfulResponse(response: any): boolean {
    // Jiayou-specific success detection
    if (response && typeof response.code !== 'undefined') {
      return response.code === 1 || response.code === 200;
    }
    
    // Generic success detection
    if (response && response.status) {
      return response.status >= 200 && response.status < 300;
    }

    // Default to true if we got any response without obvious error
    return response !== null && response !== undefined;
  }

  private extractErrorMessage(response: any): string {
    // Jiayou-specific error extraction
    if (response?.message) {
      return this.translateError(response.message);
    }
    
    if (response?.error) {
      return response.error;
    }

    return "Unknown carrier error";
  }

  private translateError(message: string): string {
    // Translation map for common carrier errors to merchant-friendly messages
    const errorMap: Record<string, string> = {
      // Address errors
      "收件地址不支持": "Delivery address not supported",
      "地址格式错误": "Invalid address format",
      "邮编错误": "Invalid postal code",
      
      // Weight/dimension errors
      "重量超限": "Package exceeds weight limit",
      "尺寸超限": "Package exceeds size limit",
      "重量不能为空": "Package weight is required",
      
      // Service errors  
      "渠道不支持": "Shipping service not available for this destination",
      "服务类型错误": "Invalid service type selected",
      
      // Authentication errors
      "签名错误": "Carrier authentication failed",
      "用户未授权": "Carrier account not authorized",
      
      // Coverage errors
      "不在服务范围": "Destination not in service area",
      "暂不支持该地区": "Region temporarily not supported",
    };

    // Check for exact matches first
    if (errorMap[message]) {
      return errorMap[message];
    }

    // Check for partial matches
    for (const [chinese, english] of Object.entries(errorMap)) {
      if (message.includes(chinese)) {
        return english;
      }
    }

    // Fallback to original message if no translation found
    return message;
  }

  private sanitizePayload(payload: any): any {
    if (!payload) return null;
    
    const sanitized = JSON.parse(JSON.stringify(payload));
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'secret', 'token', 'key', 'auth', 'signature'];
    const removeSensitive = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            removeSensitive(obj[key]);
          }
        }
      }
    };

    removeSensitive(sanitized);
    return sanitized;
  }

  private sanitizeResponse(response: any): any {
    if (!response) return null;
    
    // For successful responses, only keep essential data for audit
    const sanitized = {
      code: response?.code,
      message: response?.message,
      data: response?.data ? {
        trackingNumber: response.data.trackingNumber || response.data.orderNumber,
        status: response.data.status,
        // Don't store full address or personal data in audit logs
      } : undefined,
    };

    return sanitized;
  }

  private async storeRawResponse(operation: string, payload: any, response: any, error?: StandardizedError): Promise<void> {
    // Store raw response in database for debugging
    // This could be implemented as a separate table or enhanced audit log
    try {
      console.log(`[${this.carrierName}] Raw Response for ${operation}:`, {
        operation,
        payload: this.sanitizePayload(payload),
        response,
        error: error?.message,
        timestamp: new Date().toISOString(),
      });
      
      // TODO: Implement database storage for raw responses
      // await storage.createCarrierLog({
      //   carrierName: this.carrierName,
      //   operation,
      //   payload,
      //   response,
      //   success: !error,
      //   error: error?.message,
      //   organizationId: this.organizationId,
      // });
    } catch (err) {
      console.error("Failed to store raw carrier response:", err);
    }
  }

  // Merchant-friendly error messages
  getMerchantFriendlyError(error: StandardizedError): string {
    const friendlyMessages: Record<string, string> = {
      'po_box_not_supported': 'This address appears to be a PO Box. Please provide a street address for delivery.',
      'coverage_not_available': 'Sorry, we cannot ship to this location. Please try a different address.',
      'invalid_address': 'The provided address is invalid. Please check and correct the address details.',
      'carrier_timeout': 'Our shipping partner is temporarily unavailable. Please try again in a few minutes.',
      'rate_limit_exceeded': 'Too many requests. Please wait a moment before trying again.',
      'insufficient_postage': 'The package details result in higher shipping costs. Please review package weight and dimensions.',
    };

    return friendlyMessages[error.carrierCode || ''] || error.message || 'An unexpected shipping error occurred.';
  }
}