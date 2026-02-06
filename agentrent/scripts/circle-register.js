// Circle Entity Secret Registration + First Wallet
const crypto = require('crypto');
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');
const fs = require('fs');

const API_KEY = 'TEST_API_KEY:3685308178cd4a5c321525c5c7f9334f:cfefa328b7c53f66325b1a78de905030';
const ENTITY_SECRET = '4fcc8a18f8f5da49209bbbc1aa1497ddddd9975d334b5d8d2f4425d96e69a0e6';

async function register() {
  try {
    console.log('🔧 Initializing Circle client...');
    
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: API_KEY,
      entitySecret: ENTITY_SECRET
    });

    // Check what methods are available
    console.log('Available client methods:');
    const methods = Object.keys(client).filter(k => typeof client[k] === 'function');
    methods.forEach(m => console.log('  -', m));
    
    // Try to create wallet set directly (SDK might auto-register)
    console.log('\n🏦 Creating wallet set...');
    const walletSetResponse = await client.createWalletSet({
      name: 'AIAgentRentals-Main'
    });
    
    console.log('✅ Wallet set created!');
    console.log('Wallet Set:', JSON.stringify(walletSetResponse.data, null, 2));
    
    // Create first wallet
    console.log('\n💰 Creating first wallet...');
    const walletResponse = await client.createWallets({
      walletSetId: walletSetResponse.data.walletSet.id,
      blockchains: ['ETH-SEPOLIA'],
      count: 1,
      accountType: 'SCA'
    });
    
    console.log('✅ Wallet created!');
    console.log('Wallet:', JSON.stringify(walletResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

register();
