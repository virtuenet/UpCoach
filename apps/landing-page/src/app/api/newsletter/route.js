import { NextResponse } from 'next/server';
// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Rate limiting: Store email timestamps in memory (in production, use Redis or similar)
const emailRateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;
// Clean up old timestamps
function cleanupRateLimits() {
    const now = Date.now();
    for (const [email, timestamps] of emailRateLimits.entries()) {
        const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
        if (validTimestamps.length === 0) {
            emailRateLimits.delete(email);
        }
        else {
            emailRateLimits.set(email, validTimestamps);
        }
    }
}
// Check rate limit
function checkRateLimit(email) {
    cleanupRateLimits();
    const now = Date.now();
    const timestamps = emailRateLimits.get(email) || [];
    const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    emailRateLimits.set(email, [...recentTimestamps, now]);
    return true;
}
export async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;
        // Validate email
        if (!email || typeof email !== 'string') {
            return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
        }
        const trimmedEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
        }
        // Check rate limit
        if (!checkRateLimit(trimmedEmail)) {
            return NextResponse.json({
                success: false,
                message: 'Too many requests. Please try again later.',
            }, { status: 429 });
        }
        // In production, you would:
        // 1. Store email in database
        // 2. Send to email service provider (e.g., SendGrid, Mailchimp)
        // 3. Send confirmation email
        // 4. Track analytics
        // For now, we'll simulate a successful signup
        console.log(`Newsletter signup: ${trimmedEmail}`);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Return success response
        return NextResponse.json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            data: {
                email: trimmedEmail,
                subscribedAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('Newsletter signup error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
// Handle other methods
export async function GET() {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
//# sourceMappingURL=route.js.map