import axios from 'axios';
import crypto from 'crypto';
import { storage } from '../storage';
import { CarrierWrapper, type CarrierService, type CarrierResponse } from '../utils/carrier-wrapper';
import { AddressValidator } from '../utils/address-validator';
import { StatusMapper, StandardTrackingStatus } from '../utils/status-mapper';
import { auditLogger } from '../utils/audit-logger';
import { JiayouService } from './jiayou';

// Enhanced Jiayou service that implements CarrierService interface
export class EnhancedJiayouService implements CarrierService {
  private wrapper: CarrierWrapper;
  private jiayouService: JiayouService;

  constructor(organizationId?: number, userId?: number) {
    this.jiayouService = new JiayouService();
    this.wrapper = new CarrierWrapper('jiayou', this.jiayouService, organizationId, userId);
  }

  async createShipment(orderData: any): Promise<CarrierResponse> {
    return await this.wrapper.executeWithLogging(
      'create_shipment',
      async () => {
        // Pre-validation using our enhanced address validator
        const addressValidation = AddressValidator.validateAddress(orderData.shippingAddress);
        if (!addressValidation.valid) {
          throw new Error(`Address validation failed: ${addressValidation.errors.join(', ')}`);
        }

        // Additional business validation
        const orderValidation = AddressValidator.validateOrder(orderData);
        if (!orderValidation.valid) {
          throw new Error(`Order validation failed: ${orderValidation.errors.join(', ')}`);
        }

        // Call original Jiayou service
        const response = await this.jiayouService.createOrder(orderData);
        
        // Store enhanced tracking event
        if (response.success && response.data?.trackingNumber) {
          await this.createEnhancedTrackingEvent(
            response.data.trackingNumber,
            orderData.id,
            StandardTrackingStatus.LABEL_CREATED,
            'Order created and label generated'
          );
        }

        return response;
      },
      orderData,
      orderData.id?.toString()
    );
  }

  async trackShipment(trackingNumber: string): Promise<CarrierResponse> {
    return await this.wrapper.executeWithLogging(
      'track_shipment',
      async () => {
        const response = await this.jiayouService.getTrackingInfo(trackingNumber);
        
        // Enhanced tracking processing with status mapping
        if (response.success && response.data?.fromDetail?.length > 0) {
          await this.processTrackingUpdates(trackingNumber, response.data.fromDetail);
        }

        return response;
      },
      { trackingNumber },
      trackingNumber
    );
  }

  async printLabel(trackingNumbers: string[]): Promise<CarrierResponse> {
    return await this.wrapper.executeWithLogging(
      'print_label',
      async () => {
        // For now, delegate to the original service
        // Could be enhanced to support batch label printing
        if (trackingNumbers.length === 1) {
          return await this.jiayouService.getLabelUrl(trackingNumbers[0]);
        } else {
          throw new Error('Batch label printing not yet implemented');
        }
      },
      { trackingNumbers }
    );
  }

  async validateAddress(address: any): Promise<CarrierResponse> {
    const validation = AddressValidator.validateAddress(address);
    
    return {
      success: validation.valid,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      error: validation.valid ? undefined : {
        message: validation.errors.join(', '),
        carrierCode: 'address_validation_failed',
        httpStatus: 400,
        retryable: false,
      }
    };
  }

  async checkCoverage(address: any): Promise<CarrierResponse> {
    return await this.wrapper.executeWithLogging(
      'check_coverage',
      async () => {
        const response = await this.jiayouService.getCoverageForAddress(
          address.postalCode,
          address.country
        );

        return response;
      },
      { address },
      `${address.country}-${address.postalCode}`
    );
  }

  // Enhanced tracking event processing
  private async processTrackingUpdates(trackingNumber: string, trackingDetails: any[]) {
    try {
      for (const detail of trackingDetails) {
        // Map Jiayou status to standard status
        const mappedEvent = StatusMapper.mapJiayouStatus(
          detail.pathCode, 
          detail.pathInfo
        );

        // Create enhanced tracking event
        await this.createEnhancedTrackingEvent(
          trackingNumber,
          undefined, // Could find order ID if needed
          mappedEvent.status,
          mappedEvent.description,
          detail.pathAddr,
          new Date(detail.pathTime || Date.now())
        );

        // Store raw carrier response for debugging
        await storage.createCarrierLog({
          carrierName: 'jiayou',
          operation: 'track_update',
          requestPayload: { trackingNumber },
          responsePayload: detail,
          statusCode: 200,
          success: true,
          resourceId: trackingNumber,
          endpoint: '/api/tracking/query/trackInfo',
        });
      }
    } catch (error) {
      console.error('Error processing tracking updates:', error);
      // Don't throw here - tracking updates are supplementary
    }
  }

  private async createEnhancedTrackingEvent(
    trackingNumber: string,
    orderId?: number,
    status: StandardTrackingStatus = StandardTrackingStatus.IN_TRANSIT,
    description: string = 'Status update',
    location: string = '',
    timestamp: Date = new Date()
  ) {
    try {
      await storage.createEnhancedTrackingEvent({
        orderId,
        trackingNumber,
        standardStatus: status,
        description,
        location,
        carrierName: 'jiayou',
        timestamp,
        carrierSpecific: {
          carrier: 'jiayou',
          channel: 'US001'
        }
      });
    } catch (error) {
      console.error('Error creating enhanced tracking event:', error);
    }
  }

  // Merchant-friendly error handling
  handleError(error: any): string {
    if (this.wrapper) {
      return this.wrapper.getMerchantFriendlyError(error);
    }

    // Fallback error handling
    if (error.message?.includes('PO Box') || error.message?.includes('邮政信箱')) {
      return 'This address appears to be a PO Box. Please provide a street address for delivery.';
    }
    
    if (error.message?.includes('coverage') || error.message?.includes('不在服务范围')) {
      return 'Sorry, we cannot ship to this location. Please try a different address.';
    }

    if (error.message?.includes('address') || error.message?.includes('地址')) {
      return 'The provided address is invalid. Please check and correct the address details.';
    }

    return error.message || 'An unexpected shipping error occurred.';
  }
}