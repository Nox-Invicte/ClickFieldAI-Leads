import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const [{ data: authUserResult, error: authUserError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase.auth.admin.getUserById(payload.userId),
      supabase.from('User').select('name, role, createdAt').eq('id', payload.userId).maybeSingle(),
    ]);

  if (authUserError) {
    console.error('Auth me auth user lookup error:', authUserError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (profileError) {
    console.error('Auth me profile lookup error:', profileError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const authUser = authUserResult.user;
  if (!authUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const user = {
    id: authUser.id,
    email: authUser.email ?? payload.email,
    name:
      profile?.name ??
      ((authUser.user_metadata?.name as string | undefined) ??
        (authUser.email ? authUser.email.split('@')[0] : 'Manager')),
    role:
      profile?.role ??
      ((authUser.user_metadata?.role as string | undefined) ?? payload.role ?? 'MANAGER'),
    createdAt: profile?.createdAt ?? authUser.created_at,
  };

  return NextResponse.json({ user });
}

export async function DELETE() {
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.set('token', '', { maxAge: 0, path: '/' });
  return res;
}
