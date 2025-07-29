/**
 * US Postal Code to Shipping Zone Mapper
 * Maps ZIP codes to shipping zones for accurate rate calculation
 */

interface ZoneMapping {
  [key: string]: number;
}

interface PrefixMapping {
  [key: string]: number;
}

// Sample zone mappings based on common shipping patterns
// Zone 0: Local delivery (same city/metro area)
// Zone 1: Adjacent states (1-2 days)
// Zone 2: Regional (2-3 days)
// Zone 3: Cross-country (3-4 days)
// etc.

const POSTAL_ZONE_MAP: ZoneMapping = {
  // New York Metro (Zone 0-1)
  '10001': 1, '10002': 1, '10003': 1, '10004': 1, '10005': 1,
  '11001': 1, '11002': 1, '11003': 1, '11004': 1, '11005': 1,
  
  // East Coast (Zone 1-2)
  '02101': 2, '02102': 2, '02103': 2, // Boston
  '20001': 2, '20002': 2, '20003': 2, // Washington DC
  '33101': 2, '33102': 2, '33103': 2, // Miami
  
  // Midwest (Zone 3-4)
  '60601': 3, '60602': 3, '60603': 3, // Chicago
  '48201': 3, '48202': 3, '48203': 3, // Detroit
  '55401': 4, '55402': 4, '55403': 4, // Minneapolis
  
  // South (Zone 3-4)
  '30301': 3, '30302': 3, '30303': 3, // Atlanta
  '75201': 4, '75202': 4, '75203': 4, // Dallas
  '77001': 4, '77002': 4, '77003': 4, // Houston
  
  // West Coast (Zone 5-6)
  '90210': 5, '90211': 5, '90212': 5, // Los Angeles
  '94101': 6, '94102': 6, '94103': 6, // San Francisco
  '98101': 6, '98102': 6, '98103': 6, // Seattle
  
  // Mountain/Remote (Zone 7-8)
  '80201': 7, '80202': 7, '80203': 7, // Denver
  '84101': 7, '84102': 7, '84103': 7, // Salt Lake City
  '99501': 8, '99502': 8, '99503': 8, // Alaska
  '96801': 8, '96802': 8, '96803': 8, // Hawaii
};

export class PostalZoneMapper {
  /**
   * Get shipping zone for a given postal code
   * @param postalCode - 5-digit ZIP code
   * @returns Zone number (0-8) or default zone 3 if not found
   */
  getZone(postalCode: string): number {
    // Clean the postal code (remove +4 extension if present)
    const cleanZip = postalCode.replace(/[^0-9]/g, '').substring(0, 5);
    
    // Try exact match first
    if (POSTAL_ZONE_MAP[cleanZip]) {
      return POSTAL_ZONE_MAP[cleanZip];
    }
    
    // Try 3-digit prefix match for broader coverage
    const prefix3 = cleanZip.substring(0, 3);
    const zone3Match = this.getZoneByPrefix(prefix3);
    if (zone3Match !== null) {
      return zone3Match;
    }
    
    // Default to Zone 3 (cross-country) if no match found
    return 3;
  }
  
  /**
   * Get zone by 3-digit ZIP prefix for broader coverage
   * @param prefix - First 3 digits of ZIP code
   * @returns Zone number or null if no match
   */
  private getZoneByPrefix(prefix: string): number | null {
    const prefixZones: PrefixMapping = {
      // Northeast (Zones 1-2)
      '010': 2, '011': 2, '012': 2, '013': 2, '014': 2, // MA
      '015': 2, '016': 2, '017': 2, '018': 2, '019': 2, // MA
      '020': 2, '021': 2, '022': 2, '023': 2, '024': 2, // MA
      '030': 2, '031': 2, '032': 2, '033': 2, '034': 2, // NH
      '035': 2, '036': 2, '037': 2, '038': 2, '039': 2, // NH
      
      // Mid-Atlantic (Zone 2)
      '100': 1, '101': 1, '102': 1, '103': 1, '104': 1, // NY
      '105': 1, '106': 1, '107': 1, '108': 1, '109': 1, // NY
      '110': 1, '111': 1, '112': 1, '113': 1, '114': 1, // NY/NJ
      '115': 1, '116': 1, '117': 1, '118': 1, '119': 1, // NY/NJ
      
      // Southeast (Zone 3)
      '200': 2, '201': 2, '202': 2, '203': 2, '204': 2, // DC/VA
      '205': 2, '206': 2, '207': 2, '208': 2, '209': 2, // MD/VA
      '300': 3, '301': 3, '302': 3, '303': 3, '304': 3, // GA/FL
      '305': 3, '306': 3, '307': 3, '308': 3, '309': 3, // FL
      '310': 3, '311': 3, '312': 3, '313': 3, '314': 3, // FL
      '320': 3, '321': 3, '322': 3, '323': 3, '324': 3, // FL
      '330': 3, '331': 3, '332': 3, '333': 3, '334': 3, // FL/AL
      
      // Midwest (Zone 3-4)
      '600': 3, '601': 3, '602': 3, '603': 3, '604': 3, // IL
      '605': 3, '606': 3, '607': 3, '608': 3, '609': 3, // IL
      '610': 3, '611': 3, '612': 3, '613': 3, '614': 3, // IL/IN
      '460': 3, '461': 3, '462': 3, '463': 3, '464': 3, // IN
      '480': 3, '481': 3, '482': 3, '483': 3, '484': 3, // MI
      '490': 3, '491': 3, '492': 3, '493': 3, '494': 3, // MI
      
      // South Central (Zone 4)
      '700': 4, '701': 4, '702': 4, '703': 4, '704': 4, // TX
      '750': 4, '751': 4, '752': 4, '753': 4, '754': 4, // TX
      '770': 4, '771': 4, '772': 4, '773': 4, '774': 4, // TX
      '775': 4, '776': 4, '777': 4, '778': 4, '779': 4, // TX
      
      // West Coast (Zone 5-6)
      '900': 5, '901': 5, '902': 5, '903': 5, '904': 5, // CA
      '905': 5, '906': 5, '907': 5, '908': 5, '909': 5, // CA
      '910': 5, '911': 5, '912': 5, '913': 5, '914': 5, // CA
      '915': 5, '916': 5, '917': 5, '918': 5, '919': 5, // CA
      '920': 5, '921': 5, '922': 5, '923': 5, '924': 5, // CA
      '930': 5, '931': 5, '932': 5, '933': 5, '934': 5, // CA
      '935': 5, '936': 5, '937': 5, '938': 5, '939': 5, // CA
      '940': 6, '941': 6, '942': 6, '943': 6, '944': 6, // CA/SF
      '945': 6, '946': 6, '947': 6, '948': 6, '949': 6, // CA
      
      // Pacific Northwest (Zone 6)
      '970': 6, '971': 6, '972': 6, '973': 6, '974': 6, // OR
      '975': 6, '976': 6, '977': 6, '978': 6, '979': 6, // OR
      '980': 6, '981': 6, '982': 6, '983': 6, '984': 6, // WA
      '985': 6, '986': 6, '987': 6, '988': 6, '989': 6, // WA
      '990': 6, '991': 6, '992': 6, '993': 6, '994': 6, // WA
      
      // Mountain States (Zone 7)
      '800': 7, '801': 7, '802': 7, '803': 7, '804': 7, // CO
      '805': 7, '806': 7, '807': 7, '808': 7, '809': 7, // CO
      '810': 7, '811': 7, '812': 7, '813': 7, '814': 7, // CO
      '820': 7, '821': 7, '822': 7, '823': 7, '824': 7, // WY
      '830': 7, '831': 7, '832': 7, '833': 7, '834': 7, // NV
      '840': 7, '841': 7, '842': 7, '843': 7, '844': 7, // UT
      '845': 7, '846': 7, '847': 7, '848': 7, '849': 7, // UT
      
      // Remote Areas (Zone 8)
      '995': 8, '996': 8, '997': 8, '998': 8, '999': 8, // AK
      '967': 8, '968': 8, // HI
    };
    
    return prefixZones[prefix] || null;
  }
  
  /**
   * Get delivery time estimate based on zone
   * @param zone - Shipping zone (0-8)
   * @param isExpress - Whether express shipping is selected
   * @returns Delivery time string
   */
  getDeliveryTime(zone: number, isExpress: boolean = false): string {
    const standardDelivery: { [key: number]: string } = {
      0: '1 day',
      1: '1 day',
      2: '1-2 days',
      3: '2 days',
      4: '2-3 days',
      5: '3-4 days',
      6: '4 days',
      7: '4-5 days',
      8: '5-6 days'
    };
    
    if (isExpress) {
      // Express reduces delivery time by 1 day, minimum 1 day
      const expressDelivery: { [key: number]: string } = {
        0: '1 day',
        1: '1 day',
        2: '1 day',
        3: '1 day',
        4: '1-2 days',
        5: '2-3 days',
        6: '3 days',
        7: '3-4 days',
        8: '4-5 days'
      };
      return expressDelivery[zone] || '3-5 days';
    }
    
    return standardDelivery[zone] || '3-5 days';
  }
}

export const postalZoneMapper = new PostalZoneMapper();