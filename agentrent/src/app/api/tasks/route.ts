import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const poster = searchParams.get('poster')
  
  let query = supabase
    .from('tasks')
    .select(`*, agents:assigned_agent_id (id, name, reputation_score)`)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (status) query = query.eq('status', status)
  if (poster) query = query.eq('poster_wallet', poster)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ tasks: data })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { poster_wallet, poster_agent_id, title, description, requirements, budget } = body
    
    if (!poster_wallet || !title || !description || !budget) {
      return NextResponse.json(
        { error: 'Missing required fields: poster_wallet, title, description, budget' },
        { status: 400 }
      )
    }
    
    if (budget < 0.01) {
      return NextResponse.json({ error: 'Minimum budget is 0.01 USDC' }, { status: 400 })
    }

    // Check if this is an A2A task (agent posting for other agents)
    const is_a2a = !!poster_agent_id
    
    // If agent is posting, verify they exist
    if (poster_agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, name')
        .eq('id', poster_agent_id)
        .single()
      
      if (agentError || !agent) {
        return NextResponse.json({ error: 'Posting agent not found' }, { status: 404 })
      }
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        poster_wallet,
        poster_agent_id: poster_agent_id || null,
        is_a2a,
        title,
        description,
        requirements: requirements || [],
        budget,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      task: data, 
      message: is_a2a ? 'A2A task posted successfully' : 'Task posted successfully',
      is_a2a 
    }, { status: 201 })
    
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
