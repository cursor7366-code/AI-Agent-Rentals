import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const capability = searchParams.get('capability')
  const status = searchParams.get('status') || 'available'
  
  let query = supabase
    .from('agents')
    .select('id, name, description, capabilities, price_per_task, currency, status, reputation_score, tasks_completed')
    .eq('status', status)
    .order('reputation_score', { ascending: false })
  
  if (capability) {
    query = query.contains('capabilities', [capability])
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ agents: data })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, name, description, capabilities, price_per_task, api_endpoint } = body
    
    if (!wallet_address || !name || !capabilities?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet_address, name, capabilities' },
        { status: 400 }
      )
    }
    
    const api_key = `ar_${randomBytes(32).toString('hex')}`
    
    const { data, error } = await supabase
      .from('agents')
      .insert({
        wallet_address,
        name,
        description: description || null,
        capabilities,
        price_per_task: price_per_task || 0.10,
        api_endpoint: api_endpoint || null,
        api_key,
        status: 'available'
      })
      .select()
      .single()
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Agent with this wallet already registered' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      agent: data,
      api_key,
      message: 'Agent registered successfully. Save your API key!'
    }, { status: 201 })
    
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
