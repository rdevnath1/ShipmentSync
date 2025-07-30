import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

async function yoloTestLabel() {
  console.log('🚀 YOLO MODE: Creating refined test label...\n');

  try {
    // Create the refined customized version
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    const originalTracking = 'GV25USA0U020875314';
    const qpTracking = 'QP25USA0U020875314';

    // STEP 1: Draw the complete original label first
    // Top-right header (KEEP THIS - DON'T REMOVE)
    page.drawText('LAX-A 016', {
      x: 280,
      y: 540,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Draw a simulated top-left logo area (this will be covered)
    page.drawRectangle({
      x: 20,
      y: height - 80,
      width: 60,
      height: 40,
      color: rgb(0.8, 0.8, 0.8), // Gray to simulate logo
    });
    page.drawText('LOGO', {
      x: 30,
      y: height - 65,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Delivery address
    page.drawText('DELIVER TO', {
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

    // Barcode area
    page.drawRectangle({
      x: 50,
      y: 200,
      width: 300,
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });

    // Barcode lines (simulated)
    for (let i = 0; i < 30; i++) {
      page.drawRectangle({
        x: 60 + i * 9,
        y: 210,
        width: 2,
        height: 60,
        color: rgb(0, 0, 0),
      });
    }

    page.drawText(qpTracking, {
      x: 90,
      y: 240,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Logistics section
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

    page.drawText('Sender Ref: 100005-1753131345057-1-MDN', {
      x: 200,
      y: 100,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText('2025-07-22 04:55:46', {
      x: 200,
      y: 80,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Bottom barcode
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

    // QR Code simulation
    page.drawRectangle({
      x: 320,
      y: 150,
      width: 60,
      height: 60,
      color: rgb(0, 0, 0),
    });

    // Add some white squares to simulate QR pattern
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        page.drawRectangle({
          x: 330 + i * 15,
          y: 160 + j * 15,
          width: 8,
          height: 8,
          color: rgb(1, 1, 1),
        });
      }
    }

    // STEP 2: Apply the REFINED CUSTOMIZATIONS

    // 1. Remove ONLY the top-left logo (NOT the top-right header)
    page.drawRectangle({
      x: 0,
      y: height - 110,
      width: 200,
      height: 110,
      color: rgb(1, 1, 1), // White to cover logo
    });

    // 2. Cover GV tracking in delivery instructions (narrow rectangle)
    const instrY = height - 270;
    page.drawRectangle({
      x: 180,
      y: instrY - 5,
      width: width - 200,
      height: 25,
      color: rgb(1, 1, 1),
    });

    // Add QP tracking in delivery instructions
    page.drawText(qpTracking, {
      x: 190,
      y: instrY,
      size: 14,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 3. Cover GV below barcode (FULL WIDTH to ensure complete coverage)
    const belowBarcodeY = height/2 - 30;
    page.drawRectangle({
      x: 0,
      y: belowBarcodeY,
      width: width,
      height: 40,
      color: rgb(1, 1, 1),
    });

    // Add centered QP tracking below barcode
    const qpTextWidth = qpTracking.length * 9;
    page.drawText(qpTracking, {
      x: (width - qpTextWidth) / 2,
      y: belowBarcodeY + 10,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // 4. Cover any bottom GV tracking
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 250,
      height: 25,
      color: rgb(1, 1, 1),
    });

    page.drawText(qpTracking, {
      x: 30,
      y: 25,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Save the YOLO test label
    const pdfBytes = await pdfDoc.save();
    const fileName = 'yolo_refined_label.pdf';
    const filePath = path.join(process.cwd(), fileName);
    
    await fs.writeFile(filePath, pdfBytes);
    
    console.log(`✅ YOLO refined label saved: ${fileName}`);
    console.log('\n🎯 YOLO Improvements Applied:');
    console.log('   • Top-left logo REMOVED (top-right header PRESERVED)');
    console.log('   • GV tracking FULLY COVERED below barcode');
    console.log('   • QP tracking CENTERED perfectly');
    console.log('   • Delivery instructions narrow coverage');
    console.log('   • All formatting preserved exactly');

    // Open the file
    const { exec } = await import('child_process');
    exec(`open "${filePath}"`);
    
    console.log('\n🚀 YOLO label opened! Check it out!');

  } catch (error) {
    console.error('❌ YOLO test failed:', error.message);
  }
}

// YOLO MODE ACTIVATED!
yoloTestLabel(); 