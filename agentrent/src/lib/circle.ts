import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'

const API_KEY = process.env.CIRCLE_API_KEY || 'TEST_API_KEY:3685308178cd4a5c321525c5c7f9334f:cfefa328b7c53f66325b1a78de905030'
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET || '4fcc8a18f8f5da49209bbbc1aa1497ddddd9975d334b5d8d2f4425d96e69a0e6'
const WALLET_SET_ID = process.env.CIRCLE_WALLET_SET_ID || '6270789e-2579-5fdb-9d48-b8c23497db28'
const PLATFORM_WALLET_ID = process.env.CIRCLE_WALLET_ID || '80dc3664-b8c2-50a5-abe2-546730e1c020'

// Platform fee: 15%
export const PLATFORM_FEE_PERCENT = 0.15

export const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: API_KEY,
  entitySecret: ENTITY_SECRET
})

// Create an escrow wallet for a task
export async function createEscrowWallet(taskId: string) {
  try {
    const response = await circleClient.createWallets({
      walletSetId: WALLET_SET_ID,
      blockchains: ['ETH-SEPOLIA'],
      count: 1,
      accountType: 'SCA',
      metadata: [{ name: 'taskId', refId: taskId }]
    })
    
    return {
      success: true,
      wallet: response.data?.wallets?.[0]
    }
  } catch (error) {
    console.error('Create escrow wallet error:', error)
    return { success: false, error: String(error) }
  }
}

// Get wallet balance
export async function getWalletBalance(walletId: string) {
  try {
    const response = await circleClient.getWalletTokenBalance({
      id: walletId
    })
    return {
      success: true,
      balances: response.data?.tokenBalances || []
    }
  } catch (error) {
    console.error('Get balance error:', error)
    return { success: false, error: String(error) }
  }
}

// Transfer from escrow to agent (on task completion)
export async function releaseEscrow(
  escrowWalletId: string,
  agentWalletAddress: string,
  amount: number
) {
  try {
    // Calculate platform fee
    const platformFee = amount * PLATFORM_FEE_PERCENT
    const agentAmount = amount - platformFee
    
    // Transfer to agent
    const agentTransfer = await circleClient.createTransaction({
      walletId: escrowWalletId,
      tokenId: 'USDC', // USDC on testnet
      blockchain: 'ETH-SEPOLIA',
      destinationAddress: agentWalletAddress,
      amounts: [String(agentAmount)],
      fee: {
        type: 'level',
        config: { feeLevel: 'MEDIUM' }
      }
    })
    
    // Transfer platform fee to our wallet
    const platformWalletResponse = await circleClient.getWallet({ id: PLATFORM_WALLET_ID })
    const platformAddress = platformWalletResponse.data?.wallet?.address
    
    if (platformAddress && platformFee > 0) {
      await circleClient.createTransaction({
        walletId: escrowWalletId,
        tokenId: 'USDC',
        blockchain: 'ETH-SEPOLIA',
        destinationAddress: platformAddress,
        amounts: [String(platformFee)],
        fee: {
          type: 'level',
          config: { feeLevel: 'MEDIUM' }
        }
      })
    }
    
    return {
      success: true,
      agentAmount,
      platformFee,
      transactionId: agentTransfer.data?.id
    }
  } catch (error) {
    console.error('Release escrow error:', error)
    return { success: false, error: String(error) }
  }
}

// Get all wallets in our set
export async function listWallets() {
  try {
    const response = await circleClient.listWallets({
      walletSetId: WALLET_SET_ID
    })
    return {
      success: true,
      wallets: response.data?.wallets || []
    }
  } catch (error) {
    console.error('List wallets error:', error)
    return { success: false, error: String(error) }
  }
}

export default circleClient
