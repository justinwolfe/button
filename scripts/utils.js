const cheerio = require('cheerio');
const { marked } = require('marked');
const TurndownService = require('turndown');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

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

function convertToMarkdown(content) {
  const turndownService = new TurndownService();
  const parsedContent = marked(content);
  const processedContent = compressHtmlWhitespace(parsedContent);
  let markdown = turndownService.turndown(processedContent);
  markdown = reduceEmptyLines(markdown);
  return markdown;
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

module.exports = {
  reduceEmptyLines,
  compressHtmlWhitespace,
  clearDirectory,
  writeFileWithSuffix,
  convertToMarkdown,
};
