import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTestLabel() {
  try {
    console.log('🖨️ Creating a test label to demonstrate improvements...\n');

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Sample tracking number (GV format that will be customized to QP)
    const originalTracking = 'GV25USA0U020875314';
    const customizedTracking = 'QP25USA0U020875314';

    // Draw shipping label content similar to the real label
    page.drawText('SHIPPING LABEL', {
      x: 50,
      y: 550,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Top-right area where "AX-A 016" would be (this will be covered in real customization)
    page.drawText('AX-A 016', {
      x: 280,
      y: 540,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Recipient information
    page.drawText('DELIVER TO:', {
      x: 50,
      y: 500,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('HELLO', {
      x: 50,
      y: 480,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('1578 SUNSET CREST AVENUE', {
      x: 50,
      y: 460,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('LOS ANGELES LA 90046', {
      x: 50,
      y: 440,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('UNITED STATES', {
      x: 50,
      y: 420,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('PHONE: +1-555-000-0000', {
      x: 50,
      y: 400,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Large zip code
    page.drawText('90046', {
      x: 280,
      y: 450,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Delivery instructions section
    page.drawText('DELIVERY INSTRUCTIONS', {
      x: 50,
      y: 350,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('SKU : DEFAULT-001*1', {
      x: 50,
      y: 330,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Original GV tracking number (this will be covered and replaced)
    page.drawText(originalTracking, {
      x: 200,
      y: 330,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('1 Pc', {
      x: 320,
      y: 330,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('0.227 KG', {
      x: 320,
      y: 310,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Barcode area (simulated)
    page.drawRectangle({
      x: 50,
      y: 200,
      width: 300,
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });

    page.drawText('BARCODE AREA', {
      x: 150,
      y: 240,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // GV tracking number below barcode (this will be covered and replaced)
    page.drawText(originalTracking, {
      x: 120,
      y: 180,
      size: 14,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Logistic information
    page.drawText('LOGISTIC', {
      x: 50,
      y: 120,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('Radius', {
      x: 50,
      y: 100,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('175-14 147th Ave Queens NY', {
      x: 50,
      y: 80,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('11434', {
      x: 50,
      y: 60,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Sender reference
    page.drawText('Sender Ref: 100005-1753131345057-1-MDN', {
      x: 200,
      y: 100,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Date
    page.drawText('2025-07-22 04:55:46', {
      x: 200,
      y: 80,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Bottom barcode area
    page.drawRectangle({
      x: 50,
      y: 20,
      width: 300,
      height: 30,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    page.drawText('S_JFK-US', {
      x: 50,
      y: 35,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Save the original test label
    const originalPdfBytes = await pdfDoc.save();
    const originalFileName = 'test_original_label.pdf';
    const originalFilePath = path.join(process.cwd(), originalFileName);
    
    await fs.writeFile(originalFilePath, originalPdfBytes);
    console.log(`✅ Original test label saved: ${originalFileName}`);

    // Now create the "customized" version to show what it would look like
    const customizedPdfDoc = await PDFDocument.create();
    const customizedPage = customizedPdfDoc.addPage([400, 600]);
    const customizedFont = await customizedPdfDoc.embedFont(StandardFonts.Helvetica);
    const customizedBoldFont = await customizedPdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw the same content but with improvements
    customizedPage.drawText('SHIPPING LABEL', {
      x: 50,
      y: 550,
      size: 16,
      font: customizedBoldFont,
      color: rgb(0, 0, 0),
    });

    // Cover the "AX-A 016" area with white rectangle (logo removal)
    customizedPage.drawRectangle({
      x: 280,
      y: 540,
      width: 120,
      height: 20,
      color: rgb(1, 1, 1), // White to cover logo
    });

    // Recipient information (same as original)
    customizedPage.drawText('DELIVER TO:', {
      x: 50,
      y: 500,
      size: 12,
      font: customizedBoldFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('HELLO', {
      x: 50,
      y: 480,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('1578 SUNSET CREST AVENUE', {
      x: 50,
      y: 460,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('LOS ANGELES LA 90046', {
      x: 50,
      y: 440,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('UNITED STATES', {
      x: 50,
      y: 420,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('PHONE: +1-555-000-0000', {
      x: 50,
      y: 400,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    // Large zip code
    customizedPage.drawText('90046', {
      x: 280,
      y: 450,
      size: 24,
      font: customizedBoldFont,
      color: rgb(0, 0, 0),
    });

    // Delivery instructions section
    customizedPage.drawText('DELIVERY INSTRUCTIONS', {
      x: 50,
      y: 350,
      size: 12,
      font: customizedBoldFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('SKU : DEFAULT-001*1', {
      x: 50,
      y: 330,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    // Cover original GV tracking and add QP tracking
    customizedPage.drawRectangle({
      x: 200,
      y: 320,
      width: 150,
      height: 20,
      color: rgb(1, 1, 1), // White to cover GV
    });

    customizedPage.drawText(customizedTracking, {
      x: 210,
      y: 330,
      size: 12,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('1 Pc', {
      x: 320,
      y: 330,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('0.227 KG', {
      x: 320,
      y: 310,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    // Barcode area (simulated)
    customizedPage.drawRectangle({
      x: 50,
      y: 200,
      width: 300,
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });

    customizedPage.drawText('BARCODE AREA', {
      x: 150,
      y: 240,
      size: 12,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    // Cover GV tracking below barcode and add QP tracking
    customizedPage.drawRectangle({
      x: 120,
      y: 170,
      width: 200,
      height: 25,
      color: rgb(1, 1, 1), // White to cover GV
    });

    customizedPage.drawText(customizedTracking, {
      x: 130,
      y: 180,
      size: 14,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    // Logistic information
    customizedPage.drawText('LOGISTIC', {
      x: 50,
      y: 120,
      size: 12,
      font: customizedBoldFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('Radius', {
      x: 50,
      y: 100,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('175-14 147th Ave Queens NY', {
      x: 50,
      y: 80,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    customizedPage.drawText('11434', {
      x: 50,
      y: 60,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    // Sender reference
    customizedPage.drawText('Sender Ref: 100005-1753131345057-1-MDN', {
      x: 200,
      y: 100,
      size: 8,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    // Date
    customizedPage.drawText('2025-07-22 04:55:46', {
      x: 200,
      y: 80,
      size: 8,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    // Bottom barcode area
    customizedPage.drawRectangle({
      x: 50,
      y: 20,
      width: 300,
      height: 30,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    customizedPage.drawText('S_JFK-US', {
      x: 50,
      y: 35,
      size: 10,
      font: customizedFont,
      color: rgb(0, 0, 0),
    });

    // Save the customized test label
    const customizedPdfBytes = await customizedPdfDoc.save();
    const customizedFileName = 'test_customized_label.pdf';
    const customizedFilePath = path.join(process.cwd(), customizedFileName);
    
    await fs.writeFile(customizedFilePath, customizedPdfBytes);
    console.log(`✅ Customized test label saved: ${customizedFileName}`);

    console.log('\n🎯 Test Labels Created:');
    console.log('   1. test_original_label.pdf - Shows original format');
    console.log('   2. test_customized_label.pdf - Shows improved customization');
    console.log('\n📋 Key Improvements Demonstrated:');
    console.log('   • "AX-A 016" logo removed from top-right');
    console.log('   • GV tracking numbers covered with white rectangles');
    console.log('   • QP tracking numbers positioned on top');
    console.log('   • Clean, professional appearance');

    // Open both files for comparison
    console.log('\n🔍 Opening test labels for comparison...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Open the customized label first
    const { exec } = await import('child_process');
    exec(`open "${customizedFilePath}"`);
    
    console.log('✅ Test labels created and opened!');
    console.log('   Compare the two PDFs to see the improvements.');

  } catch (error) {
    console.error('❌ Error creating test labels:', error.message);
  }
}

// Run the test
createTestLabel(); 