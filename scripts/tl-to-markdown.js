const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');
const moment = require('moment');
const { convertToMarkdown } = require('./utils.js');

const csvPath = path.join(__dirname, '..', 'data', 'tinyletter_export.csv');
if (!fs.existsSync(csvPath)) {
  console.error(`Error: File not found: ${csvPath}`);
  process.exit(1);
}
const csvData = fs.readFileSync(csvPath, 'utf-8');

const records = csv.parse(csvData, {
  columns: true,
  skip_empty_lines: true,
});

const outputData = records.map((email) => ({
  subject: email.Subject,
  contentOriginal: email.Content,
  content: convertToMarkdown(email.Content),
  createdAt: email.Created_At,
}));

const outputPath = path.join(
  __dirname,
  '..',
  'data',
  'tinyletter_export_md.json'
);

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
