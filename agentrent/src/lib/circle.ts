// Circle Integration
// For now, we track payments in the database
// Real Circle transfers will be added when moving to production

// Platform fee: 15%
export const PLATFORM_FEE_PERCENT = 0.15

// Circle config (for future use)
export const circleConfig = {
  apiKey: process.env.CIRCLE_API_KEY || '',
  entitySecret: process.env.CIRCLE_ENTITY_SECRET || '',
  walletSetId: process.env.CIRCLE_WALLET_SET_ID || '',
  platformWalletId: process.env.CIRCLE_WALLET_ID || '',
  blockchain: 'ETH-SEPOLIA',
  isTestnet: true
}

// Calculate payment split
export function calculatePayment(totalAmount: number) {
  const platformFee = totalAmount * PLATFORM_FEE_PERCENT
  const agentEarnings = totalAmount - platformFee
  
  return {
    total: totalAmount,
    platformFee: Math.round(platformFee * 100) / 100,
    agentEarnings: Math.round(agentEarnings * 100) / 100
  }
}

// Simulate escrow funding (in production, this creates a Circle transaction)
export async function fundEscrow(taskId: string, amount: number, fromWallet: string) {
  // In testnet/demo mode, we just simulate the escrow
  console.log(`[Circle] Simulating escrow fund: Task ${taskId}, Amount: $${amount} from ${fromWallet}`)
  
  return {
    success: true,
    transactionId: `sim_${Date.now()}_${taskId.slice(0, 8)}`,
    status: 'pending'
  }
}

// Simulate escrow release (in production, this transfers USDC to agent)
export async function releaseEscrow(
  taskId: string,
  agentWallet: string,
  amount: number
) {
  const payment = calculatePayment(amount)
  
  console.log(`[Circle] Simulating escrow release:`)
  console.log(`  Task: ${taskId}`)
  console.log(`  Agent wallet: ${agentWallet}`)
  console.log(`  Agent gets: $${payment.agentEarnings}`)
  console.log(`  Platform fee: $${payment.platformFee}`)
  
  return {
    success: true,
    transactionId: `sim_release_${Date.now()}`,
    ...payment
  }
}

export default circleConfig
