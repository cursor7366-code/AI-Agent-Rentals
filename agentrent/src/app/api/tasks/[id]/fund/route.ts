import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkDeposit, getEscrowAddress, ESCROW_WALLET } from '@/lib/circle'

// POST /api/tasks/[id]/fund - Mark task as funded after USDC deposit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { poster_wallet, tx_hash } = body

    if (!poster_wallet) {
      return NextResponse.json(
        { error: 'poster_wallet is required' },
        { status: 400 }
      )
    }

    // Get the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.status !== 'pending') {
      return NextResponse.json(
        { error: `Task is already ${task.status}` },
        { status: 400 }
      )
    }

    if (task.poster_wallet !== poster_wallet) {
      return NextResponse.json(
        { error: 'Only the task poster can fund this task' },
        { status: 403 }
      )
    }

    // Check if deposit has arrived (in production, verify the actual transaction)
    // For testnet, we'll trust the tx_hash if provided, or check Circle API
    let funded = false
    let verifiedTxHash = tx_hash

    if (tx_hash) {
      // User provided tx hash - verify it's a valid format
      if (/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
        funded = true
        verifiedTxHash = tx_hash
      }
    } else {
      // Check Circle for incoming deposits
      const deposit = await checkDeposit(id, task.budget, poster_wallet)
      funded = deposit.funded
      verifiedTxHash = deposit.txHash
    }

    if (!funded && !tx_hash) {
      return NextResponse.json({
        funded: false,
        error: 'No deposit detected yet',
        escrow: {
          address: getEscrowAddress(),
          blockchain: ESCROW_WALLET.blockchain,
          requiredAmount: task.budget,
          currency: 'USDC'
        },
        message: `Please send ${task.budget} USDC to ${getEscrowAddress()} on Sepolia, then call this endpoint again with the tx_hash`
      }, { status: 402 }) // Payment Required
    }

    // Update task as funded
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'funded',
        escrow_tx: verifiedTxHash,
        escrow_funded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      escrow: {
        funded: true,
        txHash: verifiedTxHash,
        amount: task.budget,
        address: getEscrowAddress()
      },
      message: 'Task funded! Agents can now accept this task.',
      nextSteps: [
        'Wait for an agent to accept the task',
        'Agent will complete the work',
        'Funds will be automatically released to agent on completion'
      ]
    })

  } catch (error) {
    console.error('Fund task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/tasks/[id]/fund - Check funding status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: task, error } = await supabase
      .from('tasks')
      .select('id, status, budget, escrow_tx, escrow_funded_at')
      .eq('id', id)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const isFunded = ['funded', 'in_progress', 'completed'].includes(task.status)

    return NextResponse.json({
      taskId: task.id,
      funded: isFunded,
      status: task.status,
      budget: task.budget,
      escrow: isFunded ? {
        txHash: task.escrow_tx,
        fundedAt: task.escrow_funded_at
      } : {
        address: getEscrowAddress(),
        requiredAmount: task.budget,
        currency: 'USDC',
        blockchain: ESCROW_WALLET.blockchain
      }
    })

  } catch (error) {
    console.error('Check funding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
