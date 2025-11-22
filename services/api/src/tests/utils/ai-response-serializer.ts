// AI Response Snapshot Serializer
// Helps normalize AI responses for consistent snapshot testing

// Sanitize sensitive or dynamic content from AI responses
function sanitizeAIResponse(value: unknown): unknown {
  if (typeof value === 'object' && value !== null) {
    // Remove timestamps, IDs, and other dynamic content
    const sanitized = { ...value };
    delete sanitized.timestamp;
    delete sanitized.id;
    delete sanitized.createdAt;
    delete sanitized.updatedAt;
    
    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (sanitized.hasOwnProperty(key)) {
        sanitized[key] = sanitizeAIResponse(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  // For non-object types, return the value as-is
  return value;
}

interface SnapshotSerializerModule {
  test(value: unknown): boolean;
  print(value: unknown): string;
}

// Jest snapshot serializer configuration
const AIResponseSerializer: SnapshotSerializerModule = {
  test(value: unknown) {
    // Check if the value is an AI response object
    return (
      value !== null &&
      typeof value === 'object' &&
      (value.type === 'ai_response' || 
       value.__aiResponseType !== undefined)
    );
  },
  
  print(value: unknown) {
    // Sanitize and convert the AI response to a consistent string representation
    const sanitizedValue = sanitizeAIResponse(value);
    return JSON.stringify(sanitizedValue, null, 2);
  }
};

export default AIResponseSerializer;