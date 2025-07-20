import { storage } from "../storage";
import type { InsertAuditLog } from "@shared/schema";

export interface AuditLogOptions {
  organizationId?: number;
  userId?: number;
  action: string;
  resource?: string;
  resourceId?: string;
  method?: string;
  endpoint?: string;
  requestData?: any;
  responseData?: any;
  statusCode?: number;
  success: boolean;
  error?: string;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  async log(options: AuditLogOptions): Promise<void> {
    try {
      const auditData: InsertAuditLog = {
        organizationId: options.organizationId || null,
        userId: options.userId || null,
        action: options.action,
        resource: options.resource || null,
        resourceId: options.resourceId || null,
        method: options.method || null,
        endpoint: options.endpoint || null,
        requestData: this.sanitizeData(options.requestData),
        responseData: this.sanitizeData(options.responseData),
        statusCode: options.statusCode || null,
        success: options.success,
        error: options.error || null,
        duration: options.duration || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      };

      await storage.createAuditLog(auditData);
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw - audit logging should never break the main operation
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return null;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'secret', 'token', 'key', 'auth'];
    const sanitized = JSON.parse(JSON.stringify(data));
    
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
}

export const auditLogger = new AuditLogger();