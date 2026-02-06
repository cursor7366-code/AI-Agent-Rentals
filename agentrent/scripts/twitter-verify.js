const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'GIvv0U9oRbJFPFB3DkqpXZ0dL',
  appSecret: 'xhdnIp5oQxAfJkfDDf35BxKy8yaj1tXvfdeSafVIWlpkGoaeSb',
  accessToken: '2019841818133778432-ZrLrDUAMjrKaEGPfOzh3hut9Zscj50',
  accessSecret: '4Vzi8ubHqgiYHwDnfZZ61pwSDkgulnKwhYGz2aANGjZk9',
});

async function verify() {
  // Try v1.1 verify_credentials - simplest auth test
  try {
    const user = await client.v1.verifyCredentials();
    console.log('✅ v1.1 works! User:', user.screen_name);
    console.log('   Can write:', user.status ? 'maybe' : 'unknown');
  } catch (e) {
    console.log('❌ v1.1 failed:', e.message);
  }
  
  // Try posting via v1.1
  try {
    const tweet = await client.v1.tweet('🚀 Test from AI Agent Rentals');
    console.log('✅ v1.1 TWEET WORKED! ID:', tweet.id_str);
  } catch (e) {
    console.log('❌ v1.1 tweet failed:', e.code, '-', e.message);
  }
}
verify();
