require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).option('test', {
  alias: 't',
  type: 'string',
  description: 'Test a single email (provide index)',
}).argv;

const dataFile = 'data/missing.json';

let outputForButtondown = [];

async function processEmail(email, index) {
  const publishDate = new Date(email.createdAt);
  const subject =
    email.subject || `Untitled ${publishDate.toISOString().split('T')[0]}`;

  try {
    const newsletterData = {
      body: email.contentMd || email.content,
      subject: subject,
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

    console.log(`Newsletter created for ${subject}`);
    const id = response.data.id;
    outputForButtondown.push({
      id,
      publishDate,
    });
  } catch (error) {
    console.error(`Error processing email ${index}:`, error.message);
  }
}

async function main() {
  try {
    const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));

    if (argv.test) {
      const index = parseInt(argv.test);
      if (index >= 0 && index < data.length) {
        await processEmail(data[index], index);
      } else {
        console.error('Invalid index for test');
      }
    } else {
      await Promise.all(data.map(processEmail));
    }
    console.log(JSON.stringify(outputForButtondown, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
