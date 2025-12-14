// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_search_service.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Service for searching users to start conversations with

@ProviderFor(userSearchService)
const userSearchServiceProvider = UserSearchServiceProvider._();

/// Service for searching users to start conversations with

final class UserSearchServiceProvider
    extends
        $FunctionalProvider<
          UserSearchService,
          UserSearchService,
          UserSearchService
        >
    with $Provider<UserSearchService> {
  /// Service for searching users to start conversations with
  const UserSearchServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'userSearchServiceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$userSearchServiceHash();

  @$internal
  @override
  $ProviderElement<UserSearchService> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  UserSearchService create(Ref ref) {
    return userSearchService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(UserSearchService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<UserSearchService>(value),
    );
  }
}

String _$userSearchServiceHash() => r'45d9027e1e979a54ed441f0c6c880f3b1b428b60';
