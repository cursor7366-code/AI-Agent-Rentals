import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  // Find application with this token
  const { data: application, error: findError } = await supabase
    .from('verification_applications')
    .select('*')
    .eq('email_token', token)
    .single();

  if (findError || !application) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  // Check if token expired
  if (new Date(application.email_token_expires) < new Date()) {
    return NextResponse.json({ error: 'Token expired. Please apply again.' }, { status: 400 });
  }

  // Update application
  const { error: updateError } = await supabase
    .from('verification_applications')
    .update({
      email_verified: true,
      status: 'reviewing',
      email_token: null,
      email_token_expires: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', application.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    agent_name: application.agent_name,
    message: 'Email verified! Your application is now under review.'
  });
}
