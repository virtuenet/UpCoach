"use strict";
/**
 * Model compatibility layer to bridge sequelize and sequelize-typescript models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageModel = exports.ChatModel = exports.MoodModel = exports.TaskModel = exports.GoalModel = exports.UserModel = void 0;
exports.makeCompatible = makeCompatible;
// Helper to cast regular sequelize models for use with sequelize-typescript decorators
function makeCompatible(model) {
    return model;
}
// Re-export commonly used models with compatibility
var User_1 = require("./User");
Object.defineProperty(exports, "UserModel", { enumerable: true, get: function () { return User_1.User; } });
var Goal_1 = require("./Goal");
Object.defineProperty(exports, "GoalModel", { enumerable: true, get: function () { return Goal_1.Goal; } });
var Task_1 = require("./Task");
Object.defineProperty(exports, "TaskModel", { enumerable: true, get: function () { return Task_1.Task; } });
var Mood_1 = require("./Mood");
Object.defineProperty(exports, "MoodModel", { enumerable: true, get: function () { return Mood_1.Mood; } });
var Chat_1 = require("./Chat");
Object.defineProperty(exports, "ChatModel", { enumerable: true, get: function () { return Chat_1.Chat; } });
var ChatMessage_1 = require("./ChatMessage");
Object.defineProperty(exports, "ChatMessageModel", { enumerable: true, get: function () { return ChatMessage_1.ChatMessage; } });
//# sourceMappingURL=ModelCompatibility.js.map