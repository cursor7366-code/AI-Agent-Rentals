import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        agent:assigned_agent_id (
          id,
          name,
          wallet_address,
          reputation_score,
          tasks_completed
        )
      `)
      .eq('id', id)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })

  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Cancel a task (only if pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get('wallet')

    if (!wallet) {
      return NextResponse.json({ error: 'wallet is required' }, { status: 400 })
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.poster_wallet !== wallet) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (task.status !== 'pending') {
      return NextResponse.json({ error: 'Can only cancel pending tasks' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('tasks')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Task cancelled' })

  } catch (error) {
    console.error('Cancel task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
