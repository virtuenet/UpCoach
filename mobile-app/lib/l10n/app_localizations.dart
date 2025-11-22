import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart';

// Import generated files
import 'messages_all.dart';

class AppLocalizations {
  AppLocalizations(this.localeName);

  static Future<AppLocalizations> load(Locale locale) {
    final String name = locale.countryCode == null || locale.countryCode!.isEmpty
        ? locale.languageCode
        : locale.toString();
    final String localeName = Intl.canonicalizedLocale(name);

    return initializeMessages(localeName).then((_) {
      return AppLocalizations(localeName);
    });
  }

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  final String localeName;

  // Common
  String get welcome => Intl.message('Welcome', name: 'welcome');
  String get loading => Intl.message('Loading...', name: 'loading');
  String get save => Intl.message('Save', name: 'save');
  String get cancel => Intl.message('Cancel', name: 'cancel');
  String get delete => Intl.message('Delete', name: 'delete');
  String get edit => Intl.message('Edit', name: 'edit');
  String get create => Intl.message('Create', name: 'create');
  String get update => Intl.message('Update', name: 'update');
  String get search => Intl.message('Search', name: 'search');
  String get filter => Intl.message('Filter', name: 'filter');
  String get sort => Intl.message('Sort', name: 'sort');

  // Auth
  String get login => Intl.message('Login', name: 'login');
  String get logout => Intl.message('Logout', name: 'logout');
  String get register => Intl.message('Register', name: 'register');
  String get forgotPassword => Intl.message('Forgot Password?', name: 'forgotPassword');
  String get email => Intl.message('Email', name: 'email');
  String get password => Intl.message('Password', name: 'password');
  String get confirmPassword => Intl.message('Confirm Password', name: 'confirmPassword');

  // Dashboard
  String get dashboard => Intl.message('Dashboard', name: 'dashboard');
  String get overview => Intl.message('Overview', name: 'overview');
  String get statistics => Intl.message('Statistics', name: 'statistics');
  String get recentActivity => Intl.message('Recent Activity', name: 'recentActivity');
  String get progress => Intl.message('Progress', name: 'progress');

  // Goals
  String get goals => Intl.message('Goals', name: 'goals');
  String get createGoal => Intl.message('Create Goal', name: 'createGoal');
  String get editGoal => Intl.message('Edit Goal', name: 'editGoal');
  String get deleteGoal => Intl.message('Delete Goal', name: 'deleteGoal');
  String get goalName => Intl.message('Goal Name', name: 'goalName');
  String get description => Intl.message('Description', name: 'description');
  String get targetDate => Intl.message('Target Date', name: 'targetDate');
  String get status => Intl.message('Status', name: 'status');
  String get completed => Intl.message('Completed', name: 'completed');
  String get inProgress => Intl.message('In Progress', name: 'inProgress');
  String get notStarted => Intl.message('Not Started', name: 'notStarted');

  // Tasks
  String get tasks => Intl.message('Tasks', name: 'tasks');
  String get createTask => Intl.message('Create Task', name: 'createTask');
  String get editTask => Intl.message('Edit Task', name: 'editTask');
  String get deleteTask => Intl.message('Delete Task', name: 'deleteTask');
  String get taskName => Intl.message('Task Name', name: 'taskName');
  String get dueDate => Intl.message('Due Date', name: 'dueDate');
  String get priority => Intl.message('Priority', name: 'priority');
  String get high => Intl.message('High', name: 'high');
  String get medium => Intl.message('Medium', name: 'medium');
  String get low => Intl.message('Low', name: 'low');

  // Coaching
  String get coaching => Intl.message('Coaching', name: 'coaching');
  String get sessions => Intl.message('Sessions', name: 'sessions');
  String get bookSession => Intl.message('Book Session', name: 'bookSession');
  String get upcomingSessions => Intl.message('Upcoming Sessions', name: 'upcomingSessions');
  String get pastSessions => Intl.message('Past Sessions', name: 'pastSessions');
  String get coach => Intl.message('Coach', name: 'coach');
  String get duration => Intl.message('Duration', name: 'duration');
  String get price => Intl.message('Price', name: 'price');

  // Gamification
  String get achievements => Intl.message('Achievements', name: 'achievements');
  String get level => Intl.message('Level', name: 'level');
  String get points => Intl.message('Points', name: 'points');
  String get badges => Intl.message('Badges', name: 'badges');
  String get streaks => Intl.message('Streaks', name: 'streaks');
  String get leaderboard => Intl.message('Leaderboard', name: 'leaderboard');
  String get challenges => Intl.message('Challenges', name: 'challenges');
  String get rewards => Intl.message('Rewards', name: 'rewards');
  String get unlocked => Intl.message('Unlocked', name: 'unlocked');
  String get locked => Intl.message('Locked', name: 'locked');
  String get claim => Intl.message('Claim', name: 'claim');
  String dayStreak(int days) => Intl.message(
        '$days Day Streak',
        name: 'dayStreak',
        args: [days],
      );

  // Profile
  String get profile => Intl.message('Profile', name: 'profile');
  String get editProfile => Intl.message('Edit Profile', name: 'editProfile');
  String get personalInfo => Intl.message('Personal Information', name: 'personalInfo');
  String get firstName => Intl.message('First Name', name: 'firstName');
  String get lastName => Intl.message('Last Name', name: 'lastName');
  String get phone => Intl.message('Phone', name: 'phone');
  String get bio => Intl.message('Bio', name: 'bio');
  String get timezone => Intl.message('Timezone', name: 'timezone');
  String get language => Intl.message('Language', name: 'language');
  String get notifications => Intl.message('Notifications', name: 'notifications');
  String get privacy => Intl.message('Privacy', name: 'privacy');
  String get security => Intl.message('Security', name: 'security');
  String get changePassword => Intl.message('Change Password', name: 'changePassword');
  String get deleteAccount => Intl.message('Delete Account', name: 'deleteAccount');

  // Messages
  String get saveSuccess => Intl.message('Saved successfully', name: 'saveSuccess');
  String get deleteSuccess => Intl.message('Deleted successfully', name: 'deleteSuccess');
  String get updateSuccess => Intl.message('Updated successfully', name: 'updateSuccess');
  String get createSuccess => Intl.message('Created successfully', name: 'createSuccess');
  String get confirmDelete => Intl.message(
        'Are you sure you want to delete this?',
        name: 'confirmDelete',
      );
  String get noData => Intl.message('No data available', name: 'noData');
  String get error => Intl.message('Error', name: 'error');
  String get success => Intl.message('Success', name: 'success');
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar']
        .contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) {
    return AppLocalizations.load(locale);
  }

  @override
  bool shouldReload(AppLocalizationsDelegate old) {
    return false;
  }

  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = [
    AppLocalizationsDelegate(),
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('de'),
    Locale('pt'),
    Locale('zh'),
    Locale('ja'),
    Locale('ar'),
  ];
}