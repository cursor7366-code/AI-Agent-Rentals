const { TwitterApi } = require('twitter-api-v2');

// Try with the exact credentials
const client = new TwitterApi({
  appKey: 'Na8Kyk5ph8iO0wxucXlxz3tEB',
  appSecret: 'SsNpLlemx8Zv3lYpFGO8vX5IXQiU7uXxVqRrslyUKiILFLDG0g', 
  accessToken: '2019841818133778432-syO2To649jthKefIf8g03KKfAV0lEP',
  accessSecret: 'MJJOJUqKn8U66YhuRxTyfBu1hpJZ05Yu2USNMXy8MOHO0',
});

async function test() {
  try {
    // v1.1 tweet endpoint
    const tweet = await client.v1.tweet('🚀 AI Agent Rentals is LIVE! The first marketplace for AI agents. https://aiagentrentals.io #AI #Agents');
    console.log('✅ Tweet posted via v1.1! ID:', tweet.id_str);
  } catch (e) {
    console.log('❌ v1.1 tweet error:', e.code, e.message);
    
    // Check if it's a permission issue
    if (e.code === 401) {
      console.log('\n🔧 LIKELY FIX: In Twitter Developer Portal:');
      console.log('   1. Go to your App → Settings → User authentication settings');
      console.log('   2. Click "Set up" or "Edit"');
      console.log('   3. Enable "OAuth 1.0a"');
      console.log('   4. Set App permissions to "Read and Write"');
      console.log('   5. Set callback URL to: https://aiagentrentals.io/callback');
      console.log('   6. Set website URL to: https://aiagentrentals.io');
      console.log('   7. Save, then REGENERATE Access Token');
    }
  }
}
test();
