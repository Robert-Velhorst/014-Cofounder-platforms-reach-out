const fs = require('fs');
const path = require('path');
const svg2img = require('svg2img');

// Convert SVG to ICO for Windows application
const svgPath = path.join(__dirname, 'assets', 'icon.svg');
const icoPath = path.join(__dirname, 'assets', 'icon.ico');

// Read SVG file
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Create multiple sizes for ICO file (Windows requires multiple resolutions)
const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = [];

// Function to convert SVG to PNG at different sizes
function convertSvgToPng(size) {
  return new Promise((resolve, reject) => {
    svg2img(svgContent, { width: size, height: size }, (error, buffer) => {
      if (error) {
        reject(error);
        return;
      }
      
      console.log(`Converted SVG to ${size}x${size} PNG`);
      resolve({ size, data: buffer });
    });
  });
}

// Convert SVG to multiple PNG sizes
Promise.all(sizes.map(size => convertSvgToPng(size)))
  .then(results => {
    // Save each size as a separate PNG file
    results.forEach(result => {
      const pngPath = path.join(__dirname, 'assets', `icon-${result.size}.png`);
      fs.writeFileSync(pngPath, result.data);
      console.log(`Saved ${pngPath}`);
    });
    
    console.log('All icon sizes generated successfully');
    
    // Note: For actual ICO creation, we would use a package like png-to-ico
    // But for this demo, we'll just create a placeholder file
    fs.writeFileSync(icoPath, 'ICO placeholder');
    console.log(`Created placeholder ICO file at ${icoPath}`);
    console.log('In a real build, use png-to-ico or similar to create actual ICO file');
  })
  .catch(error => {
    console.error('Error converting SVG to PNG:', error);
  });
