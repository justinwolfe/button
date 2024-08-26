require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).option('test', {
  alias: 't',
  type: 'string',
  description: 'Test a single file (provide filename)',
}).argv;

const dataFolder = 'data';

let outputForButtondown = [];

async function processFile(file) {
  if (path.extname(file) === '.md') {
    const filePath = path.join(dataFolder, file);
    const [month, day, year] = path.basename(file, '.md').split('-');
    const publishDate = new Date(`20${year}-${month}-${day}`);

    try {
      const content = await fs.readFile(filePath, 'utf8');

      const newsletterData = {
        body: content,
        subject: path.basename(file, '.md').replaceAll('-', '/'),
        email_type: 'public',
        status: 'imported',
        metadata: {
          dateForImport: publishDate,
        },
      };

      const response = await axios.post(
        'https://api.buttondown.email/v1/emails',
        newsletterData,
        {
          headers: {
            Authorization: 'Token ' + process.env.BUTTONDOWN_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`Newsletter created for ${file}`);
      const id = response.data.id;
      outputForButtondown.push({
        id,
        publishDate,
      });
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
}

async function main() {
  try {
    if (argv.test) {
      await processFile(argv.test);
    } else {
      const files = await fs.readdir(dataFolder);
      await Promise.all(files.map(processFile));
    }
    console.log(JSON.stringify(outputForButtondown, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
