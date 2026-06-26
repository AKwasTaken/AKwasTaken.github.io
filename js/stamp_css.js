const fs = require('fs');
const path = require('path');

const BUILD_STAMP = Date.now(); 

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

  const regex = /(<link\s+[^>]*id=["']main-theme-sheet["'][^>]*href=["'])([^"'\?]+)(?:\?v=[^"']*)?(["'])/g;

  if (regex.test(content)) {
    const updatedContent = content.replace(regex, (match, before, srcPath, after) => {
      console.log(`⚡ Stamping: ${path.relative(__dirname, filePath)} -> (${srcPath}?v=${BUILD_STAMP})`);
      return `${before}${srcPath}?v=${BUILD_STAMP}${after}`;
    });

    fs.writeFileSync(filePath, updatedContent, 'utf-8');
  }
}


processDirectory(__dirname);
console.log(`Compiled: html files with the stamp ${BUILD_STAMP}.`);