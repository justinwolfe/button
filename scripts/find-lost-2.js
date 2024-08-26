const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the seed JSON file
const seedPath = path.join(__dirname, '..', 'data', 'seed.json');
if (!fs.existsSync(seedPath)) {
  console.error(`Error: File not found: ${seedPath}`);
  process.exit(1);
}

const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
console.log(`Loaded ${seedData.length} records from seed data`);

// Read the tinyletter JSON file
const csvPath = path.join(__dirname, '..', 'data', 'tinyletter_export_md.json');
if (!fs.existsSync(csvPath)) {
  console.error(`Error: File not found: ${csvPath}`);
  process.exit(1);
}

const csvData = fs.readFileSync(csvPath, 'utf-8');

const records = JSON.parse(csvData);
console.log(`Loaded ${records.length} records from tinyletter export`);

const missingData = [];

console.log('Starting to compare records...');

// Create a Set of content hashes from seedData for faster lookup
const seedContentHashes = new Set(
  seedData.map((item) => hashContent(item.bodyMd))
);

// Define the cutoff date
const cutoffDate = new Date('2016-01-03T00:00:00Z');

records.forEach((record, index) => {
  if (index % 100 === 0) {
    console.log(`Processing record ${index + 1} of ${records.length}`);
  }

  // Check if the record's creation date is on or after the cutoff date
  const recordDate = new Date(record.createdAt);
  if (recordDate >= cutoffDate) {
    const recordContentHash = hashContent(record.content);

    if (!seedContentHashes.has(recordContentHash)) {
      missingData.push({
        subject: record.subject,
        createdAt: record.createdAt,
        content: record.contentOriginal,
        contentMd: record.content,
      });
    }
  }
});

console.log('Finished comparing records');

// Write the missing emails to a JSON file
const outputPath = path.join(__dirname, '..', 'data', 'missing.json');
fs.writeFileSync(outputPath, JSON.stringify(missingData, null, 2));

console.log(`Missing emails have been saved to missing.json`);
console.log(`Total missing emails found: ${missingData.length}`);

// Helper function to create a simple hash of the content
function hashContent(content) {
  return content.length + ':' + content.slice(0, 100).replace(/\s+/g, '');
}
