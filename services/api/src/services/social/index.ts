/**
 * Social Services Index
 * Exports all group coaching related services
 */

export {
  GroupSessionService,
  createGroupSessionService,
  type CreateSessionInput,
  type UpdateSessionInput,
  type SessionFilters,
  type PaginationOptions,
  type SessionListResult,
  type RegistrationResult,
} from './GroupSessionService';

export {
  GroupSessionChatService,
  createGroupSessionChatService,
  type SendMessageInput,
  type CreatePollInput,
  type AskQuestionInput,
  type ChatMessage,
  type ChatEventHandler,
} from './GroupSessionChatService';
