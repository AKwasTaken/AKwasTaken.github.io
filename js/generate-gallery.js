const fs = require('fs');
const path = require('path');

const imgFolder = path.join(__dirname, '../assets/project_images');
const outputFile = path.join(__dirname, '../gallery.html');
const validExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.webp'];

try {
  if (!fs.existsSync(imgFolder)) {
    console.error(`❌ Folder missing: ${imgFolder}`);
    process.exit(1);
  }

  const files = fs.readdirSync(imgFolder);
  const imageFiles = files.filter(file => 
    validExtensions.includes(path.extname(file).toLowerCase())
  );

  let row1HTML = '  <div class="masonry-row" id="masonry-row-1">\n';
  let row2HTML = '  <div class="masonry-row" id="masonry-row-2">\n';

  imageFiles.forEach((file, index) => {
    const itemString = `    <div class="masonry-item">
      <img src="assets/project_images/${file}" alt="Project Work" loading="lazy" />
    </div>\n`;

    if (index % 2 === 0) {
      row1HTML += itemString;
    } else {
      row2HTML += itemString;
    }
  });

  // THE FIX: Clean ends, no blank spacer wrappers injected
  row1HTML += '  </div>\n';
  row2HTML += '  </div>\n';

  const totalComponent = `<div class="horizontal-masonry-container" id="scroll-gallery">\n${row1HTML}${row2HTML}</div>`;
  fs.writeFileSync(outputFile, totalComponent, 'utf8');

} catch (err) {
  console.error("Assembly processing error:", err);
}