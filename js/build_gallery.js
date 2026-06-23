const fs = require('fs');
const path = require('path');

// Configure your directory paths
const galleryDir = path.join(__dirname, '../assets/gallery');
const templateFile = path.join(__dirname, '../dist/gallery-template.html');
const outputFile = path.join(__dirname, '../gallery.html'); // Outputting final file directly

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

  // Filter out non-image files
  const imageFiles = files.filter(file => {
    return supportedExtensions.includes(path.extname(file).toLowerCase());
  });

  if (imageFiles.length === 0) {
    console.warn('No images found in assets/gallery/. Generating an empty grid.');
  }

  // Build the dynamic HTML string matching your masonry grid block structure
  let gridHtml = '\n<div class="masonry-grid">\n';
  imageFiles.forEach(file => {
    gridHtml += `  <div class="masonry-item">\n`;
    gridHtml += `    <img src="assets/gallery/${file}" alt="${path.parse(file).name}" />\n`;
    gridHtml += `  </div>\n`;
  });
  gridHtml += '</div>\n';

  // Read the template file
  fs.readFile(templateFile, 'utf8', (readErr, templateContent) => {
    if (readErr) {
      console.error(`Error reading template file: ${templateFile}`);
      process.exit(1);
    }

    // Replace the placeholder with the generated masonry grid HTML
    // Note: Using a standard string replace. 
    const finalHtml = templateContent.replace('${gallery-content}', gridHtml);

    // Write the final complete gallery.html file to disk
    fs.writeFile(outputFile, finalHtml, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing the final gallery.html file:', writeErr);
      } else {
        console.log(`Success! ${imageFiles.length} images embedded into ${outputFile}`);
      }
    });
  });
});