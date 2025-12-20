// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subscription_tier_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Provider for fetching public subscription tiers.
///
/// Automatically fetches tiers on first access and caches them.
/// Use `ref.invalidate(publicTiersProvider)` to force refresh.

@ProviderFor(publicTiers)
const publicTiersProvider = PublicTiersProvider._();

/// Provider for fetching public subscription tiers.
///
/// Automatically fetches tiers on first access and caches them.
/// Use `ref.invalidate(publicTiersProvider)` to force refresh.

final class PublicTiersProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<SubscriptionTier>>,
          List<SubscriptionTier>,
          FutureOr<List<SubscriptionTier>>
        >
    with
        $FutureModifier<List<SubscriptionTier>>,
        $FutureProvider<List<SubscriptionTier>> {
  /// Provider for fetching public subscription tiers.
  ///
  /// Automatically fetches tiers on first access and caches them.
  /// Use `ref.invalidate(publicTiersProvider)` to force refresh.
  const PublicTiersProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'publicTiersProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$publicTiersHash();

  @$internal
  @override
  $FutureProviderElement<List<SubscriptionTier>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<SubscriptionTier>> create(Ref ref) {
    return publicTiers(ref);
  }
}

String _$publicTiersHash() => r'9a2dfe6de93f8e998e8d0c5c2f0a615bf52fdc9c';

/// Provider for a specific tier by name

@ProviderFor(tierByName)
const tierByNameProvider = TierByNameFamily._();

/// Provider for a specific tier by name

final class TierByNameProvider
    extends
        $FunctionalProvider<
          AsyncValue<SubscriptionTier?>,
          SubscriptionTier?,
          FutureOr<SubscriptionTier?>
        >
    with
        $FutureModifier<SubscriptionTier?>,
        $FutureProvider<SubscriptionTier?> {
  /// Provider for a specific tier by name
  const TierByNameProvider._({
    required TierByNameFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'tierByNameProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$tierByNameHash();

  @override
  String toString() {
    return r'tierByNameProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<SubscriptionTier?> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<SubscriptionTier?> create(Ref ref) {
    final argument = this.argument as String;
    return tierByName(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is TierByNameProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$tierByNameHash() => r'd2fa136d7d271814f04df7439c957946d7288c1e';

/// Provider for a specific tier by name

final class TierByNameFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<SubscriptionTier?>, String> {
  const TierByNameFamily._()
    : super(
        retry: null,
        name: r'tierByNameProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Provider for a specific tier by name

  TierByNameProvider call(String name) =>
      TierByNameProvider._(argument: name, from: this);

  @override
  String toString() => r'tierByNameProvider';
}

/// Provider for a specific tier by ID

@ProviderFor(tierById)
const tierByIdProvider = TierByIdFamily._();

/// Provider for a specific tier by ID

final class TierByIdProvider
    extends
        $FunctionalProvider<
          AsyncValue<SubscriptionTier?>,
          SubscriptionTier?,
          FutureOr<SubscriptionTier?>
        >
    with
        $FutureModifier<SubscriptionTier?>,
        $FutureProvider<SubscriptionTier?> {
  /// Provider for a specific tier by ID
  const TierByIdProvider._({
    required TierByIdFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'tierByIdProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$tierByIdHash();

  @override
  String toString() {
    return r'tierByIdProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<SubscriptionTier?> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<SubscriptionTier?> create(Ref ref) {
    final argument = this.argument as String;
    return tierById(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is TierByIdProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$tierByIdHash() => r'0dccaa7a833d4842c8cda363dc5bce215566c098';

/// Provider for a specific tier by ID

final class TierByIdFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<SubscriptionTier?>, String> {
  const TierByIdFamily._()
    : super(
        retry: null,
        name: r'tierByIdProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Provider for a specific tier by ID

  TierByIdProvider call(String id) =>
      TierByIdProvider._(argument: id, from: this);

  @override
  String toString() => r'tierByIdProvider';
}

/// Provider for the current user's subscription status.
///
/// Returns null if user has no subscription or is not authenticated.

@ProviderFor(userSubscription)
const userSubscriptionProvider = UserSubscriptionProvider._();

/// Provider for the current user's subscription status.
///
/// Returns null if user has no subscription or is not authenticated.

final class UserSubscriptionProvider
    extends
        $FunctionalProvider<
          AsyncValue<UserSubscriptionStatus?>,
          UserSubscriptionStatus?,
          FutureOr<UserSubscriptionStatus?>
        >
    with
        $FutureModifier<UserSubscriptionStatus?>,
        $FutureProvider<UserSubscriptionStatus?> {
  /// Provider for the current user's subscription status.
  ///
  /// Returns null if user has no subscription or is not authenticated.
  const UserSubscriptionProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'userSubscriptionProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$userSubscriptionHash();

  @$internal
  @override
  $FutureProviderElement<UserSubscriptionStatus?> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<UserSubscriptionStatus?> create(Ref ref) {
    return userSubscription(ref);
  }
}

String _$userSubscriptionHash() => r'bb5637b2cc5dc5b1fa28ca6ae62eb8d4cfa9e100';

/// Provider for the current user's tier.
///
/// Returns null if user has no subscription.

@ProviderFor(currentUserTier)
const currentUserTierProvider = CurrentUserTierProvider._();

/// Provider for the current user's tier.
///
/// Returns null if user has no subscription.

final class CurrentUserTierProvider
    extends
        $FunctionalProvider<
          AsyncValue<SubscriptionTier?>,
          SubscriptionTier?,
          FutureOr<SubscriptionTier?>
        >
    with
        $FutureModifier<SubscriptionTier?>,
        $FutureProvider<SubscriptionTier?> {
  /// Provider for the current user's tier.
  ///
  /// Returns null if user has no subscription.
  const CurrentUserTierProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'currentUserTierProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$currentUserTierHash();

  @$internal
  @override
  $FutureProviderElement<SubscriptionTier?> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<SubscriptionTier?> create(Ref ref) {
    return currentUserTier(ref);
  }
}

String _$currentUserTierHash() => r'c603625e6638ed6df26a301d2e691e74c86f73ed';

/// Provider to check if user has access to a specific feature.

@ProviderFor(hasFeature)
const hasFeatureProvider = HasFeatureFamily._();

/// Provider to check if user has access to a specific feature.

final class HasFeatureProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, FutureOr<bool>>
    with $FutureModifier<bool>, $FutureProvider<bool> {
  /// Provider to check if user has access to a specific feature.
  const HasFeatureProvider._({
    required HasFeatureFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'hasFeatureProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$hasFeatureHash();

  @override
  String toString() {
    return r'hasFeatureProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<bool> create(Ref ref) {
    final argument = this.argument as String;
    return hasFeature(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is HasFeatureProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$hasFeatureHash() => r'c253f68a07863fb412fc3923eca2d1ebf80d853e';

/// Provider to check if user has access to a specific feature.

final class HasFeatureFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<bool>, String> {
  const HasFeatureFamily._()
    : super(
        retry: null,
        name: r'hasFeatureProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Provider to check if user has access to a specific feature.

  HasFeatureProvider call(String featureName) =>
      HasFeatureProvider._(argument: featureName, from: this);

  @override
  String toString() => r'hasFeatureProvider';
}

/// Provider to check if user can add more coaches.

@ProviderFor(canAddCoach)
const canAddCoachProvider = CanAddCoachFamily._();

/// Provider to check if user can add more coaches.

final class CanAddCoachProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, FutureOr<bool>>
    with $FutureModifier<bool>, $FutureProvider<bool> {
  /// Provider to check if user can add more coaches.
  const CanAddCoachProvider._({
    required CanAddCoachFamily super.from,
    required int super.argument,
  }) : super(
         retry: null,
         name: r'canAddCoachProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$canAddCoachHash();

  @override
  String toString() {
    return r'canAddCoachProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<bool> create(Ref ref) {
    final argument = this.argument as int;
    return canAddCoach(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is CanAddCoachProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$canAddCoachHash() => r'b06cd739d91c388e1f9d96649d19521690e56111';

/// Provider to check if user can add more coaches.

final class CanAddCoachFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<bool>, int> {
  const CanAddCoachFamily._()
    : super(
        retry: null,
        name: r'canAddCoachProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Provider to check if user can add more coaches.

  CanAddCoachProvider call(int currentCount) =>
      CanAddCoachProvider._(argument: currentCount, from: this);

  @override
  String toString() => r'canAddCoachProvider';
}

/// Provider to check if user can add more goals.

@ProviderFor(canAddGoal)
const canAddGoalProvider = CanAddGoalFamily._();

/// Provider to check if user can add more goals.

final class CanAddGoalProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, FutureOr<bool>>
    with $FutureModifier<bool>, $FutureProvider<bool> {
  /// Provider to check if user can add more goals.
  const CanAddGoalProvider._({
    required CanAddGoalFamily super.from,
    required int super.argument,
  }) : super(
         retry: null,
         name: r'canAddGoalProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$canAddGoalHash();

  @override
  String toString() {
    return r'canAddGoalProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<bool> create(Ref ref) {
    final argument = this.argument as int;
    return canAddGoal(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is CanAddGoalProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$canAddGoalHash() => r'0fb42c14b3a242d9cb414dc18c39cef9d37763f8';

/// Provider to check if user can add more goals.

final class CanAddGoalFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<bool>, int> {
  const CanAddGoalFamily._()
    : super(
        retry: null,
        name: r'canAddGoalProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Provider to check if user can add more goals.

  CanAddGoalProvider call(int currentCount) =>
      CanAddGoalProvider._(argument: currentCount, from: this);

  @override
  String toString() => r'canAddGoalProvider';
}

/// Provider to check if user can send more chats today.

@ProviderFor(canSendChat)
const canSendChatProvider = CanSendChatFamily._();

/// Provider to check if user can send more chats today.

final class CanSendChatProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, FutureOr<bool>>
    with $FutureModifier<bool>, $FutureProvider<bool> {
  /// Provider to check if user can send more chats today.
  const CanSendChatProvider._({
    required CanSendChatFamily super.from,
    required int super.argument,
  }) : super(
         retry: null,
         name: r'canSendChatProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$canSendChatHash();

  @override
  String toString() {
    return r'canSendChatProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<bool> create(Ref ref) {
    final argument = this.argument as int;
    return canSendChat(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is CanSendChatProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$canSendChatHash() => r'2e581e966eb4712b6938dfb43cc9a27bcf34dfdf';

/// Provider to check if user can send more chats today.

final class CanSendChatFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<bool>, int> {
  const CanSendChatFamily._()
    : super(
        retry: null,
        name: r'canSendChatProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Provider to check if user can send more chats today.

  CanSendChatProvider call(int todayCount) =>
      CanSendChatProvider._(argument: todayCount, from: this);

  @override
  String toString() => r'canSendChatProvider';
}

/// Provider for feature comparison table across all tiers.

@ProviderFor(featureComparison)
const featureComparisonProvider = FeatureComparisonProvider._();

/// Provider for feature comparison table across all tiers.

final class FeatureComparisonProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<String, Map<String, dynamic>>>,
          Map<String, Map<String, dynamic>>,
          FutureOr<Map<String, Map<String, dynamic>>>
        >
    with
        $FutureModifier<Map<String, Map<String, dynamic>>>,
        $FutureProvider<Map<String, Map<String, dynamic>>> {
  /// Provider for feature comparison table across all tiers.
  const FeatureComparisonProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'featureComparisonProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$featureComparisonHash();

  @$internal
  @override
  $FutureProviderElement<Map<String, Map<String, dynamic>>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<Map<String, Map<String, dynamic>>> create(Ref ref) {
    return featureComparison(ref);
  }
}

String _$featureComparisonHash() => r'2c9d90fd41903922ff3d5fa03c5bf348511c029f';

/// Notifier for tier selection state

@ProviderFor(TierSelection)
const tierSelectionProvider = TierSelectionProvider._();

/// Notifier for tier selection state
final class TierSelectionProvider
    extends $NotifierProvider<TierSelection, TierSelectionState> {
  /// Notifier for tier selection state
  const TierSelectionProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'tierSelectionProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$tierSelectionHash();

  @$internal
  @override
  TierSelection create() => TierSelection();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(TierSelectionState value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<TierSelectionState>(value),
    );
  }
}

String _$tierSelectionHash() => r'4ed97f95e409efb5169dcc83628ac1339a0024bd';

/// Notifier for tier selection state

abstract class _$TierSelection extends $Notifier<TierSelectionState> {
  TierSelectionState build();
  @$mustCallSuper
  @override
  void runBuild() {
    final created = build();
    final ref = this.ref as $Ref<TierSelectionState, TierSelectionState>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<TierSelectionState, TierSelectionState>,
              TierSelectionState,
              Object?,
              Object?
            >;
    element.handleValue(ref, created);
  }
}

/// Provider for managing tier cache.

@ProviderFor(TierCacheManager)
const tierCacheManagerProvider = TierCacheManagerProvider._();

/// Provider for managing tier cache.
final class TierCacheManagerProvider
    extends $NotifierProvider<TierCacheManager, void> {
  /// Provider for managing tier cache.
  const TierCacheManagerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'tierCacheManagerProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$tierCacheManagerHash();

  @$internal
  @override
  TierCacheManager create() => TierCacheManager();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(void value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<void>(value),
    );
  }
}

String _$tierCacheManagerHash() => r'b78123feec0ea2d244171f4ff6324e433dafdd34';

/// Provider for managing tier cache.

abstract class _$TierCacheManager extends $Notifier<void> {
  void build();
  @$mustCallSuper
  @override
  void runBuild() {
    build();
    final ref = this.ref as $Ref<void, void>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<void, void>,
              void,
              Object?,
              Object?
            >;
    element.handleValue(ref, null);
  }
}
