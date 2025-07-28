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
      
      // Download the original label PDF with increased timeout
      const response = await axios.get(originalLabelUrl, {
        responseType: 'arraybuffer',
        timeout: 60000, // Increased to 60 seconds
        maxContentLength: Infinity,
        maxBodyLength: Infinity
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
      console.log(`Label dimensions: ${width}x${height}`);
      
      // Remove uniunt logo from top area (logo with company name)
      // Based on template, need to remove entire logo area
      firstPage.drawRectangle({
        x: 15, // Left side where logo starts
        y: height - 85, // From top - covers full logo height
        width: 310, // Wide enough to cover "uniunt" text and logo
        height: 85, // Full height of logo area
        color: rgb(1, 1, 1), // White color to cover logo
      });

      // Replace GV tracking numbers with QP format in the PDF
      // Note: PDF text replacement is complex, so we'll overlay new text
      const qpTrackingNumber = trackingNumber.replace(/^GV/, 'QP');
      
      if (trackingNumber !== qpTrackingNumber) {
        console.log(`Replacing ${trackingNumber} with ${qpTrackingNumber} on label`);
        
        // First occurrence: Under the barcode (centered)
        // Make a larger rectangle to ensure we cover the GV text
        firstPage.drawRectangle({
          x: 20, // Start from left
          y: 170, // Position under barcode
          width: 240, // Almost full width
          height: 30, // Taller to ensure coverage
          color: rgb(1, 1, 1), // White background to cover GV
        });
        
        // Add QP tracking number - centered
        const centerX = width / 2;
        const fontSize = 18;
        const textWidth = qpTrackingNumber.length * (fontSize * 0.5); // Better approximation
        const textStartX = centerX - (textWidth / 2);
        
        firstPage.drawText(qpTrackingNumber, {
          x: textStartX, // Center the text
          y: 178, // Text baseline (middle of rectangle)
          size: fontSize, // Larger for visibility
          color: rgb(0, 0, 0),
        });
        
        // Second occurrence: Bottom of label - make it wider
        firstPage.drawRectangle({
          x: 80, // Start earlier
          y: 25, // Near bottom of page
          width: 200, // Wider coverage
          height: 25, // Taller rectangle
          color: rgb(1, 1, 1), // White background
        });
        
        // Center the bottom text better
        const bottomTextStartX = 120;
        
        firstPage.drawText(qpTrackingNumber, {
          x: bottomTextStartX, // Better positioned
          y: 33, // Text baseline
          size: 16, // Larger for visibility
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
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Label download timed out - please try again');
        }
        if (error.response?.status === 404) {
          throw new Error('Label not found - it may have expired or been deleted');
        }
        throw new Error(`Failed to download label: ${error.message}`);
      }
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