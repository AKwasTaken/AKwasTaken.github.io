console.log('Init: sitemap_engine.js');

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://akwastaken.github.io';
const ROOT_DIR = process.cwd(); // Resolves to your project root during npm run build

const TEMPLATE_PATH = path.join(ROOT_DIR, 'dist', 'sitemap-template.xml');
const OUTPUT_PATH = path.join(ROOT_DIR, 'sitemap.xml');
const TARGET_DIRS = [
  { relPath: 'projects', urlPrefix: 'projects' },
  { relPath: 'blogs', urlPrefix: 'blogs' }
];

// Helper to convert "December 10, 2025" to "2025-12-10"
function formatDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  const date = new Date(dateString.trim());
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
}

function generateSitemap() {
  try {
    let additionalUrlsXml = '';

    // Loop through target folders
    TARGET_DIRS.forEach(({ relPath, urlPrefix }) => {
      const dirPath = path.join(ROOT_DIR, relPath);

      if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️ Directory not found: ${dirPath}`);
        return;
      }

      const files = fs.readdirSync(dirPath);

      files.forEach(file => {
        if (path.extname(file).toLowerCase() === '.html') {
          const filePath = path.join(dirPath, file);
          const htmlContent = fs.readFileSync(filePath, 'utf-8');
          
          // Regex to isolate the contents of <span class="blog-creation-time">...</span>
          const dateMatch = htmlContent.match(/class=["']blog-creation-time["'][^>]*>([^<]+)</);
          const rawDate = dateMatch ? dateMatch[1] : null;
          const formattedDate = formatDate(rawDate);

          const pageUrlXml = `${BASE_URL}/${urlPrefix}/${file}`;

          // Format the XML block matching your requested template placeholder
          additionalUrlsXml += `  <url>\n    <loc>${pageUrlXml}</loc>\n    <lastmod>${formattedDate}</lastmod>\n  </url>\n`;
        }
      });
    });

    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error(`Template file missing at ${TEMPLATE_PATH}`);
    }
    
    const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const finalXml = templateContent.replace('${additionalPageUrls}', additionalUrlsXml.trimEnd());

    fs.writeFileSync(OUTPUT_PATH, finalXml, 'utf-8');
    console.log('Compiled: sitemap.xml in root dir.\n');

  } catch (error) {
    console.error('Error generating sitemap:', error.message);
    process.exit(1);
  }
}

generateSitemap();