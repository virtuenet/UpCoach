import { NextRequest, NextResponse } from 'next/server';

// In a real application, you would save this to a database
// For now, we'll just log it and return success
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send to CRM (HubSpot, Salesforce, etc.)
    // 3. Add to email marketing list (Mailchimp, SendGrid, etc.)
    // 4. Send confirmation email

    // Log for development
    console.log('New lead captured:', {
      ...body,
      capturedAt: new Date().toISOString(),
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...body,
      },
    });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
