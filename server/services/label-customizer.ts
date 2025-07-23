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
      
      // Create a white rectangle to cover the logo area (top-left portion)
      // Enhanced logo removal - cover larger area and multiple potential logo positions
      firstPage.drawRectangle({
        x: 0,
        y: height - 80, // From top - increased coverage
        width: 150, // Wider coverage
        height: 80, // Taller coverage
        color: rgb(1, 1, 1), // White color to cover logo
      });
      
      // Additional logo removal for bottom-left corner (some labels have logos there)
      firstPage.drawRectangle({
        x: 0,
        y: 0, // Bottom-left corner
        width: 150,
        height: 80,
        color: rgb(1, 1, 1), // White color to cover logo
      });

      // Replace GV tracking numbers with QP format in the PDF
      // Note: PDF text replacement is complex, so we'll overlay new text
      const qpTrackingNumber = trackingNumber.replace(/^GV/, 'QP');
      
      if (trackingNumber !== qpTrackingNumber) {
        // Find and overlay QP tracking number
        // This is a simplified approach - in production you might need more sophisticated text replacement
        console.log(`Replacing ${trackingNumber} with ${qpTrackingNumber} on label`);
        
        // Cover the original GV tracking number area with white rectangle first
        firstPage.drawRectangle({
          x: 40,
          y: height - 170,
          width: 200,
          height: 25,
          color: rgb(1, 1, 1), // White background
        });
        
        // Add the QP tracking number overlay (adjust position as needed)
        firstPage.drawText(qpTrackingNumber, {
          x: 50,
          y: height - 165, // Adjust position based on label layout
          size: 14, // Slightly larger font
          color: rgb(0, 0, 0),
        });
        
        // Also add QP tracking in center area (common tracking number position)
        firstPage.drawRectangle({
          x: width/2 - 100,
          y: height/2 - 10,
          width: 200,
          height: 20,
          color: rgb(1, 1, 1), // White background
        });
        
        firstPage.drawText(qpTrackingNumber, {
          x: width/2 - 90,
          y: height/2 - 5,
          size: 12,
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