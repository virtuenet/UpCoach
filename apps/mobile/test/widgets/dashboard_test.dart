import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class DashboardWidget extends StatelessWidget {
  const DashboardWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
      ),
      body: ListView(
        children: const [
          Card(
            child: ListTile(
              leading: Icon(Icons.fitness_center),
              title: Text('Today\'s Goal'),
              subtitle: Text('Complete 30 minutes of exercise'),
            ),
          ),
          Card(
            child: ListTile(
              leading: Icon(Icons.mood),
              title: Text('Mood Tracker'),
              subtitle: Text('How are you feeling today?'),
            ),
          ),
          Card(
            child: ListTile(
              leading: Icon(Icons.task_alt),
              title: Text('Tasks'),
              subtitle: Text('5 tasks pending'),
            ),
          ),
        ],
      ),
    );
  }
}

void main() {
  group('Dashboard Widget Tests', () {
    testWidgets('Dashboard displays app bar with title',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: DashboardWidget(),
        ),
      );

      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.byType(AppBar), findsOneWidget);
    });

    testWidgets('Dashboard shows goal card', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: DashboardWidget(),
        ),
      );

      expect(find.text('Today\'s Goal'), findsOneWidget);
      expect(find.text('Complete 30 minutes of exercise'), findsOneWidget);
      expect(find.byIcon(Icons.fitness_center), findsOneWidget);
    });

    testWidgets('Dashboard shows mood tracker card',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: DashboardWidget(),
        ),
      );

      expect(find.text('Mood Tracker'), findsOneWidget);
      expect(find.text('How are you feeling today?'), findsOneWidget);
      expect(find.byIcon(Icons.mood), findsOneWidget);
    });

    testWidgets('Dashboard shows tasks card', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: DashboardWidget(),
        ),
      );

      expect(find.text('Tasks'), findsOneWidget);
      expect(find.text('5 tasks pending'), findsOneWidget);
      expect(find.byIcon(Icons.task_alt), findsOneWidget);
    });

    testWidgets('Dashboard cards are scrollable', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: DashboardWidget(),
        ),
      );

      expect(find.byType(ListView), findsOneWidget);
      expect(find.byType(Card), findsNWidgets(3));
    });

    testWidgets('Dashboard renders in dark theme', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(),
          home: const DashboardWidget(),
        ),
      );

      expect(find.byType(DashboardWidget), findsOneWidget);
      expect(find.byType(Card), findsNWidgets(3));
    });

    testWidgets('Dashboard cards have ListTile structure',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: DashboardWidget(),
        ),
      );

      expect(find.byType(ListTile), findsNWidgets(3));

      // Verify each ListTile has leading icon, title, and subtitle
      final listTiles = tester.widgetList<ListTile>(find.byType(ListTile));
      for (final tile in listTiles) {
        expect(tile.leading, isNotNull);
        expect(tile.title, isNotNull);
        expect(tile.subtitle, isNotNull);
      }
    });
  });
}
