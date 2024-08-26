const fs = require('fs').promises;
const path = require('path');
const TurndownService = require('turndown');
const sanitizeFilename = require('sanitize-filename');
const moment = require('moment');
const { marked } = require('marked');
require('dotenv').config();
const {
  reduceEmptyLines,
  compressHtmlWhitespace,
  clearDirectory,
  writeFileWithSuffix,
} = require('./utils.js');

const turndownService = new TurndownService();

async function processNewsletters() {
  try {
    const data = await fs.readFile(
      path.join(__dirname, '..', 'data', 'seed.json'),
      'utf8'
    );

    const newsletters = JSON.parse(data);

    const dataPath = path.join(__dirname, '..', 'data');
    const lettersPath = path.join(dataPath, 'letters');
    await fs.mkdir(dataPath, { recursive: true });
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

processNewsletters();
