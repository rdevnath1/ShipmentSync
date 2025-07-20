// Standardized tracking status mapping across carriers
export enum StandardTrackingStatus {
  LABEL_CREATED = 'label_created',
  PICKED_UP = 'picked_up', 
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  DELIVERY_ATTEMPTED = 'delivery_attempted',
  EXCEPTION = 'exception',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export interface TrackingEvent {
  status: StandardTrackingStatus;
  description: string;
  location: string;
  timestamp: Date;
  rawStatus?: string;
  carrierSpecific?: any;
}

export class StatusMapper {
  // Jiayou status code mapping
  private static jiayouStatusMap: Record<string, StandardTrackingStatus> = {
    // Early stages
    '100': StandardTrackingStatus.LABEL_CREATED,
    '110': StandardTrackingStatus.LABEL_CREATED,
    '120': StandardTrackingStatus.LABEL_CREATED,
    
    // Pickup and processing
    '200': StandardTrackingStatus.PICKED_UP,
    '210': StandardTrackingStatus.PICKED_UP,
    '220': StandardTrackingStatus.IN_TRANSIT,
    '230': StandardTrackingStatus.IN_TRANSIT,
    
    // Transit stages
    '300': StandardTrackingStatus.IN_TRANSIT,
    '310': StandardTrackingStatus.IN_TRANSIT,
    '315': StandardTrackingStatus.IN_TRANSIT,
    '320': StandardTrackingStatus.IN_TRANSIT,
    '330': StandardTrackingStatus.IN_TRANSIT,
    '340': StandardTrackingStatus.IN_TRANSIT,
    '350': StandardTrackingStatus.IN_TRANSIT,
    
    // Customs and international transit
    '400': StandardTrackingStatus.IN_TRANSIT,
    '410': StandardTrackingStatus.IN_TRANSIT,
    '420': StandardTrackingStatus.IN_TRANSIT,
    '430': StandardTrackingStatus.IN_TRANSIT,
    
    // Local delivery
    '500': StandardTrackingStatus.OUT_FOR_DELIVERY,
    '510': StandardTrackingStatus.OUT_FOR_DELIVERY,
    '520': StandardTrackingStatus.DELIVERY_ATTEMPTED,
    
    // Final states
    '600': StandardTrackingStatus.DELIVERED,
    '610': StandardTrackingStatus.DELIVERED,
    '700': StandardTrackingStatus.EXCEPTION,
    '800': StandardTrackingStatus.RETURNED,
    '900': StandardTrackingStatus.CANCELLED,
  };

  private static jiayouStatusDescriptions: Record<string, string> = {
    '100': 'Order received',
    '110': 'Order processing', 
    '120': 'Parcel data received',
    '200': 'Package picked up',
    '210': 'Departed from origin facility',
    '220': 'In transit to destination country',
    '230': 'Arrived at sorting facility',
    '300': 'Departed from sorting facility',
    '310': 'In transit',
    '315': 'Order received',
    '320': 'Customs processing',
    '330': 'Customs cleared',
    '340': 'Arrived in destination country',
    '350': 'Departed from destination facility',
    '400': 'Arrived at local facility',
    '410': 'Customs inspection',
    '420': 'Customs cleared',
    '430': 'Forwarded to local delivery',
    '500': 'Out for delivery',
    '510': 'Delivery attempted',
    '520': 'Delivery attempted - recipient not available',
    '600': 'Delivered',
    '610': 'Delivered - signed for',
    '700': 'Exception - contact carrier',
    '800': 'Return to sender',
    '900': 'Order cancelled',
  };

  static mapJiayouStatus(pathCode: string, pathInfo?: string): TrackingEvent {
    const status = this.jiayouStatusMap[pathCode] || StandardTrackingStatus.IN_TRANSIT;
    const description = this.jiayouStatusDescriptions[pathCode] || pathInfo || 'Status update';
    
    return {
      status,
      description,
      location: '',
      timestamp: new Date(),
      rawStatus: pathCode,
      carrierSpecific: { jiayouPathCode: pathCode }
    };
  }

  static getStatusDisplayInfo(status: StandardTrackingStatus) {
    const statusInfo = {
      [StandardTrackingStatus.LABEL_CREATED]: {
        display: 'Label Created',
        color: 'blue',
        icon: '📋',
        customerMessage: 'Your order is being prepared for shipment'
      },
      [StandardTrackingStatus.PICKED_UP]: {
        display: 'Picked Up', 
        color: 'orange',
        icon: '📦',
        customerMessage: 'Package has been picked up by carrier'
      },
      [StandardTrackingStatus.IN_TRANSIT]: {
        display: 'In Transit',
        color: 'blue', 
        icon: '🚚',
        customerMessage: 'Package is on its way to destination'
      },
      [StandardTrackingStatus.OUT_FOR_DELIVERY]: {
        display: 'Out for Delivery',
        color: 'green',
        icon: '🚛', 
        customerMessage: 'Package is out for delivery today'
      },
      [StandardTrackingStatus.DELIVERED]: {
        display: 'Delivered',
        color: 'green',
        icon: '✅',
        customerMessage: 'Package has been successfully delivered'
      },
      [StandardTrackingStatus.DELIVERY_ATTEMPTED]: {
        display: 'Delivery Attempted',
        color: 'yellow',
        icon: '⚠️',
        customerMessage: 'Delivery was attempted but unsuccessful'
      },
      [StandardTrackingStatus.EXCEPTION]: {
        display: 'Exception',
        color: 'red',
        icon: '⚠️', 
        customerMessage: 'There is an issue with your shipment'
      },
      [StandardTrackingStatus.RETURNED]: {
        display: 'Returned',
        color: 'red',
        icon: '↩️',
        customerMessage: 'Package is being returned to sender'
      },
      [StandardTrackingStatus.CANCELLED]: {
        display: 'Cancelled',
        color: 'gray',
        icon: '❌',
        customerMessage: 'Shipment has been cancelled'
      },
    };

    return statusInfo[status];
  }

  // Method to determine if status indicates successful delivery
  static isDelivered(status: StandardTrackingStatus): boolean {
    return status === StandardTrackingStatus.DELIVERED;
  }

  // Method to determine if status indicates an active shipment
  static isActive(status: StandardTrackingStatus): boolean {
    return [
      StandardTrackingStatus.LABEL_CREATED,
      StandardTrackingStatus.PICKED_UP,
      StandardTrackingStatus.IN_TRANSIT,
      StandardTrackingStatus.OUT_FOR_DELIVERY,
      StandardTrackingStatus.DELIVERY_ATTEMPTED,
    ].includes(status);
  }

  // Method to determine if status indicates a problem
  static isProblem(status: StandardTrackingStatus): boolean {
    return [
      StandardTrackingStatus.EXCEPTION,
      StandardTrackingStatus.DELIVERY_ATTEMPTED,
    ].includes(status);
  }

  // Method to determine if status is final (no more updates expected)
  static isFinal(status: StandardTrackingStatus): boolean {
    return [
      StandardTrackingStatus.DELIVERED,
      StandardTrackingStatus.RETURNED,
      StandardTrackingStatus.CANCELLED,
    ].includes(status);
  }
}