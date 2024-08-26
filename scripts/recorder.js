require('dotenv').config();

const fs = require('fs').promises;
const { convertToMarkdown } = require('./utils.js');
const path = require('path');

const API_KEY = process.env.BUTTONDOWN_API_KEY;
const axios = require('axios');
const BASE_URL =
  'https://api.buttondown.email/v1/emails?status=imported&status=sent';
const OUTPUT_FILE = 'data/seed.json';
const DELAY_MS = 1000; // 1 second delay
const TEST_MODE = process.argv.includes('--test'); // Check if --test flag is present

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPosts(url) {
  let allPosts = [];
  let nextUrl = url;

  while (nextUrl && (!TEST_MODE || allPosts.length === 0)) {
    try {
      await delay(DELAY_MS);

      const response = await axios.get(nextUrl, {
        headers: {
          Authorization: `Token ${API_KEY}`,
        },
      });

      const { results, next } = response.data;
      allPosts = allPosts.concat(results);

      console.log(`Fetched ${allPosts.length} posts so far...`);

      nextUrl = next;
    } catch (error) {
      console.error('Error fetching posts:', error.message);
      throw error;
    }
  }

  return allPosts;
}

async function main() {
  try {
    console.log(
      TEST_MODE
        ? 'Running in test mode - will only fetch the first page.'
        : 'Running in full mode - will fetch all pages.'
    );

    const allPosts = await fetchPosts(BASE_URL);
    const outputFile = TEST_MODE ? 'test_' + OUTPUT_FILE : OUTPUT_FILE;
    const parsedPosts = allPosts.map((post) => {
      return {
        id: post.id,
        subject: post.subject,
        publish_date: post.publish_date,
        creation_date: post.creation_date,
        modification_date: post.modification_date,
        absolute_url: post.absolute_url,
        body: post.body,
        bodyMd: convertToMarkdown(post.body),
        attachments: post.attachments,
        slug: post.slug,
      };
    });

    await fs.writeFile(
      path.join(__dirname, '..', outputFile),
      JSON.stringify(parsedPosts, null, 2)
    );
    console.log(
      `Successfully downloaded ${allPosts.length} posts to ${outputFile}`
    );

    if (TEST_MODE) {
      console.log(
        'Test completed. Only the first page of results was fetched and stored.'
      );
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main();
