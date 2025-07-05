import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { auditLog } from '@shared/schema';

// Extended Request interface for audit context
interface AuditRequest extends Request {
  auditContext?: {
    action: string;
    tableName: string;
    recordId?: number;
    oldValues?: any;
    newValues?: any;
    description?: string;
  };
}

// Audit logging function
export async function logAuditEvent(
  userId: number | null,
  action: string,
  tableName: string,
  recordId: number | null,
  oldValues: any = null,
  newValues: any = null,
  ipAddress: string,
  userAgent: string,
  description?: string
) {
  try {
    await db.insert(auditLog).values({
      userId,
      action,
      tableName,
      recordId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      description,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - we don't want audit failures to break the main operation
  }
}

// Middleware to capture audit context
export const auditMiddleware = (action: string, tableName: string) => {
  return (req: AuditRequest, res: Response, next: NextFunction) => {
    req.auditContext = {
      action,
      tableName,
    };
    next();
  };
};

// Middleware to log audit events after successful operations
export const logAuditMiddleware = async (req: AuditRequest, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Only log if the operation was successful (status 200-299)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.auditContext) {
      const userId = (req as any).user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      // Log the audit event (don't await to avoid blocking the response)
      logAuditEvent(
        userId,
        req.auditContext.action,
        req.auditContext.tableName,
        req.auditContext.recordId,
        req.auditContext.oldValues,
        req.auditContext.newValues,
        ipAddress,
        userAgent,
        req.auditContext.description
      ).catch(error => {
        console.error('Audit logging failed:', error);
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Helper function to set audit context data
export const setAuditContext = (req: AuditRequest, data: Partial<AuditRequest['auditContext']>) => {
  if (req.auditContext) {
    Object.assign(req.auditContext, data);
  }
};