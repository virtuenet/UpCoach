// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'content_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$articleDetailHash() => r'9c53bc3866b3297ebded5e130af9b67b60864ee7';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// See also [articleDetail].
@ProviderFor(articleDetail)
const articleDetailProvider = ArticleDetailFamily();

/// See also [articleDetail].
class ArticleDetailFamily extends Family<AsyncValue<ContentArticle>> {
  /// See also [articleDetail].
  const ArticleDetailFamily();

  /// See also [articleDetail].
  ArticleDetailProvider call(
    int articleId,
  ) {
    return ArticleDetailProvider(
      articleId,
    );
  }

  @override
  ArticleDetailProvider getProviderOverride(
    covariant ArticleDetailProvider provider,
  ) {
    return call(
      provider.articleId,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'articleDetailProvider';
}

/// See also [articleDetail].
class ArticleDetailProvider extends AutoDisposeFutureProvider<ContentArticle> {
  /// See also [articleDetail].
  ArticleDetailProvider(
    int articleId,
  ) : this._internal(
          (ref) => articleDetail(
            ref as ArticleDetailRef,
            articleId,
          ),
          from: articleDetailProvider,
          name: r'articleDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$articleDetailHash,
          dependencies: ArticleDetailFamily._dependencies,
          allTransitiveDependencies:
              ArticleDetailFamily._allTransitiveDependencies,
          articleId: articleId,
        );

  ArticleDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.articleId,
  }) : super.internal();

  final int articleId;

  @override
  Override overrideWith(
    FutureOr<ContentArticle> Function(ArticleDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: ArticleDetailProvider._internal(
        (ref) => create(ref as ArticleDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        articleId: articleId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<ContentArticle> createElement() {
    return _ArticleDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ArticleDetailProvider && other.articleId == articleId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, articleId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin ArticleDetailRef on AutoDisposeFutureProviderRef<ContentArticle> {
  /// The parameter `articleId` of this provider.
  int get articleId;
}

class _ArticleDetailProviderElement
    extends AutoDisposeFutureProviderElement<ContentArticle>
    with ArticleDetailRef {
  _ArticleDetailProviderElement(super.provider);

  @override
  int get articleId => (origin as ArticleDetailProvider).articleId;
}

String _$featuredArticlesHash() => r'69bac680f541b73a0eceb9b0e1c24fc0161fa2de';

/// See also [featuredArticles].
@ProviderFor(featuredArticles)
final featuredArticlesProvider =
    AutoDisposeFutureProvider<List<ContentArticle>>.internal(
  featuredArticles,
  name: r'featuredArticlesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$featuredArticlesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef FeaturedArticlesRef
    = AutoDisposeFutureProviderRef<List<ContentArticle>>;
String _$categoriesHash() => r'bacd95a62cb4afa807e880a5de56efbb642ea7da';

/// See also [categories].
@ProviderFor(categories)
final categoriesProvider =
    AutoDisposeFutureProvider<List<ContentCategory>>.internal(
  categories,
  name: r'categoriesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$categoriesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef CategoriesRef = AutoDisposeFutureProviderRef<List<ContentCategory>>;
String _$relatedArticlesHash() => r'029b2baea2c3a170bfd6185ac0a1e6ac45347623';

/// See also [relatedArticles].
@ProviderFor(relatedArticles)
const relatedArticlesProvider = RelatedArticlesFamily();

/// See also [relatedArticles].
class RelatedArticlesFamily extends Family<AsyncValue<List<ContentArticle>>> {
  /// See also [relatedArticles].
  const RelatedArticlesFamily();

  /// See also [relatedArticles].
  RelatedArticlesProvider call(
    int articleId,
  ) {
    return RelatedArticlesProvider(
      articleId,
    );
  }

  @override
  RelatedArticlesProvider getProviderOverride(
    covariant RelatedArticlesProvider provider,
  ) {
    return call(
      provider.articleId,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'relatedArticlesProvider';
}

/// See also [relatedArticles].
class RelatedArticlesProvider
    extends AutoDisposeFutureProvider<List<ContentArticle>> {
  /// See also [relatedArticles].
  RelatedArticlesProvider(
    int articleId,
  ) : this._internal(
          (ref) => relatedArticles(
            ref as RelatedArticlesRef,
            articleId,
          ),
          from: relatedArticlesProvider,
          name: r'relatedArticlesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$relatedArticlesHash,
          dependencies: RelatedArticlesFamily._dependencies,
          allTransitiveDependencies:
              RelatedArticlesFamily._allTransitiveDependencies,
          articleId: articleId,
        );

  RelatedArticlesProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.articleId,
  }) : super.internal();

  final int articleId;

  @override
  Override overrideWith(
    FutureOr<List<ContentArticle>> Function(RelatedArticlesRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: RelatedArticlesProvider._internal(
        (ref) => create(ref as RelatedArticlesRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        articleId: articleId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<ContentArticle>> createElement() {
    return _RelatedArticlesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is RelatedArticlesProvider && other.articleId == articleId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, articleId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin RelatedArticlesRef on AutoDisposeFutureProviderRef<List<ContentArticle>> {
  /// The parameter `articleId` of this provider.
  int get articleId;
}

class _RelatedArticlesProviderElement
    extends AutoDisposeFutureProviderElement<List<ContentArticle>>
    with RelatedArticlesRef {
  _RelatedArticlesProviderElement(super.provider);

  @override
  int get articleId => (origin as RelatedArticlesProvider).articleId;
}

String _$coachArticlesHash() => r'd93e802fad54cf3c543cf1e66763eb9e7d748cbe';

/// See also [coachArticles].
@ProviderFor(coachArticles)
const coachArticlesProvider = CoachArticlesFamily();

/// See also [coachArticles].
class CoachArticlesFamily extends Family<AsyncValue<ArticleListResponse>> {
  /// See also [coachArticles].
  const CoachArticlesFamily();

  /// See also [coachArticles].
  CoachArticlesProvider call(
    int coachId, {
    int page = 1,
  }) {
    return CoachArticlesProvider(
      coachId,
      page: page,
    );
  }

  @override
  CoachArticlesProvider getProviderOverride(
    covariant CoachArticlesProvider provider,
  ) {
    return call(
      provider.coachId,
      page: provider.page,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'coachArticlesProvider';
}

/// See also [coachArticles].
class CoachArticlesProvider
    extends AutoDisposeFutureProvider<ArticleListResponse> {
  /// See also [coachArticles].
  CoachArticlesProvider(
    int coachId, {
    int page = 1,
  }) : this._internal(
          (ref) => coachArticles(
            ref as CoachArticlesRef,
            coachId,
            page: page,
          ),
          from: coachArticlesProvider,
          name: r'coachArticlesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$coachArticlesHash,
          dependencies: CoachArticlesFamily._dependencies,
          allTransitiveDependencies:
              CoachArticlesFamily._allTransitiveDependencies,
          coachId: coachId,
          page: page,
        );

  CoachArticlesProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.coachId,
    required this.page,
  }) : super.internal();

  final int coachId;
  final int page;

  @override
  Override overrideWith(
    FutureOr<ArticleListResponse> Function(CoachArticlesRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: CoachArticlesProvider._internal(
        (ref) => create(ref as CoachArticlesRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        coachId: coachId,
        page: page,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<ArticleListResponse> createElement() {
    return _CoachArticlesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is CoachArticlesProvider &&
        other.coachId == coachId &&
        other.page == page;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, coachId.hashCode);
    hash = _SystemHash.combine(hash, page.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin CoachArticlesRef on AutoDisposeFutureProviderRef<ArticleListResponse> {
  /// The parameter `coachId` of this provider.
  int get coachId;

  /// The parameter `page` of this provider.
  int get page;
}

class _CoachArticlesProviderElement
    extends AutoDisposeFutureProviderElement<ArticleListResponse>
    with CoachArticlesRef {
  _CoachArticlesProviderElement(super.provider);

  @override
  int get coachId => (origin as CoachArticlesProvider).coachId;
  @override
  int get page => (origin as CoachArticlesProvider).page;
}

String _$savedArticlesHash() => r'07e8a4d1405d77ef1fea0e2b8cc7ad358d0bcc55';

/// See also [SavedArticles].
@ProviderFor(SavedArticles)
final savedArticlesProvider = AutoDisposeAsyncNotifierProvider<SavedArticles,
    List<ContentArticle>>.internal(
  SavedArticles.new,
  name: r'savedArticlesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$savedArticlesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$SavedArticles = AutoDisposeAsyncNotifier<List<ContentArticle>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
