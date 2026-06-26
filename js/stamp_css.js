console.log('Init: stamp_css.js');


const fs = require('fs');
const path = require('path');

const BUILD_STAMP = Date.now(); 
const ROOT_DIR = path.join(__dirname, '..'); 

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.html')) {
      stampHTMLFile(fullPath);
    }
  });
}

function stampHTMLFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let wasUpdated = false;

  const linkTagRegex = /<link\s+[^>]*id=["']main-theme-sheet["'][^>]*>/gi;

  content = content.replace(linkTagRegex, (fullLinkTag) => {
    wasUpdated = true;

    const hrefRegex = /(href=["'])([^"'\?]+)(?:\?v=[^"']*)?(["'])/i;
    
    return fullLinkTag.replace(hrefRegex, (match, before, srcPath, after) => {
      return `${before}${srcPath}?v=${BUILD_STAMP}${after}`;
    });
  });

  if (wasUpdated) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

processDirectory(ROOT_DIR);
console.log(`Compiled: HTML files successfully updated with stamp ${BUILD_STAMP}.\n`);