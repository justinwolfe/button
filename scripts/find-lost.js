const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');
const moment = require('moment');
const { convertToMarkdown } = require('./utils.js');
require('dotenv').config();

// Read the JSON file
const seedPath = path.join(__dirname, '..', 'data', 'seed.json');
if (!fs.existsSync(seedPath)) {
  console.error(`Error: File not found: ${seedPath}`);
  process.exit(1);
}

const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

// Read the CSV file
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

// Create a Set of subjects from the JSON file
const seedSubjects = new Set(seedData.map((item) => item.subject));

// Filter the CSV records to find missing emails
const cutoffDate = moment('2016-01-03');
const missingEmails = records.filter(
  (record) =>
    !seedSubjects.has(record.Subject) &&
    moment(record.Created_At).isAfter(cutoffDate)
);

// Map the missing emails to the desired format
const missingData = missingEmails.map((email) => ({
  subject: email.Subject,
  content: convertToMarkdown(email.Content),
  createdAt: email.Created_At,
}));

// Write the missing emails to a JSON file
const outputPath = path.join(__dirname, '..', 'data', 'missing.json');
fs.writeFileSync(outputPath, JSON.stringify(missingData, null, 2));

console.log(
  `Missing emails after ${cutoffDate.format(
    'MMMM D, YYYY'
  )} have been saved to missing.json`
);
console.log(`Total missing emails found: ${missingData.length}`);
