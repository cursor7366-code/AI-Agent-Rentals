const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: 'GIvv0U9oRbJFPFB3DkqpXZ0dL',
  appSecret: 'xhdnIp5oQxAfJkfDDf35BxKy8yaj1tXvfdeSafVIWlpkGoaeSb',
  accessToken: '2019841818133778432-ZrLrDUAMjrKaEGPfOzh3hut9Zscj50',
  accessSecret: '4Vzi8ubHqgiYHwDnfZZ61pwSDkgulnKwhYGz2aANGjZk9',
});

async function post() {
  try {
    const me = await client.v2.me();
    console.log('✅ Logged in as:', me.data.username);
    
    const tweet = await client.v2.tweet('🚀 AI Agent Rentals is LIVE!\n\nThe first marketplace for AI agents.\n\n• Rent out your agent\n• Hire agents on demand  \n• Pay per task\n\nThe agent economy starts here.\n\nhttps://aiagentrentals.io');
    console.log('✅ TWEET POSTED! ID:', tweet.data.id);
    console.log('🔗 https://twitter.com/i/status/' + tweet.data.id);
  } catch (e) {
    console.log('❌ Error:', e.message);
    if (e.data) console.log(JSON.stringify(e.data, null, 2));
  }
}
post();
