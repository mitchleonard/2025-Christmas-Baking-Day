/**
 * Script to generate OG image from og-image.html
 * 
 * This script uses Puppeteer to take a screenshot of og-image.html
 * 
 * To use:
 * 1. Install Puppeteer: npm install puppeteer
 * 2. Run: node generate-og-image.js
 * 
 * Or use an online service like:
 * - https://htmlcsstoimage.com/
 * - https://www.bannerbear.com/
 * - Or manually screenshot og-image.html at 1200x630px
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to OG image size
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2 // For retina quality
  });
  
  // Load the HTML file
  const htmlPath = path.join(__dirname, 'og-image.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  // Wait for fonts to load
  await page.evaluateHandle(() => document.fonts.ready);
  
  // Take screenshot
  const outputPath = path.join(__dirname, 'images', 'og-image.png');
  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: false
  });
  
  console.log(`✅ OG image generated at: ${outputPath}`);
  
  await browser.close();
})();

