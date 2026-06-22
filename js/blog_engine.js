const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const katex = require('katex');

const BLOGS_DIR = path.join(__dirname, '../blogs');
const OUTPUT_DIR = path.join(__dirname, '../compiled_blog'); // Where static HTML files go

// Ensure output folder exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 📄 Master Page Template (Uses your existing layout & stylesheets)
const pageTemplate = (title, content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Blog</title>
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
</head>
<body>
  <main class="blog-post-view">
    <a href="index.html" class="back-to-blog">← Back to Index</a>
    <article class="markdown-body">
      ${content}
    </article>
  </main>
</body>
</html>`;

// 📄 Master Blog Directory List Template
const indexTemplate = (linksHTML) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog Index</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <main class="blog-wrapper">
    <h1 class="page-heading">BLOG</h1>
    <ul class="posts-links-grid">
      ${linksHTML}
    </ul>
  </main>
</body>
</html>`;

// 🛠️ The Obsidian Markdown + Math Core Compiler
function parseObsidianMarkdown(rawMarkdown) {
  let processed = rawMarkdown;

  // 1. Convert Obsidian [[Wikilinks]] to standard flat HTML files
  processed = processed.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, alias) => {
    const cleanSlug = target.trim().toLowerCase().replace(/\s+/g, '-');
    const displayText = alias ? alias.trim() : target.trim();
    return `<a href="${cleanSlug}.html" class="internal-wikilink">${displayText}</a>`;
  });

  // 2. Shield LaTeX blocks ($ and $$) from being broken by Marked.js
  const mathBlocks = [];
  
  // Block Math $$ ... $$
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, equations) => {
    const id = `__MATH_BLOCK_${mathBlocks.length}__`;
    mathBlocks.push({ id, formula: equations, display: true });
    return id;
  });

  // Inline Math $ ... $
  processed = processed.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
    const id = `__MATH_BLOCK_${mathBlocks.length}__`;
    mathBlocks.push({ id, formula: formula, display: false });
    return id;
  });

  // 3. Compile structural text down to HTML via Marked
  let htmlContent = marked.parse(processed);

  // 4. Swap placeholders back out with baked-in static KaTeX components
  mathBlocks.forEach(item => {
    try {
      const renderedMath = katex.renderToString(item.formula, {
        displayMode: item.display,
        throwOnError: false
      });
      htmlContent = htmlContent.replace(item.id, renderedMath);
    } catch (err) {
      console.error("KaTeX failed compilation:", err);
    }
  });

  return htmlContent;
}

// 📂 Main scraping function
function runScraper() {
  if (!fs.existsSync(BLOGS_DIR)) {
    console.error("Error: Can't find a 'blogs' directory.");
    return;
  }

  // Find all folders inside blogs/
  const folders = fs.readdirSync(BLOGS_DIR).filter(file => {
    return fs.statSync(path.join(BLOGS_DIR, file)).isDirectory();
  });

  const indexLinks = [];

  folders.forEach(folder => {
    const folderPath = path.join(BLOGS_DIR, folder);
    const files = fs.readdirSync(folderPath);
    const mdFile = files.find(f => f.endsWith('.md'));

    if (mdFile) {
      console.log(`🔨 Processing folder: ${folder}`);
      const rawMarkdown = fs.readFileSync(path.join(folderPath, mdFile), 'utf-8');
      
      const compiledContent = parseObsidianMarkdown(rawMarkdown);
      const readableTitle = folder.replace(/-/g, ' ').toUpperCase();
      
      const absoluteHTMLPage = pageTemplate(readableTitle, compiledContent);
      
      // Output HTML file matching the slug
      fs.writeFileSync(path.join(OUTPUT_DIR, `${folder}.html`), absoluteHTMLPage);
      indexLinks.push(`<li><a href="${folder}.html" class="blog-idx-link">${readableTitle}</a></li>`);
    }
  });

  // Generate main directory listing dashboard
  const finalIndexHTML = indexTemplate(indexLinks.join('\n'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), finalIndexHTML);

  console.log(`\n✅ Done! Generated index and ${indexLinks.length} static HTML posts in /compiled_blog/`);
}

runScraper();