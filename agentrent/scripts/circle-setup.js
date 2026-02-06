// Circle Entity Secret Setup Script
const crypto = require('crypto');
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');

const API_KEY = 'TEST_API_KEY:3685308178cd4a5c321525c5c7f9334f:cfefa328b7c53f66325b1a78de905030';

async function setup() {
  try {
    // Initialize client
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: API_KEY,
      entitySecret: '' // We'll generate this
    });

    // Generate a 32-byte entity secret
    const entitySecret = crypto.randomBytes(32);
    const entitySecretHex = entitySecret.toString('hex');
    
    console.log('='.repeat(60));
    console.log('CIRCLE ENTITY SECRET SETUP');
    console.log('='.repeat(60));
    console.log('\n🔐 ENTITY SECRET (SAVE THIS SECURELY - YOU NEED IT):');
    console.log(entitySecretHex);
    
    // Get Circle's public key
    console.log('\n📥 Fetching Circle public key...');
    const configResponse = await client.getPublicKey();
    
    if (configResponse.data?.publicKey) {
      console.log('\n✅ Got Circle public key');
      
      // Generate ciphertext
      const publicKey = crypto.createPublicKey(configResponse.data.publicKey);
      const encryptedData = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        entitySecret
      );
      const entitySecretCiphertext = encryptedData.toString('base64');
      
      console.log('\n🔒 ENTITY SECRET CIPHERTEXT (for Console registration):');
      console.log(entitySecretCiphertext);
      
      console.log('\n' + '='.repeat(60));
      console.log('NEXT STEPS:');
      console.log('='.repeat(60));
      console.log('1. Go to: https://console.circle.com');
      console.log('2. Navigate to: Developer > Entity Secret');
      console.log('3. Click "Register Entity Secret"');
      console.log('4. Paste the CIPHERTEXT above');
      console.log('5. Download the RECOVERY FILE (important!)');
      console.log('6. Save the recovery file to a secure location');
      console.log('='.repeat(60));
      
    } else {
      console.log('❌ Could not get public key:', configResponse);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

setup();
