const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function processEntries(inputFile) {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });

    // Read the input file
    const data = await fs.readFile(inputFile, 'utf8');

    // Split the content into entries
    const entries = data.split(/\n(?=\d{1,2}\/\d{1,2}\/\d{2,4})/);

    for (let entry of entries) {
      // Extract and sanitize the date
      const dateMatch = entry.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      if (!dateMatch) continue;

      const date = dateMatch[1];
      const sanitizedDate = date.replace(/\//g, '-');

      // Remove the date line
      entry = entry.replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}\n/, '');

      // Process paragraphs
      const lines = entry.split('\n');
      let paragraphs = [];
      let currentParagraph = '';

      for (let line of lines) {
        if (line.trim() === '') {
          if (currentParagraph) {
            paragraphs.push(currentParagraph.trim());
            currentParagraph = '';
          }
        } else {
          currentParagraph += (currentParagraph ? ' ' : '') + line.trim();
        }
      }
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
      }

      // Join paragraphs with two newlines between them
      const processedEntry = paragraphs.join('\n\n\n');

      // Create the markdown file in the data directory
      const fileName = path.join(dataDir, `${sanitizedDate}.md`);
      await fs.writeFile(fileName, processedEntry);

      console.log(`Created file: ${fileName}`);
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Usage
const inputFile = 'paste.txt'; // Replace with your input file name
processEntries(inputFile);
