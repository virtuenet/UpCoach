/**
 * Secure URL sanitization utilities to prevent XSS attacks
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

/**
 * Sanitize and validate a URL to prevent XSS attacks
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '#';
  
  try {
    // Parse the URL to validate structure
    const parsed = new URL(url);
    
    // Only allow safe protocols
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      console.warn('Blocked unsafe protocol:', parsed.protocol);
      return '#';
    }
    
    // Check for javascript: or data: URLs (additional safety)
    if (url.toLowerCase().includes('javascript:') || 
        url.toLowerCase().includes('data:text/html')) {
      console.error('Blocked potential XSS attempt:', url.substring(0, 50));
      return '#';
    }
    
    // Return the validated URL
    return parsed.toString();
  } catch (error) {
    console.warn('Invalid URL provided:', error);
    return '#';
  }
}

/**
 * Validate media URL based on file type
 */
export function validateMediaUrl(url: string, type: 'image' | 'video' | 'audio' | 'document' | 'other'): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    
    switch (type) {
      case 'image':
        return ALLOWED_IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));
      case 'video':
        return ALLOWED_VIDEO_EXTENSIONS.some(ext => pathname.endsWith(ext));
      case 'audio':
        return ALLOWED_AUDIO_EXTENSIONS.some(ext => pathname.endsWith(ext));
      case 'document':
        return ALLOWED_DOCUMENT_EXTENSIONS.some(ext => pathname.endsWith(ext));
      default:
        return true;
    }
  } catch {
    return false;
  }
}

/**
 * Create a safe image element with error handling
 */
export function createSafeImageProps(url: string, alt: string) {
  const sanitizedUrl = sanitizeUrl(url);
  
  return {
    src: sanitizedUrl,
    alt: alt.replace(/[<>]/g, ''), // Basic XSS prevention in alt text
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Replace with placeholder on error
      e.currentTarget.src = '/placeholder-image.png';
      e.currentTarget.onerror = null; // Prevent infinite loop
    },
    loading: 'lazy' as const,
    referrerPolicy: 'no-referrer' as const,
  };
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[\/\\]/g, '_') // Replace slashes
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Keep only safe characters
    .substring(0, 255); // Limit length
}

/**
 * Generate a CSP-compliant nonce for inline scripts
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}