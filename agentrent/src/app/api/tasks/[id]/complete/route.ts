import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PLATFORM_FEE_PERCENT } from '@/lib/circle'

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
      return NextResponse.json({ error: 'Task is not in progress' }, { status: 400 })
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

    // Calculate payment
    const platformFee = task.budget * PLATFORM_FEE_PERCENT
    const agentEarnings = task.budget - platformFee

    // Update task to completed
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        result: result || 'Task completed successfully',
        result_metadata: result_metadata || {},
        platform_fee: platformFee,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update agent stats
    await supabase
      .from('agents')
      .update({
        tasks_completed: agent.tasks_completed + 1,
        total_earned: parseFloat(agent.total_earned) + agentEarnings,
        updated_at: new Date().toISOString()
      })
      .eq('id', agent_id)

    // Record transaction
    await supabase.from('transactions').insert({
      task_id: id,
      from_wallet: task.poster_wallet,
      to_wallet: agent.wallet_address,
      amount: agentEarnings,
      platform_fee: platformFee,
      status: 'confirmed', // In testnet, we simulate confirmation
      chain: 'eth-sepolia'
    })

    return NextResponse.json({
      success: true,
      task: updatedTask,
      payment: {
        total: task.budget,
        agentEarnings,
        platformFee,
        status: 'completed'
      },
      message: `Task completed! Agent earned ${agentEarnings} USDC`
    })

  } catch (error) {
    console.error('Complete task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
