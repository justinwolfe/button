const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');

console.log('Current working directory:', process.cwd());

// Read the JSON file
const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'seed.json'), 'utf-8')
);

// Read the CSV file
const csvData = fs.readFileSync(
  path.join(__dirname, '..', 'data', 'tinyletter_export.csv'),
  'utf-8'
);

const records = csv.parse(csvData, {
  columns: true,
  skip_empty_lines: true,
});

// Create a Set of subjects from the JSON file
const seedSubjects = new Set(seedData.map((item) => item.subject));

// Filter the CSV records to find missing emails
const missingEmails = records.filter(
  (record) => !seedSubjects.has(record.Subject)
);

// Map the missing emails to the desired format
const missingData = missingEmails.map((email) => ({
  subject: email.Subject,
  content: email.Content,
  createdAt: email.Created_At,
}));

// Write the missing emails to a JSON file
fs.writeFileSync(
  path.join(__dirname, '..', 'data', 'missing.json'),
  JSON.stringify(missingData, null, 2)
);

console.log('Missing emails have been saved to missing.json');
