const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size'); // Run 'npm install image-size' if you haven't yet

const galleryDir = path.join(__dirname, '../assets/gallery');
const templateFile = path.join(__dirname, '../dist/gallery-template.html');
const outputFile = path.join(__dirname, '../gallery.html');

const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

console.log('Scanning gallery directory...');

fs.readdir(galleryDir, (err, files) => {
  if (err) {
    console.error(`Error reading directory: ${galleryDir}`);
    process.exit(1);
  }

  const imageFiles = files.filter(file => {
    return supportedExtensions.includes(path.extname(file).toLowerCase());
  });

  if (imageFiles.length === 0) {
    console.warn('No images found in assets/gallery/. Generating an empty grid.');
  }

  let gridHtml = '\n<div class="masonry-grid">\n';
  
  imageFiles.forEach(file => {
    const filePath = path.join(galleryDir, file);
    const name = path.parse(file).name;
    let inlineStyle = '';

    try {
      // Pull exact dimensions for this individual file
      const dimensions = sizeOf(filePath);
      if (dimensions.width && dimensions.height) {
        inlineStyle = ` style="aspect-ratio: ${dimensions.width} / ${dimensions.height};"`;
      }
    } catch (e) {
      console.warn(`Could not read native dimensions for ${file}. Falling back to default container flow.`);
    }

    gridHtml += `  <div class="masonry-item skeleton">\n`;
    gridHtml += `    <img \n`;
    gridHtml += `      src="assets/gallery/${file}" \n`;
    gridHtml += `      alt="${name}" \n`;
    gridHtml += `      loading="lazy"\n`;
    gridHtml += `     ${inlineStyle}\n`; // Dynamically injects precise dimensions per image
    gridHtml += `    />\n`;
    gridHtml += `  </div>\n`;
  });
  gridHtml += '</div>\n';

  fs.readFile(templateFile, 'utf8', (readErr, templateContent) => {
    if (readErr) {
      console.error(`Error reading template file: ${templateFile}`);
      process.exit(1);
    }

    const finalHtml = templateContent.replace('${gallery-content}', gridHtml);

    fs.writeFile(outputFile, finalHtml, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing the final gallery.html file:', writeErr);
      } else {
        console.log(`Success! Unique aspect ratios mapped for ${imageFiles.length} images.`);
      }
    });
  });
});