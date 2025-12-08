// Auto-generated localization messages file
// This file is a placeholder for generated localization messages

import 'dart:async';
import 'package:intl/intl.dart';
import 'package:intl/message_lookup_by_library.dart';

typedef LibraryLoader = Future<dynamic> Function();

Map<String, LibraryLoader> _deferredLibraries = {};

MessageLookupByLibrary? _findExact(String localeName) {
  switch (localeName) {
    case 'en':
      return _MessagesEn();
    case 'es':
      return _MessagesEs();
    case 'fr':
      return _MessagesFr();
    case 'de':
      return _MessagesDe();
    default:
      return null;
  }
}

Future<bool> initializeMessages(String localeName) async {
  var availableLocale = Intl.verifiedLocale(
    localeName,
    (locale) =>
        _deferredLibraries.containsKey(locale) ||
        _findExact(localeName) != null,
    onFailure: (_) => null,
  );
  if (availableLocale == null) {
    return false;
  }
  var lib = _deferredLibraries[availableLocale];
  if (lib != null) {
    await lib();
  }
  return true;
}

class _MessagesEn extends MessageLookupByLibrary {
  @override
  String get localeName => 'en';

  @override
  final messages = <String, Function>{
    'appTitle': () => 'UpCoach',
    'welcome': () => 'Welcome',
    'login': () => 'Login',
    'register': () => 'Register',
    'email': () => 'Email',
    'password': () => 'Password',
    'forgotPassword': () => 'Forgot Password?',
    'noAccount': () => "Don't have an account?",
    'haveAccount': () => 'Already have an account?',
    'signUp': () => 'Sign Up',
    'signIn': () => 'Sign In',
    'home': () => 'Home',
    'goals': () => 'Goals',
    'habits': () => 'Habits',
    'profile': () => 'Profile',
    'settings': () => 'Settings',
    'notifications': () => 'Notifications',
    'logout': () => 'Logout',
    'save': () => 'Save',
    'cancel': () => 'Cancel',
    'delete': () => 'Delete',
    'edit': () => 'Edit',
    'done': () => 'Done',
    'next': () => 'Next',
    'back': () => 'Back',
    'loading': () => 'Loading...',
    'error': () => 'Error',
    'success': () => 'Success',
    'retry': () => 'Retry',
    'noData': () => 'No data available',
  };
}

class _MessagesEs extends MessageLookupByLibrary {
  @override
  String get localeName => 'es';

  @override
  final messages = <String, Function>{
    'appTitle': () => 'UpCoach',
    'welcome': () => 'Bienvenido',
    'login': () => 'Iniciar sesión',
    'register': () => 'Registrarse',
    'email': () => 'Correo electrónico',
    'password': () => 'Contraseña',
  };
}

class _MessagesFr extends MessageLookupByLibrary {
  @override
  String get localeName => 'fr';

  @override
  final messages = <String, Function>{
    'appTitle': () => 'UpCoach',
    'welcome': () => 'Bienvenue',
    'login': () => 'Connexion',
    'register': () => "S'inscrire",
    'email': () => 'E-mail',
    'password': () => 'Mot de passe',
  };
}

class _MessagesDe extends MessageLookupByLibrary {
  @override
  String get localeName => 'de';

  @override
  final messages = <String, Function>{
    'appTitle': () => 'UpCoach',
    'welcome': () => 'Willkommen',
    'login': () => 'Anmelden',
    'register': () => 'Registrieren',
    'email': () => 'E-Mail',
    'password': () => 'Passwort',
  };
}
