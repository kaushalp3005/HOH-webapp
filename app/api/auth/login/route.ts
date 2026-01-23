import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://hoh-jfr9.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Backend endpoint for shop login
    const backendEndpoint = `${BACKEND_URL}/api/shops/login`;
    
    console.log('Calling backend:', backendEndpoint);

    // Call the actual backend API
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Backend response status:', response.status);

    const data = await response.json();
    console.log('Backend response data:', data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Invalid email or password' },
        { status: response.status }
      );
    }

    // Map backend response to frontend format
    // Backend returns: { access_token, token_type, shop }
    // Frontend expects: { user, token }
    return NextResponse.json({
      success: true,
      user: {
        id: data.shop.id.toString(),
        email: data.shop.email,
        name: data.shop.pos_shop_name,
        company: data.shop.company,
        users: data.shop.users,
        pos_shop_name: data.shop.pos_shop_name,
      },
      token: data.access_token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred during login' },
      { status: 500 }
    );
  }
}
