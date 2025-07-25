import axios from 'axios';
import { PDFDocument, rgb } from 'pdf-lib';
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
   * Customize a shipping label by replacing GV with QP and removing logos
   */
  async customizeLabel(originalLabelUrl: string, trackingNumber: string): Promise<string> {
    try {
      console.log(`Customizing label for tracking ${trackingNumber}...`);
      
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
      
      // Precise logo removal for top-right corner (where uniunt logo appears)
      // Based on the screenshot, logo is approximately 140x50 pixels in top-right
      firstPage.drawRectangle({
        x: width - 150, // Top-right corner - just logo area
        y: height - 70, // From top - just logo height
        width: 150, // Logo width
        height: 70, // Logo height
        color: rgb(1, 1, 1), // White color to cover logo
      });

      // Replace GV tracking numbers with QP format in the PDF
      // Note: PDF text replacement is complex, so we'll overlay new text
      const qpTrackingNumber = trackingNumber.replace(/^GV/, 'QP');
      
      if (trackingNumber !== qpTrackingNumber) {
        console.log(`Replacing ${trackingNumber} with ${qpTrackingNumber} on label`);
        
        // First occurrence: Under the barcode (center of label)
        // GV tracking appears centered below the main barcode
        firstPage.drawRectangle({
          x: 192, // Center position for GV tracking
          y: height - 460, // Position below barcode (from top)
          width: 250, // Width to cover "GV25USA0U020875314"
          height: 20, // Height of text line
          color: rgb(1, 1, 1), // White background to cover GV
        });
        
        // Add QP tracking number directly on top - centered
        firstPage.drawText(qpTrackingNumber, {
          x: 195, // Centered alignment
          y: height - 455, // Text baseline position
          size: 14, // Match original font size
          color: rgb(0, 0, 0),
        });
        
        // Second occurrence: Bottom of label
        // GV tracking at the very bottom center-right
        firstPage.drawRectangle({
          x: 380, // Bottom right position
          y: height - 770, // Near bottom (from top)
          width: 250, // Width to cover tracking number
          height: 20, // Height of text line
          color: rgb(1, 1, 1), // White background
        });
        
        firstPage.drawText(qpTrackingNumber, {
          x: 383, // Aligned with rectangle
          y: height - 765, // Text baseline
          size: 14, // Match original font size
          color: rgb(0, 0, 0),
        });
      }

      // Save the customized PDF
      const customizedPdfBytes = await pdfDoc.save();
      const customizedFileName = `customized_${trackingNumber}_${Date.now()}.pdf`;
      const customizedFilePath = path.join(this.tempDir, customizedFileName);
      
      await fs.writeFile(customizedFilePath, customizedPdfBytes);
      
      console.log(`Customized label saved to: ${customizedFilePath}`);
      
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