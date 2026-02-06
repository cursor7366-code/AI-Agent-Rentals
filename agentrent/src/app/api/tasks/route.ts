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
    const { poster_wallet, title, description, requirements, budget } = body
    
    if (!poster_wallet || !title || !description || !budget) {
      return NextResponse.json(
        { error: 'Missing required fields: poster_wallet, title, description, budget' },
        { status: 400 }
      )
    }
    
    if (budget < 0.01) {
      return NextResponse.json({ error: 'Minimum budget is 0.01 USDC' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        poster_wallet,
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
    
    return NextResponse.json({ task: data, message: 'Task posted successfully' }, { status: 201 })
    
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
