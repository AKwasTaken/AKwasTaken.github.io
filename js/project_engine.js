console.log('Init: project_engine.js');


const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const matter = require('gray-matter');
const markedKatex = require('marked-katex-extension');

const PROJECTS_DIR = path.join(__dirname, '../projects'); 
const OUTPUT_DIR = path.join(__dirname, '../dist/projects');
const PROJECT_TEMPLATE_PATH = path.join(__dirname, '../dist/project-template.html');
const CARD_TEMPLATE_PATH = path.join(__dirname, '../dist/project-card-template.html'); // Added
const INDEX_TEMPLATE_PATH = path.join(__dirname, '../dist/projects-index-template.html');
const INDEX_OUTPUT_PATH = path.join(__dirname, '../projects.html');

let relativeImagePrefix = '../../projects';

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

    if (finalSrc.toLowerCase().endsWith(".mp4")) {
      return `
        <video 
          autoplay 
          loop 
          muted 
          playsinline 
          preload="metadata" 
          class="project-video">
          <source src="${finalSrc}" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      `.trim();
    }

    return `<img src="${finalSrc}" alt="${token.alt}" class="project-image" />`;
  }
};

marked.use(markedKatex({ throwOnError: false, displayMode: false, nonStandard: true }));
marked.use({ extensions: [imageExtension] });

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const projectTemplate = fs.readFileSync(PROJECT_TEMPLATE_PATH, 'utf-8');
const cardTemplate = fs.readFileSync(CARD_TEMPLATE_PATH, 'utf-8');
const indexTemplate = fs.readFileSync(INDEX_TEMPLATE_PATH, 'utf-8');

const allProjects = [];

function compileFolder(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      compileFolder(fullPath);
      continue;
    }
    if (path.extname(item) !== '.md') continue;

    const relativeSubDir = path.relative(PROJECTS_DIR, path.dirname(fullPath));
    relativeImagePrefix = relativeSubDir ? `../../projects/${relativeSubDir}` : '../../projects';

    const { data, content } = matter(fs.readFileSync(fullPath, 'utf-8'));
    const title = data.title || path.basename(item, '.md');

    let description = data.desc || "";
    if (description.toLowerCase().startsWith("description:")) {
      description = description.slice(12).trim();
    }

    const sourceLink = data.source?.trim() || '#';
    const siteLink = data.site?.trim() || '#';
    const cleanedContent = content.replace(/\s*---\s*$/, '');

    let rawTags = data.tags;
    let tagsArray = [];
    if (Array.isArray(rawTags)) {
      tagsArray = rawTags;
    } else if (typeof rawTags === 'string') {
      tagsArray = rawTags.split(',').map(t => t.replace(/['"]+/g, '').trim());
    }

    let dateStr = "";
    let year = 2026;
    let monthIndex = 0;

    if (data.date) {
      const dateObj =
        data.date instanceof Date ? data.date : new Date(data.date);
      year = dateObj.getUTCFullYear();
      monthIndex = dateObj.getUTCMonth();
      dateStr = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });
    }

    let source = "";
    let site = "";
    let projectLinkButtons = "";

    if (sourceLink !== "#") {
      source = `<span class="source-code"><a href="${sourceLink}" target="_blank" class="source-button">Source Code</a></span>`;
    }

    if (siteLink !== "#") {
      site = `<span class="site-link"><a href="${siteLink}" target="_blank" class="site-link-button">Project Demo</a></span>`;
    }

    projectLinkButtons = `${source} ${site}`;

    const htmlBody = marked.parse(cleanedContent);
    const finalHtml = projectTemplate
      .replace(/\${title}/g, title)
      .replace(/\${date}/g, dateStr)
      .replace(/\${projectLinks}/g, projectLinkButtons)
      .replace(/\${content}/g, htmlBody);

    const outputFileName = title.replace(/[^a-zA-Z ]/g, "").replace(/ /g, "_");

    const safeName = path
      .basename(outputFileName, ".md")
      .toLowerCase()
      .replace(/\s+/g, "-");
    fs.writeFileSync(path.join(OUTPUT_DIR, `${safeName}.html`), finalHtml);
    console.log(`Compiled: projects/${safeName}.html`);

    allProjects.push({
      title,
      year,
      monthIndex,
      description,
      tags: tagsArray,
      url: `dist/projects/${safeName}.html`,
    });
  }
}

compileFolder(PROJECTS_DIR);

allProjects.sort((a, b) => {
  if (b.year !== a.year) return b.year - a.year;
  if (b.monthIndex !== a.monthIndex) return b.monthIndex - a.monthIndex;
  return a.title.localeCompare(b.title);
});

let finalGridMarkup = "";
for (const project of allProjects) {
  const tagSpans = project.tags
    .map((tag) => `<span class="project-tag">${tag}</span>`)
    .join("\n");

  const renderedCard = cardTemplate
    .replace(/\${projectTitle}/g, project.title)
    .replace(/\${projectYear}/g, project.year)
    .replace(/\${projectDescription}/g, project.description)
    .replace(/\${projectTag}/g, tagSpans);

  finalGridMarkup += `
    <a href="${project.url}" class="project-card-link">
      ${renderedCard}
    </a>\n`;
}

const finalIndexHtml = indexTemplate.replace(
  /\${projectListings}/g,
  finalGridMarkup.trim(),
);
fs.writeFileSync(INDEX_OUTPUT_PATH, finalIndexHtml);
console.log("Compiled: projects.html with all grid elements.\n");
