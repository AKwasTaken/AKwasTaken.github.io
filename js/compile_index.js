console.log('Init: compile_index.js');

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Define directory paths relative to this script file location
const BLOGS_DIR = path.join(__dirname, '../blogs'); 
const HOME_INDEX_TEMPLATE_PATH = path.join(__dirname, '../dist/indexPage-template.html');
const HOME_INDEX_OUTPUT_PATH = path.join(__dirname, '../index.html');

const allBlogs = [];

// 1. Read and parse markdown files to gather meta details
function gatherBlogMetadata(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      gatherBlogMetadata(fullPath);
      continue;
    }
    if (path.extname(item) !== '.md') continue;

    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const { data } = matter(fileContent);
    
    const title = data.title || path.basename(item, '.md');
    const safeName = path.basename(item, '.md').toLowerCase().replace(/\s+/g, '-');
    const url = `dist/blogs/${safeName}.html`;

    let year = 2026; 
    let monthName = 'Jan';
    let rawDateValue = 0; 

    if (data.date) {
      const dateObj = data.date instanceof Date ? data.date : new Date(data.date);
      rawDateValue = dateObj.getTime(); 
      year = dateObj.getUTCFullYear();
      monthName = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    }

    allBlogs.push({ title, year, monthName, rawDateValue, url });
  }
}

gatherBlogMetadata(BLOGS_DIR);

// 2. Sort by timestamp descending so latest releases bubble up first
allBlogs.sort((a, b) => b.rawDateValue - a.rawDateValue);

// 3. Take the top 5 entries
const latestFiveBlogs = allBlogs.slice(0, 5);
let homeIndexCardsMarkup = '';

// 4. Map entries into your requested HTML block layout
for (const blog of latestFiveBlogs) {
  const blogIndexMonthYear = `${blog.monthName}, ${blog.year}`;
  
  homeIndexCardsMarkup += `<a href="${blog.url}" class="blog-single-link">
              <section class="blog-index-card">
                <div class="blog-index-header">
                  <span class="blog-index-year">${blogIndexMonthYear}</span>
                  <span class="blog-index-title">${blog.title}</span>
                </div>
              </section>
            </a>\n`;
}

// 5. Inject the markup block into the indexPage-template and save to root
if (fs.existsSync(HOME_INDEX_TEMPLATE_PATH)) {
  const homeIndexTemplate = fs.readFileSync(HOME_INDEX_TEMPLATE_PATH, 'utf-8');
  const finalHomeIndexHtml = homeIndexTemplate.replace(/\${blogIndexCards}/g, homeIndexCardsMarkup.trim());
  
  fs.writeFileSync(HOME_INDEX_OUTPUT_PATH, finalHomeIndexHtml);
  console.log('Compiled: index.html\n');
} else {
  console.error(`Error: Missing home template file at: ${HOME_INDEX_TEMPLATE_PATH}`);
}