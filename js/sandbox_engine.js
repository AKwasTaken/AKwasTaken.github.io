console.log('Init: sandbox-engine.js');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Marked } = require('marked');
const matter = require('gray-matter');
const markedKatex = require('marked-katex-extension');

const BLOGS_DIR = path.join(__dirname, '../dist/sandbox'); 
const OUTPUT_DIR = path.join(__dirname, '../sandbox');
const BLOG_TEMPLATE_PATH = path.join(__dirname, '../dist/sandbox-template.html');
const INDEX_TEMPLATE_PATH = path.join(__dirname, '../dist/sandbox-index-template.html');
const INDEX_OUTPUT_PATH = path.join(__dirname, '../sandbox.html');

// Global Master Password
const MASTER_PASSWORD = process.env.DIARY_SECRET;

if (!MASTER_PASSWORD) {
  console.error("ERROR: DIARY_SECRET environment variable is missing.");
  console.error("Run with: DIARY_SECRET='your_password' node js/sandbox_engine.js");
  process.exit(1);
}

function deriveKey(passphrase) {
  return crypto.createHash('sha256').update(passphrase).digest();
}

function encryptContent(plainHtml, passphrase) {
  const key = deriveKey(passphrase);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainHtml, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return JSON.stringify({
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag: authTag
  });
}

// Helper to generate realistic-looking scrambled text for display before unlocking
function generateScrambledText(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~';
  let result = '';
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 8 === 0 && Math.random() > 0.4) {
      result += ' ';
    } else {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

let relativeImagePrefix = '../dist/sandbox';
const marked = new Marked();

const imageExtension = {
  name: 'customImage',
  level: 'inline',
  start(src) { return src.indexOf('!'); },
  tokenizer(src) {
    const match = src.match(/^!\[([\s\S]*?)\]\((.*?)\)/);
    if (match) {
      return { type: 'customImage', raw: match[0], alt: match[1], href: match[2] };
    }
  },
  renderer(token) {
    let finalSrc = token.href;
    if (finalSrc.startsWith('./')) {
      finalSrc = `${relativeImagePrefix}/${finalSrc.slice(2)}`;
    } else if (!finalSrc.startsWith('/') && !finalSrc.startsWith('http')) {
      finalSrc = `${relativeImagePrefix}/${finalSrc}`;
    }
    return `<img src="${finalSrc}" alt="${token.alt}" class="blog-image" />`;
  }
};

marked.use(markedKatex({ throwOnError: false, displayMode: false, nonStandard: true }));
marked.use({ extensions: [imageExtension] });

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const blogTemplate = fs.readFileSync(BLOG_TEMPLATE_PATH, 'utf-8');
const indexTemplate = fs.readFileSync(INDEX_TEMPLATE_PATH, 'utf-8');

// ==========================================
// PHASE 1: Compile Markdown to sandbox/ HTML
// ==========================================
function compileFolder(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      compileFolder(fullPath);
      continue;
    }
    if (path.extname(item) !== '.md') continue;

    const relativeSubDir = path.relative(BLOGS_DIR, path.dirname(fullPath));
    relativeImagePrefix = relativeSubDir ? `../dist/sandbox/${relativeSubDir}` : '../dist/sandbox';

    const { data, content } = matter(fs.readFileSync(fullPath, 'utf-8'));
    const title = data.title || path.basename(item, '.md');
    const cleanedContent = content.replace(/\s*---\s*$/, '');
    
    const activePassword = data.password || MASTER_PASSWORD;

    let dateStr = '';
    if (data.date) {
      const dateObj = data.date instanceof Date ? data.date : new Date(data.date);
      dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    }

    const htmlBody = marked.parse(cleanedContent);
    const encryptedPayload = encryptContent(htmlBody, activePassword);
    const jumbledText = generateScrambledText(htmlBody.length);

    const contentMarkup = `
      <div id="sandbox-content" data-payload='${encryptedPayload.replace(/'/g, "&#39;")}'>
        <p class="scrambled-text">${jumbledText}</p>
      </div>`;

    const finalHtml = blogTemplate
      .replace(/\${title}/g, title)
      .replace(/\${date}/g, dateStr)
      .replace(/\${content}/g, contentMarkup);

    const safeName = path.basename(item, '.md').toLowerCase().replace(/\s+/g, '-');
    fs.writeFileSync(path.join(OUTPUT_DIR, `${safeName}.html`), finalHtml);
    console.log(`Compiled: sandbox/${safeName}.html ${data.password ? '(Custom Password)' : '(Master Password)'}`);
  }
}

compileFolder(BLOGS_DIR);

// ==========================================
// PHASE 2: Index generated sandbox/ HTML files
// ==========================================
const allBlogs = [];

function indexHtmlFiles(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      indexHtmlFiles(fullPath);
      continue;
    }
    if (path.extname(item) !== '.html') continue;

    const htmlContent = fs.readFileSync(fullPath, 'utf-8');

    // Regex match to extract title from #sandbox-pw-link
    const titleMatch = htmlContent.match(/<button[^>]*id=["']sandbox-pw-link["'][^>]*>([\s\S]*?)<\/button>/i);
    // Regex match to extract date from .blog-creation-time
    const dateMatch = htmlContent.match(/<span[^>]*class=["'][^"']*blog-creation-time[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);

    const title = titleMatch ? titleMatch[1].trim() : path.basename(item, '.html');
    const rawDateStr = dateMatch ? dateMatch[1].trim() : '';

    let year = 2026;
    let monthName = 'Jan';
    let rawDateValue = 0;

    if (rawDateStr) {
      const dateObj = new Date(rawDateStr);
      if (!isNaN(dateObj.getTime())) {
        rawDateValue = dateObj.getTime();
        year = dateObj.getUTCFullYear();
        monthName = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
      }
    }

    const relativePathFromRoot = path.relative(path.join(__dirname, '..'), fullPath);

    allBlogs.push({
      title,
      year,
      monthName,
      rawDateValue,
      url: relativePathFromRoot.replace(/\\/g, '/')
    });
  }
}

indexHtmlFiles(OUTPUT_DIR);

allBlogs.sort((a, b) => b.rawDateValue - a.rawDateValue);

const groupedByYear = {};
for (const blog of allBlogs) {
  if (!groupedByYear[blog.year]) groupedByYear[blog.year] = [];
  groupedByYear[blog.year].push(blog);
}

let finalIndexMarkup = '';
const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);

for (const year of sortedYears) {
  let postRows = '';
  for (const blog of groupedByYear[year]) {
    postRows += `
        <a href="${blog.url}" class="blog-row">
          <span class="blog-title">${blog.title}</span>
          <span class="blog-date">${blog.monthName}</span>
        </a>`;
  }

  finalIndexMarkup += `
    <section class="blog-year-section">
      <h3 class="blog-year">${year}</h3>
      <div class="blog-list">${postRows}
      </div>
    </section>\n`;
}

const finalIndexHtml = indexTemplate.replace(/\${blogListings}/g, finalIndexMarkup.trim());
fs.writeFileSync(INDEX_OUTPUT_PATH, finalIndexHtml);
console.log('Indexed all HTML files and generated sandbox.html successfully.\n');
