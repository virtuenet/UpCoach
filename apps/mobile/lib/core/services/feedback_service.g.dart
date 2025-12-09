// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feedback_service.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(feedbackService)
const feedbackServiceProvider = FeedbackServiceProvider._();

final class FeedbackServiceProvider
    extends
        $FunctionalProvider<FeedbackService, FeedbackService, FeedbackService>
    with $Provider<FeedbackService> {
  const FeedbackServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'feedbackServiceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$feedbackServiceHash();

  @$internal
  @override
  $ProviderElement<FeedbackService> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  FeedbackService create(Ref ref) {
    return feedbackService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(FeedbackService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<FeedbackService>(value),
    );
  }
}

String _$feedbackServiceHash() => r'7e6d3375e6e2b6deff94997d7d13561f243d4462';
