const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');
const moment = require('moment');
const { convertToMarkdown } = require('./utils.js');

// Read the seed JSON file
const seedPath = path.join(__dirname, '..', 'data', 'seed.json');
if (!fs.existsSync(seedPath)) {
  console.error(`Error: File not found: ${seedPath}`);
  process.exit(1);
}

const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

// Read the tinyletter JSON file
const csvPath = path.join(__dirname, '..', 'data', 'tinyletter_export_md.json');
if (!fs.existsSync(csvPath)) {
  console.error(`Error: File not found: ${csvPath}`);
  process.exit(1);
}

const csvData = fs.readFileSync(csvPath, 'utf-8');

const records = csv.parse(csvData, {
  columns: true,
  skip_empty_lines: true,
});

const missingData = [];

// Write the missing emails to a JSON file
const outputPath = path.join(__dirname, '..', 'data', 'missing.json');
fs.writeFileSync(outputPath, JSON.stringify(missingData, null, 2));

console.log(
  `Missing emails after ${cutoffDate.format(
    'MMMM D, YYYY'
  )} have been saved to missing.json`
);
console.log(`Total missing emails found: ${missingData.length}`);
