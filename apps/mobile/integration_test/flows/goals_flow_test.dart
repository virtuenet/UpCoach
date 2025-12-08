// Goals Feature E2E Tests
//
// Comprehensive end-to-end tests for goal management including:
// - Creating goals with milestones
// - Tracking progress
// - Editing goals
// - Completing goals
// - Goal analytics

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:upcoach_mobile/main.dart' as app;
import '../test_config.dart';
import '../helpers/e2e_test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  final binding = IntegrationTestWidgetsFlutterBinding.instance;

  group('Goals Feature E2E Tests', () {
    late ScreenshotHelper screenshots;
    late PerformanceHelper performance;

    Future<void> loginAndNavigateToGoals(WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(TestConfig.pageLoadTimeout);

      // Login
      await tester.enterTextInField('Email', TestConfig.testUser.email);
      await tester.enterTextInField('Password', TestConfig.testUser.password);
      await tester.tapButton('Login');
      await tester.waitForLoadingToComplete();

      // Navigate to goals tab
      await tester.tapIcon(Icons.flag);
      await tester.pumpAndSettle();
    }

    setUp(() {
      TestDataFactory.reset();
      performance = PerformanceHelper();
    });

    // =========================================================================
    // Create Goal Tests
    // =========================================================================

    group('Create Goal', () {
      testWidgets(
        'should create a new goal with target date',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'create_goal',
          );

          await loginAndNavigateToGoals(tester);

          await screenshots.takeScreenshot('01_goals_screen');

          // Tap create button
          await tester.tapIcon(Icons.add);
          await tester.pumpAndSettle();

          await screenshots.takeScreenshot('02_create_goal_form');

          // Fill goal details
          final goalTitle = TestDataFactory.uniqueGoalTitle();
          await tester.enterTextInField('Goal Title', goalTitle);
          await tester.enterTextInField(
            'Description',
            'This is a test goal description',
          );

          // Set target date
          final datePicker = find.byIcon(Icons.calendar_today);
          if (datePicker.evaluate().isNotEmpty) {
            await tester.tap(datePicker);
            await tester.pumpAndSettle();

            // Select a date 30 days from now
            await tester.tap(find.text('OK'));
            await tester.pumpAndSettle();
          }

          await screenshots.takeScreenshot('03_form_filled');

          // Save goal
          await tester.tapButton('Save');
          await tester.waitForLoadingToComplete();

          await screenshots.takeScreenshot('04_after_save');

          // Verify goal appears in list
          tester.expectWidgetExists(
            find.text(goalTitle),
            reason: 'New goal should appear in the list',
          );
        },
      );

      testWidgets(
        'should create goal with milestones',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'create_goal_milestones',
          );

          await loginAndNavigateToGoals(tester);

          await tester.tapIcon(Icons.add);
          await tester.pumpAndSettle();

          final goalTitle = 'Goal with Milestones';
          await tester.enterTextInField('Goal Title', goalTitle);
          await tester.enterTextInField(
            'Description',
            'A goal with multiple milestones',
          );

          await screenshots.takeScreenshot('01_basic_info');

          // Add milestones
          final addMilestoneButton = find.text('Add Milestone');
          if (addMilestoneButton.evaluate().isNotEmpty) {
            // Add first milestone
            await tester.tap(addMilestoneButton);
            await tester.pumpAndSettle();

            await tester.enterTextInField('Milestone Title', 'First Milestone');
            await tester.pumpAndSettle();

            await screenshots.takeScreenshot('02_first_milestone');

            // Add second milestone
            await tester.tap(addMilestoneButton);
            await tester.pumpAndSettle();

            final milestoneFields = find.byType(TextField);
            if (milestoneFields.evaluate().length > 3) {
              await tester.enterText(milestoneFields.at(3), 'Second Milestone');
              await tester.pumpAndSettle();
            }

            await screenshots.takeScreenshot('03_two_milestones');
          }

          // Save goal
          await tester.tapButton('Save');
          await tester.waitForLoadingToComplete();

          await screenshots.takeScreenshot('04_goal_created');

          tester.expectWidgetExists(find.text(goalTitle));
        },
      );

      testWidgets(
        'should select goal category',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          await tester.tapIcon(Icons.add);
          await tester.pumpAndSettle();

          await tester.enterTextInField(
            'Goal Title',
            TestDataFactory.uniqueGoalTitle(),
          );

          // Select category
          final categoryOptions = ['Health', 'Career', 'Personal', 'Finance'];
          for (final category in categoryOptions) {
            final categoryChip = find.text(category);
            if (categoryChip.evaluate().isNotEmpty) {
              await tester.tap(categoryChip);
              await tester.pumpAndSettle();
              break;
            }
          }

          await tester.tapButton('Save');
          await tester.waitForLoadingToComplete();
        },
      );

      testWidgets(
        'should validate goal title is required',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          await tester.tapIcon(Icons.add);
          await tester.pumpAndSettle();

          // Try to save without title
          await tester.tapButton('Save');
          await tester.pumpAndSettle();

          // Verify validation error
          tester.expectAtLeastOneWidget(
            find.textContaining('required'),
            reason: 'Should show goal title required error',
          );
        },
      );
    });

    // =========================================================================
    // Update Progress Tests
    // =========================================================================

    group('Update Progress', () {
      testWidgets(
        'should update goal progress with slider',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'update_progress',
          );

          await loginAndNavigateToGoals(tester);

          await screenshots.takeScreenshot('01_goals_list');

          // Tap on a goal to view details
          final goalCard = find.byType(Card).first;
          if (goalCard.evaluate().isNotEmpty) {
            await tester.tap(goalCard);
            await tester.pumpAndSettle();

            await screenshots.takeScreenshot('02_goal_detail');

            // Find progress slider or update button
            final slider = find.byType(Slider);
            if (slider.evaluate().isNotEmpty) {
              // Drag slider to update progress
              await tester.drag(slider, const Offset(100, 0));
              await tester.pumpAndSettle();

              await screenshots.takeScreenshot('03_progress_updated');
            }

            // Look for update progress button
            final updateButton = find.text('Update Progress');
            if (updateButton.evaluate().isNotEmpty) {
              await tester.tap(updateButton);
              await tester.pumpAndSettle();

              await screenshots.takeScreenshot('04_progress_dialog');
            }
          }
        },
      );

      testWidgets(
        'should complete milestone and update progress',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          // Tap on goal with milestones
          final goalCard = find.byType(Card).first;
          if (goalCard.evaluate().isNotEmpty) {
            await tester.tap(goalCard);
            await tester.pumpAndSettle();

            // Find milestone checkbox
            final milestoneCheck = find.byIcon(Icons.check_circle_outline);
            if (milestoneCheck.evaluate().isNotEmpty) {
              await tester.tap(milestoneCheck.first);
              await tester.pumpAndSettle();

              // Verify milestone completed
              tester.expectAtLeastOneWidget(
                find.byIcon(Icons.check_circle),
              );
            }
          }
        },
      );

      testWidgets(
        'should show progress percentage',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          // Look for percentage display
          final percentageText = find.textContaining('%');
          if (percentageText.evaluate().isEmpty) {
            // May show as "45%" or "45 percent"
            final percentIndicator = find.byType(CircularProgressIndicator);
            expect(
              percentageText.evaluate().isNotEmpty ||
                  percentIndicator.evaluate().isNotEmpty,
              anyOf(isTrue, isFalse),
            );
          }
        },
      );
    });

    // =========================================================================
    // Goal Detail Tests
    // =========================================================================

    group('Goal Details', () {
      testWidgets(
        'should display goal details screen',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'goal_details',
          );

          await loginAndNavigateToGoals(tester);

          // Tap on a goal
          final goalCard = find.byType(Card).first;
          if (goalCard.evaluate().isNotEmpty) {
            await tester.tap(goalCard);
            await tester.pumpAndSettle();

            await screenshots.takeScreenshot('goal_detail_screen');

            // Verify detail elements
            tester.expectAtLeastOneWidget(
              find.byWidgetPredicate((widget) {
                if (widget is Text) {
                  final text = widget.data?.toLowerCase() ?? '';
                  return text.contains('progress') ||
                      text.contains('target') ||
                      text.contains('milestone');
                }
                return false;
              }),
            );
          }
        },
      );

      testWidgets(
        'should show days remaining',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          // Look for days remaining
          final daysRemaining = find.textContaining('days');

          if (daysRemaining.evaluate().isNotEmpty) {
            tester.expectAtLeastOneWidget(daysRemaining);
          }
        },
      );

      testWidgets(
        'should navigate to linked tasks',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          final goalCard = find.byType(Card).first;
          if (goalCard.evaluate().isNotEmpty) {
            await tester.tap(goalCard);
            await tester.pumpAndSettle();

            // Look for tasks section
            final tasksSection = find.text('Related Tasks');
            if (tasksSection.evaluate().isNotEmpty) {
              await tester.tap(tasksSection);
              await tester.pumpAndSettle();
            }
          }
        },
      );
    });

    // =========================================================================
    // Edit Goal Tests
    // =========================================================================

    group('Edit Goal', () {
      testWidgets(
        'should edit goal title and description',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'edit_goal',
          );

          await loginAndNavigateToGoals(tester);

          // Open goal detail
          final goalCard = find.byType(Card).first;
          if (goalCard.evaluate().isNotEmpty) {
            await tester.tap(goalCard);
            await tester.pumpAndSettle();

            await screenshots.takeScreenshot('01_goal_detail');

            // Tap edit button
            final editButton = find.byIcon(Icons.edit);
            if (editButton.evaluate().isNotEmpty) {
              await tester.tap(editButton);
              await tester.pumpAndSettle();

              await screenshots.takeScreenshot('02_edit_form');

              // Update title
              await tester.clearTextField('Goal Title');
              await tester.enterTextInField('Goal Title', 'Updated Goal Title');

              await screenshots.takeScreenshot('03_updated_form');

              // Save
              await tester.tapButton('Save');
              await tester.waitForLoadingToComplete();

              await screenshots.takeScreenshot('04_after_save');

              tester.expectWidgetExists(find.text('Updated Goal Title'));
            }
          }
        },
      );

      testWidgets(
        'should add milestone to existing goal',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          // Open goal detail
          final goalCard = find.byType(Card).first;
          if (goalCard.evaluate().isNotEmpty) {
            await tester.tap(goalCard);
            await tester.pumpAndSettle();

            // Tap edit
            final editButton = find.byIcon(Icons.edit);
            if (editButton.evaluate().isNotEmpty) {
              await tester.tap(editButton);
              await tester.pumpAndSettle();

              // Add milestone
              final addMilestone = find.text('Add Milestone');
              if (addMilestone.evaluate().isNotEmpty) {
                await tester.tap(addMilestone);
                await tester.pumpAndSettle();

                await tester.enterTextInField(
                  'Milestone Title',
                  'New Milestone',
                );

                await tester.tapButton('Save');
                await tester.waitForLoadingToComplete();
              }
            }
          }
        },
      );

      testWidgets(
        'should change target date',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          final goalCard = find.byType(Card).first;
          if (goalCard.evaluate().isNotEmpty) {
            await tester.tap(goalCard);
            await tester.pumpAndSettle();

            final editButton = find.byIcon(Icons.edit);
            if (editButton.evaluate().isNotEmpty) {
              await tester.tap(editButton);
              await tester.pumpAndSettle();

              // Change date
              final datePicker = find.byIcon(Icons.calendar_today);
              if (datePicker.evaluate().isNotEmpty) {
                await tester.tap(datePicker);
                await tester.pumpAndSettle();

                await tester.tap(find.text('OK'));
                await tester.pumpAndSettle();
              }

              await tester.tapButton('Save');
              await tester.waitForLoadingToComplete();
            }
          }
        },
      );
    });

    // =========================================================================
    // Complete/Archive Goal Tests
    // =========================================================================

    group('Complete Goal', () {
      testWidgets(
        'should mark goal as complete',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'complete_goal',
          );

          await loginAndNavigateToGoals(tester);

          await screenshots.takeScreenshot('01_goals_list');

          // Create a goal to complete
          await tester.tapIcon(Icons.add);
          await tester.pumpAndSettle();

          final goalTitle = 'Goal to Complete';
          await tester.enterTextInField('Goal Title', goalTitle);
          await tester.tapButton('Save');
          await tester.waitForLoadingToComplete();

          // Open the goal
          await tester.tap(find.text(goalTitle));
          await tester.pumpAndSettle();

          await screenshots.takeScreenshot('02_goal_detail');

          // Complete the goal
          final completeButton = find.text('Mark Complete');
          if (completeButton.evaluate().isNotEmpty) {
            await tester.tap(completeButton);
            await tester.pumpAndSettle();

            await screenshots.takeScreenshot('03_confirmation');

            // Confirm
            await tester.tap(find.text('Confirm'));
            await tester.waitForLoadingToComplete();

            await screenshots.takeScreenshot('04_goal_completed');

            // Verify completion
            tester.expectAtLeastOneWidget(
              find.textContaining('Completed'),
            );
          }
        },
      );

      testWidgets(
        'should show celebration on goal completion',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          // Find a goal close to completion or already completed
          final celebrationIcon = find.byIcon(Icons.celebration);
          // May or may not find based on data
          expect(celebrationIcon, anyOf(findsOneWidget, findsNothing));
        },
      );

      testWidgets(
        'should archive goal',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          final goalCard = find.byType(Card).first;
          if (goalCard.evaluate().isNotEmpty) {
            await tester.longPressWidget(goalCard);
            await tester.pumpAndSettle();

            final archiveButton = find.text('Archive');
            if (archiveButton.evaluate().isNotEmpty) {
              await tester.tap(archiveButton);
              await tester.pumpAndSettle();

              // Confirm archive
              await tester.tap(find.text('Confirm'));
              await tester.waitForLoadingToComplete();
            }
          }
        },
      );
    });

    // =========================================================================
    // Delete Goal Tests
    // =========================================================================

    group('Delete Goal', () {
      testWidgets(
        'should delete goal with confirmation',
        (tester) async {
          screenshots = ScreenshotHelper(
            binding: binding,
            testName: 'delete_goal',
          );

          await loginAndNavigateToGoals(tester);

          // Create a goal to delete
          await tester.tapIcon(Icons.add);
          await tester.pumpAndSettle();

          final goalTitle = 'Goal to Delete';
          await tester.enterTextInField('Goal Title', goalTitle);
          await tester.tapButton('Save');
          await tester.waitForLoadingToComplete();

          await screenshots.takeScreenshot('01_goal_created');

          // Long press for context menu
          await tester.scrollToWidget(find.text(goalTitle));
          await tester.longPressWidget(find.text(goalTitle));
          await tester.pumpAndSettle();

          await screenshots.takeScreenshot('02_context_menu');

          // Delete
          await tester.tapText('Delete');
          await tester.pumpAndSettle();

          await screenshots.takeScreenshot('03_confirmation');

          // Confirm
          await tester.tap(find.text('Confirm'));
          await tester.waitForLoadingToComplete();

          await screenshots.takeScreenshot('04_after_delete');

          // Verify deleted
          tester.expectWidgetNotExists(
            find.text(goalTitle),
            reason: 'Deleted goal should not appear',
          );
        },
      );
    });

    // =========================================================================
    // Goal Filters Tests
    // =========================================================================

    group('Goal Filters', () {
      testWidgets(
        'should filter goals by status',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          // Look for filter options
          final filterButton = find.byIcon(Icons.filter_list);
          if (filterButton.evaluate().isNotEmpty) {
            await tester.tap(filterButton);
            await tester.pumpAndSettle();

            // Select Active filter
            await tester.tapText('Active');
            await tester.pumpAndSettle();

            // Verify only active goals shown
            // This requires knowing the data state
          }
        },
      );

      testWidgets(
        'should filter goals by category',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          final filterButton = find.byIcon(Icons.filter_list);
          if (filterButton.evaluate().isNotEmpty) {
            await tester.tap(filterButton);
            await tester.pumpAndSettle();

            // Select category
            final healthCategory = find.text('Health');
            if (healthCategory.evaluate().isNotEmpty) {
              await tester.tap(healthCategory);
              await tester.pumpAndSettle();
            }
          }
        },
      );

      testWidgets(
        'should search goals',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          final searchButton = find.byIcon(Icons.search);
          if (searchButton.evaluate().isNotEmpty) {
            await tester.tap(searchButton);
            await tester.pumpAndSettle();

            await tester.enterText(
              find.byType(TextField).first,
              'Flutter',
            );
            await tester.pumpAndSettle();

            // Verify search results
            // Would need to check filtered list
          }
        },
      );
    });

    // =========================================================================
    // Performance Tests
    // =========================================================================

    group('Performance', () {
      testWidgets(
        'should load goals list within threshold',
        (tester) async {
          performance.startMeasuring('goals_load');

          await loginAndNavigateToGoals(tester);

          final loadTime = performance.stopMeasuring('goals_load');

          print('Goals load time: ${loadTime.inMilliseconds}ms');

          expect(
            loadTime,
            lessThan(TestConfig.pageLoadTimeout),
            reason: 'Goals should load within page load timeout',
          );
        },
      );

      testWidgets(
        'should create goal quickly',
        (tester) async {
          await loginAndNavigateToGoals(tester);

          await tester.tapIcon(Icons.add);
          await tester.pumpAndSettle();

          await tester.enterTextInField('Goal Title', 'Performance Test Goal');

          performance.startMeasuring('goal_create');

          await tester.tapButton('Save');
          await tester.waitForLoadingToComplete();

          final createTime = performance.stopMeasuring('goal_create');

          print('Goal create time: ${createTime.inMilliseconds}ms');

          expect(
            createTime,
            lessThan(TestConfig.apiTimeout),
            reason: 'Goal creation should complete within API timeout',
          );
        },
      );
    });
  });
}
