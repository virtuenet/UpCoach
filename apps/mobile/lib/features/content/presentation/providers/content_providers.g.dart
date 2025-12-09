// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'content_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(articleDetail)
const articleDetailProvider = ArticleDetailFamily._();

final class ArticleDetailProvider
    extends
        $FunctionalProvider<
          AsyncValue<ContentArticle>,
          ContentArticle,
          FutureOr<ContentArticle>
        >
    with $FutureModifier<ContentArticle>, $FutureProvider<ContentArticle> {
  const ArticleDetailProvider._({
    required ArticleDetailFamily super.from,
    required int super.argument,
  }) : super(
         retry: null,
         name: r'articleDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$articleDetailHash();

  @override
  String toString() {
    return r'articleDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<ContentArticle> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<ContentArticle> create(Ref ref) {
    final argument = this.argument as int;
    return articleDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ArticleDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$articleDetailHash() => r'9c53bc3866b3297ebded5e130af9b67b60864ee7';

final class ArticleDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<ContentArticle>, int> {
  const ArticleDetailFamily._()
    : super(
        retry: null,
        name: r'articleDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ArticleDetailProvider call(int articleId) =>
      ArticleDetailProvider._(argument: articleId, from: this);

  @override
  String toString() => r'articleDetailProvider';
}

@ProviderFor(featuredArticles)
const featuredArticlesProvider = FeaturedArticlesProvider._();

final class FeaturedArticlesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ContentArticle>>,
          List<ContentArticle>,
          FutureOr<List<ContentArticle>>
        >
    with
        $FutureModifier<List<ContentArticle>>,
        $FutureProvider<List<ContentArticle>> {
  const FeaturedArticlesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'featuredArticlesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$featuredArticlesHash();

  @$internal
  @override
  $FutureProviderElement<List<ContentArticle>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<ContentArticle>> create(Ref ref) {
    return featuredArticles(ref);
  }
}

String _$featuredArticlesHash() => r'69bac680f541b73a0eceb9b0e1c24fc0161fa2de';

@ProviderFor(categories)
const categoriesProvider = CategoriesProvider._();

final class CategoriesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ContentCategory>>,
          List<ContentCategory>,
          FutureOr<List<ContentCategory>>
        >
    with
        $FutureModifier<List<ContentCategory>>,
        $FutureProvider<List<ContentCategory>> {
  const CategoriesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'categoriesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$categoriesHash();

  @$internal
  @override
  $FutureProviderElement<List<ContentCategory>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<ContentCategory>> create(Ref ref) {
    return categories(ref);
  }
}

String _$categoriesHash() => r'bacd95a62cb4afa807e880a5de56efbb642ea7da';

@ProviderFor(relatedArticles)
const relatedArticlesProvider = RelatedArticlesFamily._();

final class RelatedArticlesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ContentArticle>>,
          List<ContentArticle>,
          FutureOr<List<ContentArticle>>
        >
    with
        $FutureModifier<List<ContentArticle>>,
        $FutureProvider<List<ContentArticle>> {
  const RelatedArticlesProvider._({
    required RelatedArticlesFamily super.from,
    required int super.argument,
  }) : super(
         retry: null,
         name: r'relatedArticlesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$relatedArticlesHash();

  @override
  String toString() {
    return r'relatedArticlesProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<List<ContentArticle>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<ContentArticle>> create(Ref ref) {
    final argument = this.argument as int;
    return relatedArticles(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is RelatedArticlesProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$relatedArticlesHash() => r'029b2baea2c3a170bfd6185ac0a1e6ac45347623';

final class RelatedArticlesFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<ContentArticle>>, int> {
  const RelatedArticlesFamily._()
    : super(
        retry: null,
        name: r'relatedArticlesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  RelatedArticlesProvider call(int articleId) =>
      RelatedArticlesProvider._(argument: articleId, from: this);

  @override
  String toString() => r'relatedArticlesProvider';
}

@ProviderFor(coachArticles)
const coachArticlesProvider = CoachArticlesFamily._();

final class CoachArticlesProvider
    extends
        $FunctionalProvider<
          AsyncValue<ArticleListResponse>,
          ArticleListResponse,
          FutureOr<ArticleListResponse>
        >
    with
        $FutureModifier<ArticleListResponse>,
        $FutureProvider<ArticleListResponse> {
  const CoachArticlesProvider._({
    required CoachArticlesFamily super.from,
    required (int, {int page}) super.argument,
  }) : super(
         retry: null,
         name: r'coachArticlesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$coachArticlesHash();

  @override
  String toString() {
    return r'coachArticlesProvider'
        ''
        '$argument';
  }

  @$internal
  @override
  $FutureProviderElement<ArticleListResponse> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<ArticleListResponse> create(Ref ref) {
    final argument = this.argument as (int, {int page});
    return coachArticles(ref, argument.$1, page: argument.page);
  }

  @override
  bool operator ==(Object other) {
    return other is CoachArticlesProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$coachArticlesHash() => r'd93e802fad54cf3c543cf1e66763eb9e7d748cbe';

final class CoachArticlesFamily extends $Family
    with
        $FunctionalFamilyOverride<
          FutureOr<ArticleListResponse>,
          (int, {int page})
        > {
  const CoachArticlesFamily._()
    : super(
        retry: null,
        name: r'coachArticlesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  CoachArticlesProvider call(int coachId, {int page = 1}) =>
      CoachArticlesProvider._(argument: (coachId, page: page), from: this);

  @override
  String toString() => r'coachArticlesProvider';
}

@ProviderFor(SavedArticles)
const savedArticlesProvider = SavedArticlesProvider._();

final class SavedArticlesProvider
    extends $AsyncNotifierProvider<SavedArticles, List<ContentArticle>> {
  const SavedArticlesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'savedArticlesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$savedArticlesHash();

  @$internal
  @override
  SavedArticles create() => SavedArticles();
}

String _$savedArticlesHash() => r'07e8a4d1405d77ef1fea0e2b8cc7ad358d0bcc55';

abstract class _$SavedArticles extends $AsyncNotifier<List<ContentArticle>> {
  FutureOr<List<ContentArticle>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final created = build();
    final ref =
        this.ref
            as $Ref<AsyncValue<List<ContentArticle>>, List<ContentArticle>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<List<ContentArticle>>,
                List<ContentArticle>
              >,
              AsyncValue<List<ContentArticle>>,
              Object?,
              Object?
            >;
    element.handleValue(ref, created);
  }
}
