const { TwitterApi } = require('twitter-api-v2');

// OAuth 2.0 with user context
const client = new TwitterApi({
  clientId: 'TldiNWN3NGNhbFhkQ0taWDRxMDU6MTpjaQ',
  clientSecret: 'bYMSEske0RxmNW5aWFfycrlDCJS9HzMcIa03IB-3KU63jakcwq',
});

// For OAuth 2.0 user context, we need to do the auth flow
// Let's try with OAuth 1.0a credentials again first with the new setup
const userClient = new TwitterApi({
  appKey: 'GIvv0U9oRbJFPFB3DkqpXZ0dL',
  appSecret: 'xhdnIp5oQxAfJkfDDf35BxKy8yaj1tXvfdeSafVIWlpkGoaeSb',
  accessToken: '2019841818133778432-bKHwyXQbdJBnrupTBAu8Uc9p8YwA7A',
  accessSecret: 'WgRCTK3thERLCL1BJMBTXeiEKuqd22ppqsGsp7Hxrew6V',
});

async function post() {
  try {
    // Try getting user info first
    const me = await userClient.v2.me();
    console.log('✅ Authenticated as:', me.data.username);
    
    // Try posting
    const tweet = await userClient.v2.tweet('🚀 AI Agent Rentals is LIVE! The first marketplace for AI agents. https://aiagentrentals.io');
    console.log('✅ Tweet posted! ID:', tweet.data.id);
  } catch (e) {
    console.log('❌ Error:', e.code || e.status, e.message);
    if (e.data) console.log('Details:', JSON.stringify(e.data, null, 2));
  }
}
post();
