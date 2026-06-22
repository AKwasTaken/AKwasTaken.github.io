const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

// Paths relative to the project root
const BLOGS_DIR = path.join(__dirname, '../blogs'); 
const OUTPUT_DIR = path.join(__dirname, '../public_blogs'); // Keeps compiled HTMLs isolated but accessible

const template = (title, date, content) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AK | ${title}</title>
    <link rel="stylesheet" href="../css/style.css" />
  </head>
  <body>
    <nav class="navbar">
      <div class="nav-container">
        <a href="../index.html" class="logo-link">
          <div class="logo-item" data-src="../assets/logo.svg"></div>
        </a>

        <button class="menu-toggle" id="menu-toggle" aria-label="Toggle navigation">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <ul class="nav-links" id="nav-links">
          <li><a href="../gallery.html" class="nav-item">Gallery</a></li>
          <li><a href="../projects.html" class="nav-item">Projects</a></li>
          <li><a href="../blog.html" class="nav-item">Blog</a></li>
          <li>
            <a href="https://github.com/AKwasTaken" class="nav-item" target="_blank">Github</a>
          </li>
          <li><a href="#" class="nav-item">Contact</a></li>
        </ul>
      </div>
    </nav>
    
    <div class="blog-content">
        <div class="blog-header">
            <h1 class="blog-title">${title}</h1>
            <span class="blog-date">${date}</span>
        </div>

        <div class="blog-body">
            ${content}
        </div>
    </div>

    <script src="../js/nav_menu.js"></script>
    <script src="../js/load_icons.js"></script>
  </body>
</html>
`;

// Create public_blogs directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

function compileFolder(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            compileFolder(fullPath); // Recursively search folders like 'test'
        } else if (path.extname(file) === '.md') {
            const rawFileContent = fs.readFileSync(fullPath, 'utf-8');
            const { data, content } = matter(rawFileContent);
            
            const title = data.title || path.basename(file, '.md');
            const date = data.date || '';
            const htmlBody = marked(content);
            
            const finalHtml = template(title, date, htmlBody);
            
            // Clean up filename (replace spaces with hyphens, lowercase for clean URLs)
            const safeFileName = path.basename(file, '.md')
                .toLowerCase()
                .replace(/\s+/g, '-');

            const outPath = path.join(OUTPUT_DIR, `${safeFileName}.html`);
            fs.writeFileSync(outPath, finalHtml);
            console.log(`Compiled: ${file} -> public_blogs/${safeFileName}.html`);
        }
    });
}

compileFolder(BLOGS_DIR);