console.log('Init: blog_engine.js');

const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const matter = require('gray-matter');
const markedKatex = require('marked-katex-extension');

const BLOGS_DIR = path.join(__dirname, '../dist/blogs'); 
const OUTPUT_DIR = path.join(__dirname, '../blogs');
const BLOG_TEMPLATE_PATH = path.join(__dirname, '../dist/blog-template.html');
const INDEX_TEMPLATE_PATH = path.join(__dirname, '../dist/blog-index-template.html');
const INDEX_OUTPUT_PATH = path.join(__dirname, '../blog.html');

let relativeImagePrefix = '../dist/blogs';

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
    relativeImagePrefix = relativeSubDir ? `../dist/blogs/${relativeSubDir}` : '../dist/blogs';

    const { data, content } = matter(fs.readFileSync(fullPath, 'utf-8'));
    const title = data.title || path.basename(item, '.md');
    const cleanedContent = content.replace(/\s*---\s*$/, '');
    
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
    const finalHtml = blogTemplate
      .replace(/\${title}/g, title)
      .replace(/\${date}/g, dateStr)
      .replace(/\${content}/g, htmlBody);

    const safeName = path.basename(item, '.md').toLowerCase().replace(/\s+/g, '-');
    fs.writeFileSync(path.join(OUTPUT_DIR, `${safeName}.html`), finalHtml);
    console.log(`Compiled: blogs/${safeName}.html`);

    allBlogs.push({ title, year, monthIndex, monthName, rawDateValue, url: `blogs/${safeName}.html` });
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
console.log('Compiled: blog.html with all blog listings.\n');