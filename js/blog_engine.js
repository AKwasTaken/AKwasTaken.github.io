const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const BLOGS_DIR = path.join(__dirname, 'blogs');
const DIST_DIR = path.join(__dirname, 'dist'); // Where your compiled HTML will go

// Simple HTML wrapper template
const template = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        /* This is where you control your container width */
        .markdown-container {
            max-width: 700px; /* Tweak this value to your desire later */
            margin: 0 auto;
            padding: 20px;
            font-family: sans-serif;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="markdown-container">
        ${content}
    </div>
</body>
</html>
`;

// Ensure output directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

// Function to recursively find and compile .md files
function compileFolder(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            compileFolder(fullPath); // Recursively handle subfolders
        } else if (path.extname(file) === '.md') {
            const mdContent = fs.readFileSync(fullPath, 'utf-8');
            const htmlContent = marked(mdContent);
            const title = path.basename(file, '.md');
            
            const finalHtml = template(title, htmlContent);
            
            // Save to dist folder with the same name but .html extension
            const outPath = path.join(DIST_DIR, `${title}.html`);
            fs.writeFileSync(outPath, finalHtml);
            console.log(`Compiled: ${file} -> ${title}.html`);
        }
    });
}

compileFolder(BLOGS_DIR);