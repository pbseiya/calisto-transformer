import { NextRequest, NextResponse } from 'next/server';

const IRPC_AUTH_API = 'http://devmscenter-api.irpc.in.th/Auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const envUser = process.env.DGA_USERNAME;
    const envPass = process.env.DGA_PASSWORD;
    if (envUser && envPass && username === envUser && password === envPass) {
      const session = { username, empId: 'TEST-001', displayName: `${username} (Test User)` };
      const res = NextResponse.json({ success: true, user: session });
      res.cookies.set('dga_session', JSON.stringify(session), {
        httpOnly: true, secure: true, sameSite: 'strict', maxAge: 60 * 60 * 8, path: '/dga'
      });
      return res;
    }

    const response = await fetch(IRPC_AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Invalid username or password',
        success: false
      }, { status: 401 });
    }

    const data = await response.json();
    
    if (!data.empId) {
      return NextResponse.json({ 
        error: 'Invalid username or password',
        success: false
      }, { status: 401 });
    }

    const session = { 
      username: data.username || username, 
      empId: data.empId, 
      displayName: `${data.username || username} (${data.empId})` 
    };
    const res = NextResponse.json({ success: true, user: session });
    res.cookies.set('dga_session', JSON.stringify(session), {
      httpOnly: true, secure: true, sameSite: 'strict', maxAge: 60 * 60 * 8, path: '/dga'
    });
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}