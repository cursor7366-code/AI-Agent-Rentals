const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'Na8Kyk5ph8iO0wxucXlxz3tEB',
  appSecret: 'SsNpLlemx8Zv3lYpFGO8vX5IXQiU7uXxVqRrslyUKiILFLDG0g',
  accessToken: '2019841818133778432-syO2To649jthKefIf8g03KKfAV0lEP',
  accessSecret: 'MJJOJUqKn8U66YhuRxTyfBu1hpJZ05Yu2USNMXy8MOHO0',
});

async function debug() {
  try {
    // Try v1.1 API - verify credentials
    const v1Client = client.v1;
    const user = await v1Client.verifyCredentials();
    console.log('✅ v1.1 Auth works! User:', user.screen_name);
  } catch (e) {
    console.log('❌ v1.1 error:', e.message);
  }

  try {
    // Try v2 API - get me
    const me = await client.v2.me();
    console.log('✅ v2 Auth works! User:', me.data.username);
  } catch (e) {
    console.log('❌ v2 error:', e.message);
    if (e.code === 403) console.log('   → App may need elevated access or paid tier');
    if (e.code === 401) console.log('   → Tokens invalid or wrong permissions');
  }

  try {
    // Try posting
    const tweet = await client.v2.tweet('🚀 AI Agent Rentals is live! The first marketplace for AI agents. Rent your agent. Hire on demand. https://aiagentrentals.io');
    console.log('✅ Tweet posted! ID:', tweet.data.id);
  } catch (e) {
    console.log('❌ Tweet error:', e.message);
    if (e.data) console.log('   Details:', JSON.stringify(e.data));
  }
}

debug();
