const fs = require('fs').promises;
const path = require('path');
const TurndownService = require('turndown');
const sanitizeFilename = require('sanitize-filename');
const moment = require('moment');
const cheerio = require('cheerio');
const { marked } = require('marked');
require('dotenv').config();

const turndownService = new TurndownService();

function reduceEmptyLines(content) {
  return content.replace(/(\s*\n){3,}/g, '\n\n');
}

function compressHtmlWhitespace(html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  let content = $('body').html() || html;

  // If the content is Markdown, parse it with marked
  if (content.includes('![') || content.includes('```')) {
    content = marked(content);
  }

  const $content = cheerio.load(content, { decodeEntities: false });
  $content('img').each((index, element) => {
    $content(element).before('<br>');
    $content(element).after('<br>');
  });
  content = $content.html();

  // Compress whitespace
  content = content.replace(/\s+/g, ' ').trim();

  return content;
}

async function clearDirectory(directory) {
  const files = await fs.readdir(directory);
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await clearDirectory(filePath);
      await fs.rmdir(filePath);
    } else {
      await fs.unlink(filePath);
    }
  }
}

async function processNewsletters() {
  try {
    const data = await fs.readFile('buttondown_posts.json', 'utf8');
    const newsletters = JSON.parse(data);

    const lettersPath = path.join(__dirname, 'letters');
    await fs.mkdir(lettersPath, { recursive: true });
    await clearDirectory(lettersPath);

    for (const newsletter of newsletters) {
      const publishDate = moment(newsletter.publish_date);
      const year = publishDate.format('YYYY');
      const month = publishDate.format('M');
      const day = publishDate.format('DD');

      const yearPath = path.join(lettersPath, year);
      const monthPath = path.join(yearPath, month);
      await fs.mkdir(yearPath, { recursive: true });
      await fs.mkdir(monthPath, { recursive: true });

      const sanitizedSubject = sanitizeFilename(newsletter.subject);
      const baseFilename = `${year}-${month}-${day}-${sanitizedSubject}`;

      const frontmatter = `---
subject: "${newsletter.subject}"
publish_date: ${newsletter.publish_date}
id: "${newsletter.id}"
absolute_url: "${newsletter.absolute_url}"
---

`;

      const parsedContent = marked(newsletter.body);
      const processedContent = compressHtmlWhitespace(parsedContent);

      await writeFileWithSuffix(
        monthPath,
        `${baseFilename}.html`,
        processedContent
      );

      let markdown = turndownService.turndown(processedContent);
      markdown = reduceEmptyLines(markdown);

      await writeFileWithSuffix(
        monthPath,
        `${baseFilename}.md`,
        frontmatter + markdown
      );
    }

    console.log('Processing complete!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function writeFileWithSuffix(dir, baseFilename, content) {
  let suffix = 0;
  let filename = baseFilename;
  while (true) {
    try {
      await fs.writeFile(path.join(dir, filename), content, { flag: 'wx' });
      break;
    } catch (error) {
      if (error.code === 'EEXIST') {
        suffix++;
        filename = `${path.parse(baseFilename).name}-${suffix}${
          path.parse(baseFilename).ext
        }`;
      } else {
        throw error;
      }
    }
  }
}

processNewsletters();
