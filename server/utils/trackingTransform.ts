/**
 * Utility functions for transforming tracking numbers
 * Converts Jiayou tracking numbers from GV prefix to QP prefix
 */

export class TrackingTransform {
  /**
   * Transform Jiayou tracking number from GV to QP format
   * @param jiayouTrackingNumber - Original tracking number from Jiayou (e.g., "GV25USA0U019900646")
   * @returns Transformed tracking number for display/ShipStation (e.g., "QP25USA0U019900646")
   */
  static transformToQP(jiayouTrackingNumber: string): string {
    if (!jiayouTrackingNumber) return jiayouTrackingNumber;
    
    // Replace GV prefix with QP
    if (jiayouTrackingNumber.startsWith('GV')) {
      return jiayouTrackingNumber.replace(/^GV/, 'QP');
    }
    
    return jiayouTrackingNumber;
  }

  /**
   * Transform QP tracking number back to Jiayou GV format for API calls
   * @param qpTrackingNumber - QP tracking number from dashboard/ShipStation (e.g., "QP25USA0U019900646")
   * @returns Original Jiayou tracking number for API calls (e.g., "GV25USA0U019900646")
   */
  static transformToGV(qpTrackingNumber: string): string {
    if (!qpTrackingNumber) return qpTrackingNumber;
    
    // Replace QP prefix with GV
    if (qpTrackingNumber.startsWith('QP')) {
      return qpTrackingNumber.replace(/^QP/, 'GV');
    }
    
    return qpTrackingNumber;
  }

  /**
   * Determine if a tracking number is in QP format
   * @param trackingNumber - Tracking number to check
   * @returns True if tracking number starts with QP
   */
  static isQPFormat(trackingNumber: string): boolean {
    return trackingNumber?.startsWith('QP') || false;
  }

  /**
   * Determine if a tracking number is in GV format
   * @param trackingNumber - Tracking number to check
   * @returns True if tracking number starts with GV
   */
  static isGVFormat(trackingNumber: string): boolean {
    return trackingNumber?.startsWith('GV') || false;
  }
}