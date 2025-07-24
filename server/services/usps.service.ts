import axios from 'axios';

export interface USPSRateRequest {
  fromZip: string;
  toZip: string;
  pounds: number;
  ounces: number;
  container?: string;
  size?: string;
  width?: number;
  length?: number;
  height?: number;
  girth?: number;
}

export interface USPSRate {
  service: string;
  rate: number;
  deliveryDays?: string;
}

class USPSService {
  private baseUrl = 'https://secure.shippingapis.com/ShippingAPI.dll';
  private userId: string;

  constructor() {
    this.userId = process.env.USPS_USER_ID || '';
  }

  async getRates(request: USPSRateRequest): Promise<USPSRate[]> {
    if (!this.userId) {
      throw new Error('USPS_USER_ID not configured');
    }

    // Build USPS Rate API XML request
    const xml = `
      <RateV4Request USERID="${this.userId}">
        <Revision>2</Revision>
        <Package ID="1ST">
          <Service>ALL</Service>
          <ZipOrigination>${request.fromZip}</ZipOrigination>
          <ZipDestination>${request.toZip}</ZipDestination>
          <Pounds>${request.pounds}</Pounds>
          <Ounces>${request.ounces}</Ounces>
          <Container>${request.container || 'VARIABLE'}</Container>
          <Size>${request.size || 'REGULAR'}</Size>
          ${request.width ? `<Width>${request.width}</Width>` : ''}
          ${request.length ? `<Length>${request.length}</Length>` : ''}
          ${request.height ? `<Height>${request.height}</Height>` : ''}
          ${request.girth ? `<Girth>${request.girth}</Girth>` : ''}
          <Machinable>TRUE</Machinable>
        </Package>
      </RateV4Request>
    `.trim();

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          API: 'RateV4',
          XML: xml
        }
      });

      // Parse XML response
      const rates = this.parseRateResponse(response.data);
      return rates;
    } catch (error: any) {
      console.error('USPS API error:', error.response?.data || error.message);
      throw new Error('Failed to get USPS rates');
    }
  }

  private parseRateResponse(xmlData: string): USPSRate[] {
    const rates: USPSRate[] = [];
    
    // Simple XML parsing for USPS response
    // Extract Priority Mail rates
    const priorityMatch = xmlData.match(/<Postage[^>]*>[\s\S]*?<MailService>Priority Mail[^<]*<\/MailService>[\s\S]*?<Rate>([0-9.]+)<\/Rate>[\s\S]*?<\/Postage>/);
    if (priorityMatch) {
      rates.push({
        service: 'Priority Mail',
        rate: parseFloat(priorityMatch[1]),
        deliveryDays: '1-3'
      });
    }

    // Extract Priority Mail Express rates
    const expressMatch = xmlData.match(/<Postage[^>]*>[\s\S]*?<MailService>Priority Mail Express[^<]*<\/MailService>[\s\S]*?<Rate>([0-9.]+)<\/Rate>[\s\S]*?<\/Postage>/);
    if (expressMatch) {
      rates.push({
        service: 'Priority Mail Express',
        rate: parseFloat(expressMatch[1]),
        deliveryDays: '1-2'
      });
    }

    // Extract Ground Advantage rates
    const groundMatch = xmlData.match(/<Postage[^>]*>[\s\S]*?<MailService>USPS Ground Advantage[^<]*<\/MailService>[\s\S]*?<Rate>([0-9.]+)<\/Rate>[\s\S]*?<\/Postage>/);
    if (groundMatch) {
      rates.push({
        service: 'Ground Advantage',
        rate: parseFloat(groundMatch[1]),
        deliveryDays: '2-5'
      });
    }

    return rates;
  }
}

export const uspsService = new USPSService();