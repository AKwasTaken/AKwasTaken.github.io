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

// Global Master Password fallback
const MASTER_PASSWORD = process.env.DIARY_SECRET


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
    // Add periodic spaces so the text wraps nicely like real paragraphs
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

const allBlogs = [];

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
    
    // Check if the individual markdown file specifies its own custom password
    const activePassword = data.password || MASTER_PASSWORD;

    let dateStr = '';
    let year = 2026; 
    let monthIndex = 0;
    let monthName = 'Jan';
    let rawDateValue = 0;

    if (data.date) {
      const dateObj = data.date instanceof Date ? data.date : new Date(data.date);
      rawDateValue = dateObj.getTime();
      year = dateObj.getUTCFullYear();
      monthIndex = dateObj.getUTCMonth();
      monthName = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
      dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    }

    const htmlBody = marked.parse(cleanedContent);
    const encryptedPayload = encryptContent(htmlBody, activePassword);
    const jumbledText = generateScrambledText(htmlBody.length);

    // Structure containing jumbled text and the hidden encrypted payload
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

    allBlogs.push({ title, year, monthIndex, monthName, rawDateValue, url: `sandbox/${safeName}.html` });
  }
}

compileFolder(BLOGS_DIR);

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
console.log('Compiled: sandbox.html with all blog listings.\n');
