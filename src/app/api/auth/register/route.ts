import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAuthClient, getSupabaseServerClient } from '@/lib/supabase-server';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = getSupabaseAuthClient();
    const supabase = getSupabaseServerClient();
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const { data: signUpData, error: signUpError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'MANAGER',
        },
      },
    });

    if (signUpError || !signUpData.user) {
      if (signUpError?.message?.toLowerCase().includes('already')) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
      console.error('Supabase signUp error:', signUpError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const authUser = signUpData.user;
    const role = (authUser.user_metadata?.role as string | undefined) ?? 'MANAGER';

    const { error: upsertError } = await supabase.from('User').upsert(
      {
        id: authUser.id,
        email: authUser.email,
        name,
        role,
        password: '__supabase_auth__',
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
      console.error('User profile sync error:', upsertError);
    }

    return NextResponse.json(
      {
        message: 'Account created. Please verify your email before signing in.',
        requiresEmailVerification: true,
        user: {
          id: authUser.id,
          name,
          email: authUser.email ?? email,
          role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
