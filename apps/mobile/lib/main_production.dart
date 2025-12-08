import 'core/config/app_config.dart';
import 'main.dart' as app;

void main() {
  initializeAppConfig('production');
  app.main();
}
