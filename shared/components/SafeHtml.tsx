import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface SafeHtmlProps {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: string[];
  /**
   * If true, allows more HTML tags but still sanitizes dangerous content
   */
  relaxed?: boolean;
}

/**
 * Component for safely rendering HTML content
 * Prevents XSS attacks by sanitizing HTML before rendering
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({
  html,
  className,
  allowedTags,
  allowedAttributes,
  relaxed = false,
}) => {
  const sanitizeOptions: DOMPurify.Config = relaxed
    ? {
        // Relaxed mode: Allow more tags but still remove dangerous content
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'i', 'b',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
          'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
          'div', 'span', 'article', 'section', 'nav', 'aside',
          'header', 'footer', 'figure', 'figcaption',
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel', 'src', 'alt', 'title',
          'class', 'id', 'style', 'width', 'height',
        ],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        SAFE_FOR_TEMPLATES: true,
        WHOLE_DOCUMENT: false,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        FORCE_BODY: true,
        SANITIZE_DOM: true,
        KEEP_CONTENT: true,
      }
    : {
        // Strict mode: Only allow basic formatting tags
        ALLOWED_TAGS: allowedTags || [
          'p', 'br', 'strong', 'em', 'u', 'i', 'b',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        ],
        ALLOWED_ATTR: allowedAttributes || ['href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        SAFE_FOR_TEMPLATES: true,
      };

  // Additional security: Remove any event handlers
  const sanitized = DOMPurify.sanitize(html, {
    ...sanitizeOptions,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  });

  // Additional check for javascript: protocol
  const finalSanitized = sanitized.replace(/javascript:/gi, '');

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: finalSanitized }}
    />
  );
};

/**
 * Hook for sanitizing HTML strings
 */
export const useSanitizeHtml = () => {
  const sanitize = (
    html: string,
    options?: {
      allowedTags?: string[];
      allowedAttributes?: string[];
      relaxed?: boolean;
    }
  ): string => {
    const config: DOMPurify.Config = options?.relaxed
      ? {
          ALLOWED_TAGS: options.allowedTags || [
            'p', 'br', 'strong', 'em', 'u', 'i', 'b',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'a', 'img',
          ],
          ALLOWED_ATTR: options.allowedAttributes || [
            'href', 'src', 'alt', 'title', 'class',
          ],
        }
      : {
          ALLOWED_TAGS: options?.allowedTags || [
            'p', 'br', 'strong', 'em', 'u', 'i', 'b',
          ],
          ALLOWED_ATTR: options?.allowedAttributes || [],
        };

    return DOMPurify.sanitize(html, {
      ...config,
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
      FORBID_TAGS: ['script', 'style', 'iframe'],
    });
  };

  return { sanitize };
};

/**
 * Utility function for sanitizing user input before storage
 */
export const sanitizeForStorage = (input: string): string => {
  // Remove all HTML tags for storage
  const withoutTags = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Additional cleanup
  return withoutTags
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/**
 * Utility function for sanitizing URLs
 */
export const sanitizeUrl = (url: string): string => {
  // List of allowed protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  
  try {
    const parsed = new URL(url);
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '#'; // Return safe default for invalid protocols
    }
    
    // Remove any javascript: or data: URLs
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      return '#';
    }
    
    return url;
  } catch {
    // If URL parsing fails, return safe default
    return '#';
  }
};

export default SafeHtml;