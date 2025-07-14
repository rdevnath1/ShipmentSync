import axios from 'axios';
import crypto from 'crypto';

interface JiayouOrderItem {
  ename: string;
  cname?: string;
  sku: string;
  price: number;
  quantity: number;
  weight: number;
  unitCode: string;
  hsCode?: string;
  imageUrl?: string;
  brand?: string;
  specifications?: string;
  material?: string;
  used?: string;
  productUrl?: string;
}

interface JiayouCreateOrderRequest {
  channelCode: string;
  referenceNo: string;
  trackingNo?: string;
  productType: number;
  pweight: number;
  pieces: number;
  insured: number;
  batteryType?: string;
  shipMode?: string;
  consigneeName: string;
  consigneeCompany?: string;
  consigneeCountryCode: string;
  consigneeProvince: string;
  consigneeCity: string;
  consigneeDistrict?: string;
  consigneeStreet?: string;
  consigneeHouseNumber?: string;
  consigneeAddress: string;
  consigneePostcode: string;
  consigneeMobile?: string;
  consigneePhone: string;
  consigneeEmail?: string;
  consigneePassport?: string;
  consigneeWarehouse?: string;
  consigneeTariff?: string;
  shipperName: string;
  shipperCompany?: string;
  shipperCountryCode: string;
  shipperProvince: string;
  shipperCity: string;
  shipperDistrict?: string;
  shipperStreet?: string;
  shipperHouseNumber?: string;
  shipperAddress: string;
  shipperPostcode: string;
  shipperMobile?: string;
  shipperPhone: string;
  shipperEmail?: string;
  codSum?: number;
  arrivePortName?: string;
  overseasReturnStrategy?: string;
  codCurrencyCode?: string;
  currencyCode?: string;
  returnWarehouse?: string;
  memo?: string;
  returnLabel?: string;
  fromAddressId?: string;
  dgNoType?: string;
  dgNo?: string;
  dgPackingInstructions?: string;
  dgPrimaryClass?: string;
  dgProperShippingName?: string;
  dgMeasure?: number;
  dgMeasureUnit?: string;
  dgAircraftCategoryType?: string;
  apiOrderItemList: JiayouOrderItem[];
  apiOrderVolumeList?: Array<{
    length: number;
    width: number;
    height: number;
    quantity: number;
    rweight: number;
    bagNum: string;
  }>;
  signature?: string;
  labelType?: string;
}

interface JiayouCreateOrderResponse {
  code: number;
  message: string;
  data: {
    referenceNo: string;
    orderId: string;
    trackingNo: string;
    markNo: string;
    labelPath: string;
    areaCode: number;
    sortCode: string;
    returnQRCode?: string;
    returnQRCodeUrl?: string;
    packageResults?: Array<{
      subTrackingNo: string;
      labelPath: string;
      bagNum: string;
    }>;
  };
}

export class JiayouService {
  private apiKey: string;
  private clientId: string;
  private baseUrl = 'https://api.jygjexp.com/v1';

  constructor() {
    this.apiKey = process.env.JIAYOU_API_KEY || 'd370d0ee7e704117bfca9184bc03f590';
    this.clientId = process.env.JIAYOU_CLIENT_ID || '769908';
  }

  private generateSignature(code: string, apiKey: string): string {
    const data = code + apiKey;
    return crypto.createHash('md5').update(data).digest('hex').toLowerCase();
  }

  private getAuthHeaders(): Record<string, string> {
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');

    const sign = this.generateSignature(this.clientId, this.apiKey);

    return {
      'Content-Type': 'application/json',
      'code': this.clientId,
      'apiKey': this.apiKey,
      'timestamp': timestamp,
      'sign': sign,
    };
  }

  async createOrder(orderData: JiayouCreateOrderRequest): Promise<JiayouCreateOrderResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/orderNew/createOrder`,
        orderData,
        { 
          headers: this.getAuthHeaders(),
          timeout: 60000 // 60 second timeout
        }
      );

      return response.data;
    } catch (error: any) {
      // NEW: dump Jiayou's real message
      if (error.response?.data) {
        console.error("Jiayou raw error →", error.response.data);
      }
      console.error('Error creating order with Jiayou:', error);
      throw error;
    }
  }

  async printLabel(trackingNumbers: string[]): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/orderNew/printOrder`,
        trackingNumbers,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error printing label with Jiayou:', error);
      throw new Error('Failed to print label with Jiayou');
    }
  }

  async getTracking(trackingNumber: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/orderNew/getOrderTrack`,
        { trackingNo: trackingNumber },
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting tracking from Jiayou:', error);
      throw new Error('Failed to get tracking from Jiayou');
    }
  }

  async getChannelCodes(): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/orderNew/getChannelList`,
        {},
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting channel codes from Jiayou:', error);
      throw new Error('Failed to get channel codes from Jiayou');
    }
  }

  async getChannelInfo(channelCode: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/orderNew/getChannelInfo`,
        { channelCode },
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting channel info from Jiayou:', error);
      throw new Error('Failed to get channel info from Jiayou');
    }
  }

  async checkPostalCodeCoverage(channelCode: string, postCode: string, dimensions: any, weight: number): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/outerApi/costCal`,
        {
          channelCode: [channelCode],
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          weight: weight,
          postCode: postCode,
          iso2: "US",
          fromAddressId: "JFK"
        },
        { headers: { 'apikey': this.apiKey } }
      );

      return response.data;
    } catch (error) {
      console.error('Error checking postal code coverage:', error);
      throw new Error('Failed to check postal code coverage');
    }
  }

  async verifyAddress(postCode: string, countryCode: string, provinceCode: string, city: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/orderNew/verify`,
        {
          postCode: postCode,
          countryCode: countryCode,
          provinceCode: provinceCode,
          city: city
        },
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error verifying address:', error);
      throw new Error('Failed to verify address');
    }
  }
}
