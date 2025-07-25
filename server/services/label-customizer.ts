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
      
      // Enhanced logo removal for top-right corner (where uniunt logo appears)
      firstPage.drawRectangle({
        x: width - 200, // Top-right corner - much wider coverage
        y: height - 120, // From top - increased coverage
        width: 200, // Cover full right side
        height: 120, // Taller coverage for logo area
        color: rgb(1, 1, 1), // White color to cover logo
      });
      
      // Additional logo removal for top-left corner (backup logo position)
      firstPage.drawRectangle({
        x: 0,
        y: height - 120, // From top - increased coverage
        width: 200, // Wider coverage
        height: 120, // Taller coverage
        color: rgb(1, 1, 1), // White color to cover logo
      });
      
      // Additional logo removal for bottom-left corner (some labels have logos there)
      firstPage.drawRectangle({
        x: 0,
        y: 0, // Bottom-left corner
        width: 200,
        height: 100,
        color: rgb(1, 1, 1), // White color to cover logo
      });

      // Replace GV tracking numbers with QP format in the PDF
      // Note: PDF text replacement is complex, so we'll overlay new text
      const qpTrackingNumber = trackingNumber.replace(/^GV/, 'QP');
      
      if (trackingNumber !== qpTrackingNumber) {
        // Find and overlay QP tracking number
        console.log(`Replacing ${trackingNumber} with ${qpTrackingNumber} on label`);
        
        // Replace GV tracking number under barcode (center area)
        // This is the main tracking number position
        firstPage.drawRectangle({
          x: 60, // Center-left position
          y: height - 630, // Under barcode area based on screenshot
          width: 300, // Wide enough to cover full tracking number
          height: 30, // Tall enough for text
          color: rgb(1, 1, 1), // White background
        });
        
        // Add the QP tracking number overlay in center position
        firstPage.drawText(qpTrackingNumber, {
          x: 65,
          y: height - 620, // Position text in center of white rectangle
          size: 16, // Larger font to match original
          color: rgb(0, 0, 0),
        });
        
        // Replace GV tracking number at bottom of label
        // This is typically the second occurrence
        firstPage.drawRectangle({
          x: 60, // Bottom area position
          y: 30, // Near bottom of label
          width: 300, // Wide coverage
          height: 30, // Text height
          color: rgb(1, 1, 1), // White background
        });
        
        firstPage.drawText(qpTrackingNumber, {
          x: 65,
          y: 40, // Position text in center of white rectangle
          size: 16, // Match font size
          color: rgb(0, 0, 0),
        });
        
        // Also cover any tracking numbers in potential header areas
        firstPage.drawRectangle({
          x: 300, // Right side header area
          y: height - 150,
          width: 250,
          height: 30,
          color: rgb(1, 1, 1), // White background
        });
        
        firstPage.drawText(qpTrackingNumber, {
          x: 305,
          y: height - 135,
          size: 14,
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