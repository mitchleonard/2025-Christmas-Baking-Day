# Generating the OG Preview Image

The Open Graph preview image is used when sharing the link on social media, messaging apps, and other platforms.

## Option 1: Manual Screenshot (Easiest)

1. Open `og-image.html` in your browser
2. Open browser DevTools (F12 or Cmd+Option+I)
3. Set the viewport to exactly **1200x630 pixels**
4. Take a screenshot (or use browser's screenshot tool)
5. Save it as `images/og-image.png`

## Option 2: Using Puppeteer Script

1. Install Node.js dependencies:
   ```bash
   npm install puppeteer
   ```

2. Run the script:
   ```bash
   node generate-og-image.js
   ```

This will automatically generate `images/og-image.png` at the correct size.

## Option 3: Online Services

You can use online HTML-to-image services:
- https://htmlcsstoimage.com/
- https://www.bannerbear.com/
- https://screenshotapi.net/

Upload or paste the HTML from `og-image.html` and set dimensions to 1200x630px.

## Current Setup

The meta tags in `index.html` are already configured to use:
- Image: `https://bakingday.mitchleonard.com/images/og-image.png`
- Title: "Annual Christmas Baking Day"
- Description: "Join us for a day of flour, frosting, and festive chaos!"

Once you generate and upload the `og-image.png` file, the preview cards will work automatically!

