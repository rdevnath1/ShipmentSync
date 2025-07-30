import axios from 'axios';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export class LabelCustomizerService {
  private tempDir = path.join(process.cwd(), 'temp-labels');

  constructor() {
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  /**
   * Customize a shipping label to match the exact template format
   * Template: Clean "LAX-A 016" header, no logo, QP tracking below barcode and at bottom
   * Based on: dump/123.pdf 3.93x5.90in.pdf
   */
  async customizeLabel(originalLabelUrl: string, trackingNumber: string): Promise<string> {
    try {
      console.log(`🔧 CUSTOMIZING LABEL: ${trackingNumber}`);
      
      // Download the original label PDF
      const response = await axios.get(originalLabelUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      if (!response.data) {
        throw new Error('Failed to download label data');
      }

      // Load the PDF
      const pdfDoc = await PDFDocument.load(response.data);
      const pages = pdfDoc.getPages();
      
      if (pages.length === 0) {
        throw new Error('No pages found in PDF');
      }

      const firstPage = pages[0];
      
      // Get page dimensions
      const { width, height } = firstPage.getSize();
      console.log(`📐 ACTUAL Page dimensions: width=${width}, height=${height}`);
      
      // Embed fonts for professional text rendering
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Replace GV tracking numbers with QP format
      const qpTrackingNumber = trackingNumber.replace(/^GV/, 'QP');
      
      if (trackingNumber !== qpTrackingNumber) {
        console.log(`🔄 REPLACING: ${trackingNumber} -> ${qpTrackingNumber}`);
        
        // SIMPLE: Just remove logo and replace GV with QP
        
        // 1) Remove uniuni logo on top left
        console.log(`🎯 Removing logo at: x=30, y=${height - 100}`);
        firstPage.drawRectangle({
          x: 30,
          y: height - 100,
          width: 350,
          height: 50,
          color: rgb(1, 1, 1),
        });
        
        // 2) Find and replace GV tracking with QP
        
        // Cover GV tracking below main barcode
        console.log(`🎯 Covering main GV at: y=${height/2 - 50}`);
        firstPage.drawRectangle({
          x: 0,
          y: height/2 - 50,
          width: width,
          height: 30,
          color: rgb(1, 1, 1),
        });
        
        // Cover GV tracking at bottom
        console.log(`🎯 Covering bottom GV at: y=20`);
        firstPage.drawRectangle({
          x: 0,
          y: 20,
          width: width,
          height: 40,
          color: rgb(1, 1, 1),
        });
        
        // Add QP tracking below main barcode
        const mainTrackingWidth = helveticaBoldFont.widthOfTextAtSize(qpTrackingNumber, 16);
        console.log(`✍️ Adding main QP at: x=${(width - mainTrackingWidth) / 2}, y=${height/2 - 35}`);
        firstPage.drawText(qpTrackingNumber, {
          x: (width - mainTrackingWidth) / 2,
          y: height/2 - 35,
          size: 16,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        
        // Add QP tracking at bottom
        const bottomTrackingWidth = helveticaFont.widthOfTextAtSize(qpTrackingNumber, 12);
        console.log(`✍️ Adding bottom QP at: x=${(width - bottomTrackingWidth) / 2}, y=35`);
        firstPage.drawText(qpTrackingNumber, {
          x: (width - bottomTrackingWidth) / 2,
          y: 35,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      // Save the customized PDF
      const customizedPdfBytes = await pdfDoc.save();
      const customizedFileName = `fresh_customized_${trackingNumber}_${Date.now()}.pdf`;
      const customizedFilePath = path.join(this.tempDir, customizedFileName);
      
      await fs.writeFile(customizedFilePath, customizedPdfBytes);
      
      console.log(`Fresh start customized label saved to: ${customizedFilePath}`);
      
      // Return the file path (in production, you might upload to cloud storage and return URL)
      return customizedFilePath;
      
    } catch (error) {
      console.error('Error customizing label:', error);
      throw new Error('Failed to customize shipping label');
    }
  }

  /**
   * Serve a customized label file
   */
  async getLabelBuffer(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error reading label file:', error);
      throw new Error('Label file not found');
    }
  }

  /**
   * Clean up old temporary files
   */
  async cleanupOldFiles(maxAgeMinutes: number = 60) {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        const ageMinutes = (now - stats.mtime.getTime()) / (1000 * 60);
        
        if (ageMinutes > maxAgeMinutes) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old label file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export default LabelCustomizerService;