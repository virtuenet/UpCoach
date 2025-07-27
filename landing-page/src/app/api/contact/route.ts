import { NextRequest, NextResponse } from 'next/server';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting: Store IP timestamps in memory (in production, use Redis or similar)
const ipRateLimits = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

// Clean up old timestamps
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, timestamps] of ipRateLimits.entries()) {
    const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (validTimestamps.length === 0) {
      ipRateLimits.delete(ip);
    } else {
      ipRateLimits.set(ip, validTimestamps);
    }
  }
}

// Check rate limit
function checkRateLimit(ip: string): boolean {
  cleanupRateLimits();
  
  const now = Date.now();
  const timestamps = ipRateLimits.get(ip) || [];
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  
  if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  ipRateLimits.set(ip, [...recentTimestamps, now]);
  return true;
}

// Get client IP
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}

// Validate contact form data
interface ContactData {
  name: string;
  email: string;
  company?: string;
  message: string;
  source?: string;
}

function validateContactData(data: any): { valid: boolean; error?: string; data?: ContactData } {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (!data.email || typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email.trim())) {
    return { valid: false, error: 'Valid email is required' };
  }
  
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length < 10) {
    return { valid: false, error: 'Message must be at least 10 characters' };
  }
  
  if (data.message.length > 5000) {
    return { valid: false, error: 'Message is too long (max 5000 characters)' };
  }
  
  return {
    valid: true,
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      company: data.company?.trim() || undefined,
      message: data.message.trim(),
      source: data.source || 'contact-form',
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate data
    const validation = validateContactData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const contactData = validation.data!;

    // In production, you would:
    // 1. Store in database
    // 2. Send email notification to team
    // 3. Send confirmation email to user
    // 4. Create ticket in support system
    // 5. Track in analytics

    // Log for now
    console.log('Contact form submission:', {
      ...contactData,
      ip: clientIp,
      timestamp: new Date().toISOString(),
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate different lead routing based on criteria
    let assignedTo = 'general';
    if (contactData.company && contactData.company.length > 0) {
      assignedTo = 'sales';
    }
    if (contactData.message.toLowerCase().includes('enterprise') || 
        contactData.message.toLowerCase().includes('team')) {
      assignedTo = 'enterprise';
    }
    if (contactData.message.toLowerCase().includes('support') || 
        contactData.message.toLowerCase().includes('help')) {
      assignedTo = 'support';
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We\'ll get back to you within 24 hours.',
      data: {
        ticketId: `CONTACT-${Date.now()}`,
        assignedTo,
        submittedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}