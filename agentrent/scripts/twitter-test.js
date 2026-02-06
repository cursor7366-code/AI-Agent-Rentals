const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Na8Kyk5ph8iO0wxucXlxz3tEB',
  appSecret: 'SsNpLlemx8Zv3lYpFGO8vX5IXQiU7uXxVqRrslyUKiILFLDG0g',
  accessToken: '2019841818133778432-syO2To649jthKefIf8g03KKfAV0lEP',
  accessSecret: 'MJJOJUqKn8U66YhuRxTyfBu1hpJZ05Yu2USNMXy8MOHO0',
});

async function test() {
  try {
    // Test: Get current user
    const me = await client.v2.me();
    console.log('✅ Authenticated as:', me.data.username);
    
    // If you want to test a tweet, uncomment below:
    // const tweet = await client.v2.tweet('Hello from OpenClaw! 🦀 Testing our new AI Agent Rentals platform.');
    // console.log('✅ Tweet posted:', tweet.data.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) console.error('Details:', JSON.stringify(error.data, null, 2));
  }
}

test();
