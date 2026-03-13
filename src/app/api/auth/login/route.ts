import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAuthClient, getSupabaseServerClient } from '@/lib/supabase-server';
import { signToken } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = getSupabaseAuthClient();
    const supabase = getSupabaseServerClient();
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      const message = signInError.message.toLowerCase();
      if (message.includes('confirm') || message.includes('verified')) {
        return NextResponse.json(
          {
            error: 'Verify email before signing in.',
            code: 'EMAIL_NOT_VERIFIED',
          },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!signInData.user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const authUser = signInData.user;
    const isEmailVerified = Boolean(authUser.email_confirmed_at ?? authUser.confirmed_at);

    if (!isEmailVerified) {
      return NextResponse.json(
        {
          error: 'Verify email before signing in.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 403 }
      );
    }

    const role = (authUser.user_metadata?.role as string | undefined) ?? 'MANAGER';
    const name =
      (authUser.user_metadata?.name as string | undefined) ??
      (authUser.email ? authUser.email.split('@')[0] : 'Manager');

    const { error: upsertError } = await supabase.from('User').upsert(
      {
        id: authUser.id,
        email: authUser.email ?? email,
        name,
        role,
        password: '__supabase_auth__',
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
      console.error('User profile sync error:', upsertError);
    }

    const token = await signToken({
      userId: authUser.id,
      email: authUser.email ?? email,
      role,
    });

    const res = NextResponse.json({
      user: {
        id: authUser.id,
        name,
        email: authUser.email ?? email,
        role,
      },
    });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
