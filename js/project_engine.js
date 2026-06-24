const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const matter = require('gray-matter');
const markedKatex = require('marked-katex-extension');

const PROJECTS_DIR = path.join(__dirname, '../projects'); 
const OUTPUT_DIR = path.join(__dirname, '../dist/projects');
const PROJECT_TEMPLATE_PATH = path.join(__dirname, '../dist/project-template.html');
const INDEX_TEMPLATE_PATH = path.join(__dirname, '../dist/projects-index-template.html');
const INDEX_OUTPUT_PATH = path.join(__dirname, '../projects.html');

// State variable to track the relative path from the compiled HTML back to the source image folder
let relativeImagePrefix = '../../projects';

const marked = new Marked();

// 1. Simple Custom Image Renderer
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
    
    // Convert relative syntax (./image.png or image.png) to a clean step-back reference
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
const blogTemplate = fs.readFileSync(PROJECT_TEMPLATE_PATH, 'utf-8');
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

    // --- TRACK CURRENT FOLDER LEVEL ---
    const relativeSubDir = path.relative(PROJECTS_DIR, path.dirname(fullPath));
    // If inside a subfolder like "test", prefix becomes "../../projects/test"
    relativeImagePrefix = relativeSubDir ? `../../projects/${relativeSubDir}` : '../../projects';

    const { data, content } = matter(fs.readFileSync(fullPath, 'utf-8'));
    const title = data.title || path.basename(item, '.md');
    const cleanedContent = content.replace(/\s*---\s*$/, '');
    
    let dateStr = '';
    let year = 2026; 
    let monthIndex = 0;
    let monthName = 'Jan';

    if (data.date) {
      const dateObj = data.date instanceof Date ? data.date : new Date(data.date);
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
    console.log(`Compiled: projects/${safeName}.html`);

    allBlogs.push({ title, year, monthIndex, monthName, url: `dist/projects/${safeName}.html` });
  }
}

compileFolder(PROJECTS_DIR);

allBlogs.sort((a, b) => {
  if (b.year !== a.year) return b.year - a.year;
  if (b.monthIndex !== a.monthIndex) return b.monthIndex - a.monthIndex;
  return a.title.localeCompare(b.title);
});

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
console.log('Compiled: projects.html with all project listings.');