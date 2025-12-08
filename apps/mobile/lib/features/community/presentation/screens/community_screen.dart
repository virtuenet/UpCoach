import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/forum_providers.dart';
import '../widgets/forum_category_card.dart';
import '../widgets/thread_list_item.dart';
import '../widgets/activity_feed_item.dart';

class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Forums'),
            Tab(text: 'Groups'),
            Tab(text: 'Activity'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              context.push('/community/search');
            },
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              context.push('/notifications');
            },
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildForumsTab(),
          _buildGroupsTab(),
          _buildActivityTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _handleCreateAction();
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildForumsTab() {
    final categoriesAsyncValue = ref.watch(forumCategoriesProvider);
    final threadsAsyncValue = ref.watch(latestThreadsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(forumCategoriesProvider);
        ref.invalidate(latestThreadsProvider);
      },
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Forum Categories
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                'Categories',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ),
            categoriesAsyncValue.when(
              data: (categories) => SizedBox(
                height: 120,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: categories.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: ForumCategoryCard(
                        category: categories[index],
                        onTap: () {
                          context.push(
                              '/community/forums/${categories[index].id}');
                        },
                      ),
                    );
                  },
                ),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Text('Error: $error'),
              ),
            ),
            const SizedBox(height: UIConstants.spacingLG),

            // Latest Threads
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Latest Discussions',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  TextButton(
                    onPressed: () {
                      context.push('/community/forums');
                    },
                    child: const Text('See All'),
                  ),
                ],
              ),
            ),
            threadsAsyncValue.when(
              data: (threads) => ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: threads.length.clamp(0, 5),
                itemBuilder: (context, index) {
                  return ThreadListItem(
                    thread: threads[index],
                    onTap: () {
                      context.push('/community/threads/${threads[index].id}');
                    },
                  );
                },
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Text('Error: $error'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGroupsTab() {
    final groupsAsyncValue = ref.watch(communityGroupsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(communityGroupsProvider);
      },
      child: groupsAsyncValue.when(
        data: (groups) => ListView.builder(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          itemCount: groups.length,
          itemBuilder: (context, index) {
            final group = groups[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundImage: group.avatarUrl != null
                      ? NetworkImage(group.avatarUrl!)
                      : null,
                  child: group.avatarUrl == null
                      ? Text(group.name[0].toUpperCase())
                      : null,
                ),
                title: Text(group.name),
                subtitle: Text(
                  '${group.memberCount} members • ${group.postCount} posts',
                ),
                trailing:
                    group.isPrivate ? const Icon(Icons.lock, size: 16) : null,
                onTap: () {
                  context.push('/community/groups/${group.id}');
                },
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: UIConstants.spacingMD),
              Text('Failed to load groups: $error'),
              const SizedBox(height: UIConstants.spacingMD),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(communityGroupsProvider);
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActivityTab() {
    final activityAsyncValue = ref.watch(activityFeedProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(activityFeedProvider);
      },
      child: activityAsyncValue.when(
        data: (activities) => ListView.builder(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          itemCount: activities.length,
          itemBuilder: (context, index) {
            return ActivityFeedItemCard(
              activity: activities[index],
              onUserTap: (userId) {
                context.push('/profile/$userId');
              },
              onContentTap: (type, id) {
                switch (type) {
                  case 'thread':
                    context.push('/community/threads/$id');
                    break;
                  case 'group':
                    context.push('/community/groups/$id');
                    break;
                  case 'goal':
                    context.push('/goals/$id');
                    break;
                }
              },
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
    );
  }

  void _handleCreateAction() {
    final currentIndex = _tabController.index;
    switch (currentIndex) {
      case 0: // Forums
        context.push('/community/threads/create');
        break;
      case 1: // Groups
        context.push('/community/groups/create');
        break;
      case 2: // Activity
        // No create action for activity feed
        break;
    }
  }
}
