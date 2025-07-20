import { z } from "zod";

// Country-specific address validation schemas
const usAddressSchema = z.object({
  name: z.string().min(1, "Recipient name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters (e.g., CA, NY)").or(
    z.string().min(2, "State/Province is required")
  ),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid US ZIP code format"),
  country: z.literal("US"),
  phone: z.string().regex(/^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/, "Invalid US phone number").optional(),
  residential: z.boolean().optional(),
});

const caAddressSchema = z.object({
  name: z.string().min(1, "Recipient name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "Province is required"),
  postalCode: z.string().regex(/^[A-Z]\d[A-Z] ?\d[A-Z]\d$/, "Invalid Canadian postal code format"),
  country: z.literal("CA"),
  phone: z.string().optional(),
  residential: z.boolean().optional(),
});

const internationalAddressSchema = z.object({
  name: z.string().min(1, "Recipient name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().length(2, "Country code must be 2 characters"),
  phone: z.string().optional(),
  residential: z.boolean().optional(),
});

// Enhanced order validation schema
export const enhancedOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email address is required").optional(),
  customerPhone: z.string().optional(),
  shippingAddress: z.union([usAddressSchema, caAddressSchema, internationalAddressSchema]),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    value: z.number().min(0, "Item value must be positive"),
    weight: z.number().min(0.01, "Item weight must be at least 0.01 kg"),
    sku: z.string().optional(),
    hsCode: z.string().optional(),
    countryOfOrigin: z.string().length(2).optional(),
  })).min(1, "At least one item is required"),
  totalAmount: z.string().or(z.number()),
  weight: z.number().min(0.05, "Total weight must be at least 50g (Jiayou minimum)"),
  dimensions: z.object({
    length: z.number().min(1, "Length must be at least 1cm"),
    width: z.number().min(1, "Width must be at least 1cm"),
    height: z.number().min(1, "Height must be at least 1cm"),
  }),
});

export class AddressValidator {
  static validateAddress(address: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Determine validation schema based on country
      let schema = internationalAddressSchema;
      if (address.country === 'US') {
        schema = usAddressSchema;
      } else if (address.country === 'CA') {
        schema = caAddressSchema;
      }

      schema.parse(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => e.message));
      }
    }

    // Additional business logic validations
    this.checkPoBoxRestrictions(address, warnings, errors);
    this.checkHighRiskAddresses(address, warnings);
    this.checkAddressCompleteness(address, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static checkPoBoxRestrictions(address: any, warnings: string[], errors: string[]) {
    const poBoxPatterns = [
      /p\.?o\.?\s*box/i,
      /post\s*office\s*box/i,
      /postal\s*box/i,
      /pmb/i, // Private mailbox
      /\bpo\b/i,
    ];

    const addressLines = [address.street1, address.street2].filter(Boolean).join(' ');
    if (poBoxPatterns.some(pattern => pattern.test(addressLines))) {
      errors.push("PO Box addresses are not supported for international shipping");
    }

    // Check PO Box ZIP codes for US
    const poBoxZips = ['10001', '10008', '10009', '10010', '10011', '10012', '10013', '10014'];
    if (address.country === 'US' && poBoxZips.includes(address.postalCode)) {
      errors.push("This ZIP code is designated for PO Boxes only and cannot be shipped to");
    }
  }

  private static checkHighRiskAddresses(address: any, warnings: string[]) {
    // Check for military/diplomatic addresses
    const militaryPatterns = [
      /apo/i, /fpo/i, /dpo/i, // Military addresses
      /embassy/i, /consulate/i, // Diplomatic addresses
    ];

    const addressLines = [address.street1, address.street2, address.city].filter(Boolean).join(' ');
    if (militaryPatterns.some(pattern => pattern.test(addressLines))) {
      warnings.push("Military or diplomatic addresses may have special shipping requirements");
    }
  }

  private static checkAddressCompleteness(address: any, warnings: string[]) {
    if (!address.phone) {
      warnings.push("Phone number recommended for delivery notifications");
    }

    if (address.residential === undefined) {
      warnings.push("Residential/commercial designation not specified");
    }

    if (!address.company && !address.residential) {
      warnings.push("Consider marking as residential if no company name provided");
    }
  }

  static validateOrder(orderData: any) {
    try {
      return {
        valid: true,
        data: enhancedOrderSchema.parse(orderData),
        errors: [],
        warnings: [],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          data: null,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      throw error;
    }
  }
}