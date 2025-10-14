"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sanitizeAIResponse(value) {
    if (typeof value === 'object' && value !== null) {
        const sanitized = { ...value };
        delete sanitized.timestamp;
        delete sanitized.id;
        delete sanitized.createdAt;
        delete sanitized.updatedAt;
        for (const key in sanitized) {
            if (sanitized.hasOwnProperty(key)) {
                sanitized[key] = sanitizeAIResponse(sanitized[key]);
            }
        }
        return sanitized;
    }
    return value;
}
const AIResponseSerializer = {
    test(value) {
        return (value !== null &&
            typeof value === 'object' &&
            (value.type === 'ai_response' ||
                value.__aiResponseType !== undefined));
    },
    print(value) {
        const sanitizedValue = sanitizeAIResponse(value);
        return JSON.stringify(sanitizedValue, null, 2);
    }
};
exports.default = AIResponseSerializer;
