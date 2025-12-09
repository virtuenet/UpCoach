// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'content_service.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(contentService)
const contentServiceProvider = ContentServiceProvider._();

final class ContentServiceProvider
    extends $FunctionalProvider<ContentService, ContentService, ContentService>
    with $Provider<ContentService> {
  const ContentServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'contentServiceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$contentServiceHash();

  @$internal
  @override
  $ProviderElement<ContentService> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  ContentService create(Ref ref) {
    return contentService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ContentService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ContentService>(value),
    );
  }
}

String _$contentServiceHash() => r'e87c849f313c6700964249adf969afafd8a10361';
