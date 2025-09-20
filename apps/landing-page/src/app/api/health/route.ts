import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check response
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'upcoach-landing-page',
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}