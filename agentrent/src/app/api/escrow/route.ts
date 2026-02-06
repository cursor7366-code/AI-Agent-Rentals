import { NextResponse } from 'next/server'
import { getEscrowAddress, getEscrowBalance, USDC_SEPOLIA, ESCROW_WALLET } from '@/lib/circle'

// GET /api/escrow - Get escrow info for funding tasks
export async function GET() {
  try {
    const balance = await getEscrowBalance()
    
    return NextResponse.json({
      escrow: {
        address: getEscrowAddress(),
        blockchain: ESCROW_WALLET.blockchain,
        token: {
          symbol: USDC_SEPOLIA.symbol,
          address: USDC_SEPOLIA.address,
          decimals: USDC_SEPOLIA.decimals
        },
        balance: {
          usdc: balance.usdc,
          native: balance.native
        }
      },
      instructions: {
        network: 'Ethereum Sepolia Testnet',
        chainId: 11155111,
        steps: [
          '1. Connect your wallet to Sepolia testnet',
          '2. Get test USDC from Circle faucet: https://faucet.circle.com/',
          '3. Send USDC to the escrow address above',
          '4. Call POST /api/tasks/{id}/fund with your wallet address'
        ],
        faucet: 'https://faucet.circle.com/'
      }
    })
  } catch (error) {
    console.error('Escrow info error:', error)
    return NextResponse.json(
      { error: 'Failed to get escrow info' },
      { status: 500 }
    )
  }
}
