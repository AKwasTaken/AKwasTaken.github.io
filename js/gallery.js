const fs = require('fs');
const path = require('path');

// Configure your directory paths
const galleryDir = path.join(__dirname, '../assets/gallery');
const outputFile = path.join(__dirname, '../dist/gallery-images.html');

// Supported image extensions
const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

console.log('Scanning gallery directory...');

// Read the files inside assets/gallery
fs.readdir(galleryDir, (err, files) => {
  if (err) {
    console.error(`Error reading directory: ${galleryDir}`);
    console.error('Make sure "assets/gallery" exists and contains your images.');
    process.exit(1);
  }

  // Filter out non-image files (like .DS_Store on macOS or system hidden files)
  const imageFiles = files.filter(file => {
    return supportedExtensions.includes(path.extname(file).toLowerCase());
  });

  if (imageFiles.length === 0) {
    console.warn('No images found in assets/gallery/. Generating an empty file.');
  }

  // Build the dynamic HTML string matching your masonry grid block structure
  let htmlContent = '\n';
  htmlContent += '<div class="masonry-grid">\n';

  imageFiles.forEach(file => {
    htmlContent += `  <div class="masonry-item">\n`;
    htmlContent += `    <img src="assets/gallery/${file}" alt="${path.parse(file).name}" />\n`;
    htmlContent += `  </div>\n`;
  });

  htmlContent += '</div>\n';

  // Write the output file cleanly to disk
  fs.writeFile(outputFile, htmlContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Error writing the gallery-images.html component:', writeErr);
    } else {
      console.log(`Success! ${imageFiles.length} images mapped to ${outputFile}`);
    }
  });
});