import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculatePayment, releaseToAgent, getTransactionStatus } from '@/lib/circle'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { agent_id, result, result_metadata } = body

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 })
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

    if (task.status !== 'in_progress') {
      return NextResponse.json({ error: `Task is not in progress (status: ${task.status})` }, { status: 400 })
    }

    if (task.assigned_agent_id !== agent_id) {
      return NextResponse.json({ error: 'You are not assigned to this task' }, { status: 403 })
    }

    // Get agent info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    if (!agent.wallet_address) {
      return NextResponse.json({ error: 'Agent has no wallet address configured' }, { status: 400 })
    }

    // Calculate payment split
    const payment = calculatePayment(task.budget)

    // Initiate real transfer to agent
    let transferResult: { success: boolean; transactionId?: string; txHash?: string; error?: string } = { 
      success: false 
    }
    let paymentStatus = 'pending'

    try {
      transferResult = await releaseToAgent(
        agent.wallet_address,
        payment.agentEarnings,
        id
      )

      if (transferResult.success) {
        paymentStatus = 'processing'
        console.log(`[Payment] Transfer initiated: ${transferResult.transactionId}`)
      } else {
        console.error(`[Payment] Transfer failed: ${transferResult.error}`)
        paymentStatus = 'failed'
      }
    } catch (error) {
      console.error('[Payment] Transfer error:', error)
      paymentStatus = 'failed'
      transferResult.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Update task to completed
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        result: result || 'Task completed successfully',
        result_metadata: result_metadata || {},
        platform_fee: payment.platformFee,
        payment_tx: transferResult.transactionId ?? null,
        payment_status: paymentStatus,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update agent stats (even if payment is processing)
    await supabase
      .from('agents')
      .update({
        tasks_completed: agent.tasks_completed + 1,
        total_earned: parseFloat(agent.total_earned) + payment.agentEarnings,
        updated_at: new Date().toISOString()
      })
      .eq('id', agent_id)

    // Record transaction
    await supabase.from('transactions').insert({
      task_id: id,
      from_wallet: task.poster_wallet,
      to_wallet: agent.wallet_address,
      amount: payment.agentEarnings,
      platform_fee: payment.platformFee,
      status: paymentStatus,
      circle_tx_id: transferResult.transactionId ?? null,
      tx_hash: transferResult.txHash ?? null,
      chain: 'eth-sepolia'
    })

    return NextResponse.json({
      success: true,
      task: updatedTask,
      payment: {
        total: task.budget,
        agentEarnings: payment.agentEarnings,
        platformFee: payment.platformFee,
        status: paymentStatus,
        transactionId: transferResult.transactionId,
        txHash: transferResult.txHash,
        agentWallet: agent.wallet_address,
        error: transferResult.success ? null : transferResult.error
      },
      message: transferResult.success 
        ? `Task completed! ${payment.agentEarnings} USDC being sent to ${agent.wallet_address}`
        : `Task completed! Payment of ${payment.agentEarnings} USDC pending (transfer issue: ${transferResult.error})`
    })

  } catch (error) {
    console.error('Complete task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Check payment status for a completed task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: task, error } = await supabase
      .from('tasks')
      .select('id, status, payment_tx, payment_status')
      .eq('id', id)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (!task.payment_tx) {
      return NextResponse.json({
        taskId: task.id,
        paymentStatus: task.payment_status || 'no_payment',
        message: 'No payment transaction recorded'
      })
    }

    // Check Circle for updated status
    const txStatus = await getTransactionStatus(task.payment_tx)

    // Update if status changed
    if (txStatus.state === 'COMPLETE' && task.payment_status !== 'confirmed') {
      await supabase
        .from('tasks')
        .update({ payment_status: 'confirmed' })
        .eq('id', id)
    }

    return NextResponse.json({
      taskId: task.id,
      paymentStatus: txStatus.state === 'COMPLETE' ? 'confirmed' : task.payment_status,
      transactionId: task.payment_tx,
      txHash: txStatus.txHash,
      circleState: txStatus.state
    })

  } catch (error) {
    console.error('Check payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
