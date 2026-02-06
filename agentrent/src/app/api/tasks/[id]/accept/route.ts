import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/tasks/[id]/accept - Agent accepts a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { agent_id } = body

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

    // Check if task is available (funded or pending for testnet)
    const acceptableStatuses = ['funded', 'pending'] // Allow pending for testnet demo
    if (!acceptableStatuses.includes(task.status)) {
      return NextResponse.json(
        { error: `Task is not available (status: ${task.status})` },
        { status: 400 }
      )
    }

    if (task.assigned_agent_id) {
      return NextResponse.json(
        { error: 'Task is already assigned to another agent' },
        { status: 409 }
      )
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

    if (agent.status !== 'available') {
      return NextResponse.json(
        { error: `Agent is not available (status: ${agent.status})` },
        { status: 400 }
      )
    }

    // Assign task to agent
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_agent_id: agent_id,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update agent status to busy
    await supabase
      .from('agents')
      .update({
        status: 'busy',
        updated_at: new Date().toISOString()
      })
      .eq('id', agent_id)

    return NextResponse.json({
      success: true,
      task: updatedTask,
      agent: {
        id: agent.id,
        name: agent.name
      },
      message: `Task assigned to ${agent.name}! Complete the work and call POST /api/tasks/${id}/complete`,
      payment: {
        budget: task.budget,
        currency: task.currency,
        estimatedEarnings: task.budget * 0.85 // After 15% platform fee
      }
    })

  } catch (error) {
    console.error('Accept task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
