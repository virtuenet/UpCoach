"use strict";
/**
 * Common type definitions shared across the backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isApiResponse = isApiResponse;
exports.isPaginatedResponse = isPaginatedResponse;
exports.hasTimestamps = hasTimestamps;
// Export type guards
function isApiResponse(obj) {
    return typeof obj === 'object' && 'success' in obj;
}
function isPaginatedResponse(obj) {
    return typeof obj === 'object' && 'items' in obj && 'total' in obj;
}
function hasTimestamps(obj) {
    return typeof obj === 'object' && 'createdAt' in obj && 'updatedAt' in obj;
}
//# sourceMappingURL=common.js.map