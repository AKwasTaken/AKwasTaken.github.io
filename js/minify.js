console.log('Init: minify.js');

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

// Adjusting paths to assume the script is inside the /js folder
const INPUT_FILE = path.join(__dirname, '..', 'css', 'style.css');
const OUTPUT_FILE = path.join(__dirname, '..', 'css', 'style.min.css');

const minifier = new CleanCSS({ level: 2 });

function minifyCSS() {
  try {
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`Error: Source file not found at ${INPUT_FILE}`);
      return;
    }

    const inputCss = fs.readFileSync(INPUT_FILE, 'utf8');
    const output = minifier.minify(inputCss);

    if (output.errors.length > 0) {
      console.error('Minification errors:', output.errors);
      return;
    }

    fs.writeFileSync(OUTPUT_FILE, output.styles, 'utf8');
    console.log(`Compiled: style.min.css\n`);
  } catch (err) {
    console.error('Error during minification:', err);
  }
}

if (process.argv.includes('--watch')) {
  console.log(`Watching for changes in ${INPUT_FILE}...`);
  minifyCSS();
  
  fs.watchFile(INPUT_FILE, { interval: 500 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      minifyCSS();
    }
  });
} else {
  minifyCSS();
}