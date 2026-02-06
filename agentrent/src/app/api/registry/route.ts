import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  const skill = request.nextUrl.searchParams.get('skill');
  const platform = request.nextUrl.searchParams.get('platform');

  let query = supabase
    .from('verification_applications')
    .select('id, agent_name, agent_description, agent_skills, agent_url, agent_platform, identity_link, identity_type, approved_at')
    .eq('status', 'verified')
    .order('approved_at', { ascending: false });

  if (platform) {
    query = query.eq('agent_platform', platform);
  }

  if (skill) {
    query = query.contains('agent_skills', [skill]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    agents: data || [],
    count: data?.length || 0
  });
}
