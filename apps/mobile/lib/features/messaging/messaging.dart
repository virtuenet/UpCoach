/// Messaging Feature Module
///
/// Provides real-time messaging, conversations, and chat functionality.
library messaging;

// Providers
export 'providers/messaging_provider.dart';

// Services
export 'services/chat_api_service.dart';
export 'services/chat_websocket_service.dart';
export 'services/user_search_service.dart';

// Screens
export 'screens/conversations_screen.dart';
export 'screens/messaging_screen.dart';

// Widgets
export 'widgets/message_bubble.dart';
export 'widgets/message_input.dart';
export 'widgets/message_search_delegate.dart';
export 'widgets/conversation_info_sheet.dart';
export 'widgets/in_call_chat_overlay.dart';
