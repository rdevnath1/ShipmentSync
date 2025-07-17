import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class LabelProcessor {
  private logoPath: string;
  
  constructor() {
    this.logoPath = path.join(process.cwd(), 'attached_assets', 'logo_1752442395960.png');
  }

  async processLabelWithLogo(labelUrl: string, trackingNumber: string): Promise<Buffer> {
    try {
      console.log(`Processing label ${trackingNumber} with logo overlay`);
      
      // Download the original PDF label from Jiayou
      const response = await axios.get(labelUrl, { responseType: 'arraybuffer' });
      const originalPdfBuffer = Buffer.from(response.data);
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(originalPdfBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Get page dimensions
      const { width, height } = firstPage.getSize();
      
      // Load and process the logo
      const logoBuffer = await this.prepareLogo();
      const logoImage = await pdfDoc.embedPng(logoBuffer);
      
      // Calculate logo position (top-right corner)
      const logoWidth = 60; // Adjust size as needed
      const logoHeight = 60;
      const margin = 10;
      
      const logoX = width - logoWidth - margin;
      const logoY = height - logoHeight - margin;
      
      // Add logo to the label
      firstPage.drawImage(logoImage, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
      });
      
      // Add subtle branding text (optional)
      const font = await pdfDoc.embedFont('Helvetica');
      firstPage.drawText('Powered by Your Company', {
        x: logoX - 20,
        y: logoY - 15,
        size: 8,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      // Save the modified PDF
      const modifiedPdfBuffer = await pdfDoc.save();
      
      console.log(`Label ${trackingNumber} processed successfully with logo`);
      return Buffer.from(modifiedPdfBuffer);
      
    } catch (error) {
      console.error(`Error processing label ${trackingNumber}:`, error);
      // If processing fails, return the original label
      const response = await axios.get(labelUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    }
  }

  private async prepareLogo(): Promise<Buffer> {
    try {
      // Load the original logo
      const logoBuffer = await fs.readFile(this.logoPath);
      
      // Process the logo with sharp:
      // - Resize to appropriate size for label
      // - Convert to PNG format
      // - Add transparency if needed
      const processedLogo = await sharp(logoBuffer)
        .resize(120, 120, { 
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toBuffer();
      
      return processedLogo;
    } catch (error) {
      console.error('Error preparing logo:', error);
      throw error;
    }
  }

  async saveLabelToFile(labelBuffer: Buffer, trackingNumber: string): Promise<string> {
    try {
      // Create labels directory if it doesn't exist
      const labelsDir = path.join(process.cwd(), 'labels');
      await fs.mkdir(labelsDir, { recursive: true });
      
      // Save the processed label
      const fileName = `${trackingNumber}_with_logo.pdf`;
      const filePath = path.join(labelsDir, fileName);
      
      await fs.writeFile(filePath, labelBuffer);
      
      console.log(`Label saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error saving label:', error);
      throw error;
    }
  }

  async processAndSaveLabel(labelUrl: string, trackingNumber: string): Promise<string> {
    try {
      // Process the label with logo
      const processedBuffer = await this.processLabelWithLogo(labelUrl, trackingNumber);
      
      // Save to file
      const filePath = await this.saveLabelToFile(processedBuffer, trackingNumber);
      
      return filePath;
    } catch (error) {
      console.error(`Error in processAndSaveLabel for ${trackingNumber}:`, error);
      throw error;
    }
  }

  // Method to serve the processed label as a URL
  generateLabelUrl(trackingNumber: string): string {
    return `/api/labels/${trackingNumber}_with_logo.pdf`;
  }
}