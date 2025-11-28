// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'content_article.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ContentArticle _$ContentArticleFromJson(Map<String, dynamic> json) {
  return _ContentArticle.fromJson(json);
}

/// @nodoc
mixin _$ContentArticle {
  int get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String get summary => throw _privateConstructorUsedError;
  ContentBody get content => throw _privateConstructorUsedError;
  String? get featuredImage => throw _privateConstructorUsedError;
  ContentCategory get category => throw _privateConstructorUsedError;
  List<String> get tags => throw _privateConstructorUsedError;
  ContentAuthor get author => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  DateTime? get publishedAt => throw _privateConstructorUsedError;
  int get viewCount => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime get updatedAt => throw _privateConstructorUsedError;
  String? get seoTitle => throw _privateConstructorUsedError;
  String? get seoDescription => throw _privateConstructorUsedError;
  List<String>? get seoKeywords => throw _privateConstructorUsedError;
  Map<String, dynamic>? get metadata => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ContentArticleCopyWith<ContentArticle> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ContentArticleCopyWith<$Res> {
  factory $ContentArticleCopyWith(
          ContentArticle value, $Res Function(ContentArticle) then) =
      _$ContentArticleCopyWithImpl<$Res, ContentArticle>;
  @useResult
  $Res call(
      {int id,
      String title,
      String slug,
      String summary,
      ContentBody content,
      String? featuredImage,
      ContentCategory category,
      List<String> tags,
      ContentAuthor author,
      String status,
      DateTime? publishedAt,
      int viewCount,
      DateTime createdAt,
      DateTime updatedAt,
      String? seoTitle,
      String? seoDescription,
      List<String>? seoKeywords,
      Map<String, dynamic>? metadata});

  $ContentBodyCopyWith<$Res> get content;
  $ContentCategoryCopyWith<$Res> get category;
  $ContentAuthorCopyWith<$Res> get author;
}

/// @nodoc
class _$ContentArticleCopyWithImpl<$Res, $Val extends ContentArticle>
    implements $ContentArticleCopyWith<$Res> {
  _$ContentArticleCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? slug = null,
    Object? summary = null,
    Object? content = null,
    Object? featuredImage = freezed,
    Object? category = null,
    Object? tags = null,
    Object? author = null,
    Object? status = null,
    Object? publishedAt = freezed,
    Object? viewCount = null,
    Object? createdAt = null,
    Object? updatedAt = null,
    Object? seoTitle = freezed,
    Object? seoDescription = freezed,
    Object? seoKeywords = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      summary: null == summary
          ? _value.summary
          : summary // ignore: cast_nullable_to_non_nullable
              as String,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as ContentBody,
      featuredImage: freezed == featuredImage
          ? _value.featuredImage
          : featuredImage // ignore: cast_nullable_to_non_nullable
              as String?,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as ContentCategory,
      tags: null == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      author: null == author
          ? _value.author
          : author // ignore: cast_nullable_to_non_nullable
              as ContentAuthor,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      publishedAt: freezed == publishedAt
          ? _value.publishedAt
          : publishedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      viewCount: null == viewCount
          ? _value.viewCount
          : viewCount // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: null == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      seoTitle: freezed == seoTitle
          ? _value.seoTitle
          : seoTitle // ignore: cast_nullable_to_non_nullable
              as String?,
      seoDescription: freezed == seoDescription
          ? _value.seoDescription
          : seoDescription // ignore: cast_nullable_to_non_nullable
              as String?,
      seoKeywords: freezed == seoKeywords
          ? _value.seoKeywords
          : seoKeywords // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $ContentBodyCopyWith<$Res> get content {
    return $ContentBodyCopyWith<$Res>(_value.content, (value) {
      return _then(_value.copyWith(content: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ContentCategoryCopyWith<$Res> get category {
    return $ContentCategoryCopyWith<$Res>(_value.category, (value) {
      return _then(_value.copyWith(category: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ContentAuthorCopyWith<$Res> get author {
    return $ContentAuthorCopyWith<$Res>(_value.author, (value) {
      return _then(_value.copyWith(author: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ContentArticleImplCopyWith<$Res>
    implements $ContentArticleCopyWith<$Res> {
  factory _$$ContentArticleImplCopyWith(_$ContentArticleImpl value,
          $Res Function(_$ContentArticleImpl) then) =
      __$$ContentArticleImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String title,
      String slug,
      String summary,
      ContentBody content,
      String? featuredImage,
      ContentCategory category,
      List<String> tags,
      ContentAuthor author,
      String status,
      DateTime? publishedAt,
      int viewCount,
      DateTime createdAt,
      DateTime updatedAt,
      String? seoTitle,
      String? seoDescription,
      List<String>? seoKeywords,
      Map<String, dynamic>? metadata});

  @override
  $ContentBodyCopyWith<$Res> get content;
  @override
  $ContentCategoryCopyWith<$Res> get category;
  @override
  $ContentAuthorCopyWith<$Res> get author;
}

/// @nodoc
class __$$ContentArticleImplCopyWithImpl<$Res>
    extends _$ContentArticleCopyWithImpl<$Res, _$ContentArticleImpl>
    implements _$$ContentArticleImplCopyWith<$Res> {
  __$$ContentArticleImplCopyWithImpl(
      _$ContentArticleImpl _value, $Res Function(_$ContentArticleImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? slug = null,
    Object? summary = null,
    Object? content = null,
    Object? featuredImage = freezed,
    Object? category = null,
    Object? tags = null,
    Object? author = null,
    Object? status = null,
    Object? publishedAt = freezed,
    Object? viewCount = null,
    Object? createdAt = null,
    Object? updatedAt = null,
    Object? seoTitle = freezed,
    Object? seoDescription = freezed,
    Object? seoKeywords = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_$ContentArticleImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      summary: null == summary
          ? _value.summary
          : summary // ignore: cast_nullable_to_non_nullable
              as String,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as ContentBody,
      featuredImage: freezed == featuredImage
          ? _value.featuredImage
          : featuredImage // ignore: cast_nullable_to_non_nullable
              as String?,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as ContentCategory,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      author: null == author
          ? _value.author
          : author // ignore: cast_nullable_to_non_nullable
              as ContentAuthor,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      publishedAt: freezed == publishedAt
          ? _value.publishedAt
          : publishedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      viewCount: null == viewCount
          ? _value.viewCount
          : viewCount // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: null == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      seoTitle: freezed == seoTitle
          ? _value.seoTitle
          : seoTitle // ignore: cast_nullable_to_non_nullable
              as String?,
      seoDescription: freezed == seoDescription
          ? _value.seoDescription
          : seoDescription // ignore: cast_nullable_to_non_nullable
              as String?,
      seoKeywords: freezed == seoKeywords
          ? _value._seoKeywords
          : seoKeywords // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ContentArticleImpl implements _ContentArticle {
  const _$ContentArticleImpl(
      {required this.id,
      required this.title,
      required this.slug,
      required this.summary,
      required this.content,
      this.featuredImage,
      required this.category,
      required final List<String> tags,
      required this.author,
      required this.status,
      this.publishedAt,
      required this.viewCount,
      required this.createdAt,
      required this.updatedAt,
      this.seoTitle,
      this.seoDescription,
      final List<String>? seoKeywords,
      final Map<String, dynamic>? metadata})
      : _tags = tags,
        _seoKeywords = seoKeywords,
        _metadata = metadata;

  factory _$ContentArticleImpl.fromJson(Map<String, dynamic> json) =>
      _$$ContentArticleImplFromJson(json);

  @override
  final int id;
  @override
  final String title;
  @override
  final String slug;
  @override
  final String summary;
  @override
  final ContentBody content;
  @override
  final String? featuredImage;
  @override
  final ContentCategory category;
  final List<String> _tags;
  @override
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  final ContentAuthor author;
  @override
  final String status;
  @override
  final DateTime? publishedAt;
  @override
  final int viewCount;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  final String? seoTitle;
  @override
  final String? seoDescription;
  final List<String>? _seoKeywords;
  @override
  List<String>? get seoKeywords {
    final value = _seoKeywords;
    if (value == null) return null;
    if (_seoKeywords is EqualUnmodifiableListView) return _seoKeywords;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final Map<String, dynamic>? _metadata;
  @override
  Map<String, dynamic>? get metadata {
    final value = _metadata;
    if (value == null) return null;
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'ContentArticle(id: $id, title: $title, slug: $slug, summary: $summary, content: $content, featuredImage: $featuredImage, category: $category, tags: $tags, author: $author, status: $status, publishedAt: $publishedAt, viewCount: $viewCount, createdAt: $createdAt, updatedAt: $updatedAt, seoTitle: $seoTitle, seoDescription: $seoDescription, seoKeywords: $seoKeywords, metadata: $metadata)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ContentArticleImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.summary, summary) || other.summary == summary) &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.featuredImage, featuredImage) ||
                other.featuredImage == featuredImage) &&
            (identical(other.category, category) ||
                other.category == category) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.author, author) || other.author == author) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.publishedAt, publishedAt) ||
                other.publishedAt == publishedAt) &&
            (identical(other.viewCount, viewCount) ||
                other.viewCount == viewCount) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.seoTitle, seoTitle) ||
                other.seoTitle == seoTitle) &&
            (identical(other.seoDescription, seoDescription) ||
                other.seoDescription == seoDescription) &&
            const DeepCollectionEquality()
                .equals(other._seoKeywords, _seoKeywords) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      title,
      slug,
      summary,
      content,
      featuredImage,
      category,
      const DeepCollectionEquality().hash(_tags),
      author,
      status,
      publishedAt,
      viewCount,
      createdAt,
      updatedAt,
      seoTitle,
      seoDescription,
      const DeepCollectionEquality().hash(_seoKeywords),
      const DeepCollectionEquality().hash(_metadata));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ContentArticleImplCopyWith<_$ContentArticleImpl> get copyWith =>
      __$$ContentArticleImplCopyWithImpl<_$ContentArticleImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ContentArticleImplToJson(
      this,
    );
  }
}

abstract class _ContentArticle implements ContentArticle {
  const factory _ContentArticle(
      {required final int id,
      required final String title,
      required final String slug,
      required final String summary,
      required final ContentBody content,
      final String? featuredImage,
      required final ContentCategory category,
      required final List<String> tags,
      required final ContentAuthor author,
      required final String status,
      final DateTime? publishedAt,
      required final int viewCount,
      required final DateTime createdAt,
      required final DateTime updatedAt,
      final String? seoTitle,
      final String? seoDescription,
      final List<String>? seoKeywords,
      final Map<String, dynamic>? metadata}) = _$ContentArticleImpl;

  factory _ContentArticle.fromJson(Map<String, dynamic> json) =
      _$ContentArticleImpl.fromJson;

  @override
  int get id;
  @override
  String get title;
  @override
  String get slug;
  @override
  String get summary;
  @override
  ContentBody get content;
  @override
  String? get featuredImage;
  @override
  ContentCategory get category;
  @override
  List<String> get tags;
  @override
  ContentAuthor get author;
  @override
  String get status;
  @override
  DateTime? get publishedAt;
  @override
  int get viewCount;
  @override
  DateTime get createdAt;
  @override
  DateTime get updatedAt;
  @override
  String? get seoTitle;
  @override
  String? get seoDescription;
  @override
  List<String>? get seoKeywords;
  @override
  Map<String, dynamic>? get metadata;
  @override
  @JsonKey(ignore: true)
  _$$ContentArticleImplCopyWith<_$ContentArticleImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ContentBody _$ContentBodyFromJson(Map<String, dynamic> json) {
  return _ContentBody.fromJson(json);
}

/// @nodoc
mixin _$ContentBody {
  String get format => throw _privateConstructorUsedError;
  String get body => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ContentBodyCopyWith<ContentBody> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ContentBodyCopyWith<$Res> {
  factory $ContentBodyCopyWith(
          ContentBody value, $Res Function(ContentBody) then) =
      _$ContentBodyCopyWithImpl<$Res, ContentBody>;
  @useResult
  $Res call({String format, String body});
}

/// @nodoc
class _$ContentBodyCopyWithImpl<$Res, $Val extends ContentBody>
    implements $ContentBodyCopyWith<$Res> {
  _$ContentBodyCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? format = null,
    Object? body = null,
  }) {
    return _then(_value.copyWith(
      format: null == format
          ? _value.format
          : format // ignore: cast_nullable_to_non_nullable
              as String,
      body: null == body
          ? _value.body
          : body // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ContentBodyImplCopyWith<$Res>
    implements $ContentBodyCopyWith<$Res> {
  factory _$$ContentBodyImplCopyWith(
          _$ContentBodyImpl value, $Res Function(_$ContentBodyImpl) then) =
      __$$ContentBodyImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String format, String body});
}

/// @nodoc
class __$$ContentBodyImplCopyWithImpl<$Res>
    extends _$ContentBodyCopyWithImpl<$Res, _$ContentBodyImpl>
    implements _$$ContentBodyImplCopyWith<$Res> {
  __$$ContentBodyImplCopyWithImpl(
      _$ContentBodyImpl _value, $Res Function(_$ContentBodyImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? format = null,
    Object? body = null,
  }) {
    return _then(_$ContentBodyImpl(
      format: null == format
          ? _value.format
          : format // ignore: cast_nullable_to_non_nullable
              as String,
      body: null == body
          ? _value.body
          : body // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ContentBodyImpl implements _ContentBody {
  const _$ContentBodyImpl({required this.format, required this.body});

  factory _$ContentBodyImpl.fromJson(Map<String, dynamic> json) =>
      _$$ContentBodyImplFromJson(json);

  @override
  final String format;
  @override
  final String body;

  @override
  String toString() {
    return 'ContentBody(format: $format, body: $body)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ContentBodyImpl &&
            (identical(other.format, format) || other.format == format) &&
            (identical(other.body, body) || other.body == body));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, format, body);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ContentBodyImplCopyWith<_$ContentBodyImpl> get copyWith =>
      __$$ContentBodyImplCopyWithImpl<_$ContentBodyImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ContentBodyImplToJson(
      this,
    );
  }
}

abstract class _ContentBody implements ContentBody {
  const factory _ContentBody(
      {required final String format,
      required final String body}) = _$ContentBodyImpl;

  factory _ContentBody.fromJson(Map<String, dynamic> json) =
      _$ContentBodyImpl.fromJson;

  @override
  String get format;
  @override
  String get body;
  @override
  @JsonKey(ignore: true)
  _$$ContentBodyImplCopyWith<_$ContentBodyImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ContentCategory _$ContentCategoryFromJson(Map<String, dynamic> json) {
  return _ContentCategory.fromJson(json);
}

/// @nodoc
mixin _$ContentCategory {
  int get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  String? get icon => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ContentCategoryCopyWith<ContentCategory> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ContentCategoryCopyWith<$Res> {
  factory $ContentCategoryCopyWith(
          ContentCategory value, $Res Function(ContentCategory) then) =
      _$ContentCategoryCopyWithImpl<$Res, ContentCategory>;
  @useResult
  $Res call(
      {int id, String name, String slug, String? description, String? icon});
}

/// @nodoc
class _$ContentCategoryCopyWithImpl<$Res, $Val extends ContentCategory>
    implements $ContentCategoryCopyWith<$Res> {
  _$ContentCategoryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? slug = null,
    Object? description = freezed,
    Object? icon = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      icon: freezed == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ContentCategoryImplCopyWith<$Res>
    implements $ContentCategoryCopyWith<$Res> {
  factory _$$ContentCategoryImplCopyWith(_$ContentCategoryImpl value,
          $Res Function(_$ContentCategoryImpl) then) =
      __$$ContentCategoryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id, String name, String slug, String? description, String? icon});
}

/// @nodoc
class __$$ContentCategoryImplCopyWithImpl<$Res>
    extends _$ContentCategoryCopyWithImpl<$Res, _$ContentCategoryImpl>
    implements _$$ContentCategoryImplCopyWith<$Res> {
  __$$ContentCategoryImplCopyWithImpl(
      _$ContentCategoryImpl _value, $Res Function(_$ContentCategoryImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? slug = null,
    Object? description = freezed,
    Object? icon = freezed,
  }) {
    return _then(_$ContentCategoryImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      icon: freezed == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ContentCategoryImpl implements _ContentCategory {
  const _$ContentCategoryImpl(
      {required this.id,
      required this.name,
      required this.slug,
      this.description,
      this.icon});

  factory _$ContentCategoryImpl.fromJson(Map<String, dynamic> json) =>
      _$$ContentCategoryImplFromJson(json);

  @override
  final int id;
  @override
  final String name;
  @override
  final String slug;
  @override
  final String? description;
  @override
  final String? icon;

  @override
  String toString() {
    return 'ContentCategory(id: $id, name: $name, slug: $slug, description: $description, icon: $icon)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ContentCategoryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.icon, icon) || other.icon == icon));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, id, name, slug, description, icon);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ContentCategoryImplCopyWith<_$ContentCategoryImpl> get copyWith =>
      __$$ContentCategoryImplCopyWithImpl<_$ContentCategoryImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ContentCategoryImplToJson(
      this,
    );
  }
}

abstract class _ContentCategory implements ContentCategory {
  const factory _ContentCategory(
      {required final int id,
      required final String name,
      required final String slug,
      final String? description,
      final String? icon}) = _$ContentCategoryImpl;

  factory _ContentCategory.fromJson(Map<String, dynamic> json) =
      _$ContentCategoryImpl.fromJson;

  @override
  int get id;
  @override
  String get name;
  @override
  String get slug;
  @override
  String? get description;
  @override
  String? get icon;
  @override
  @JsonKey(ignore: true)
  _$$ContentCategoryImplCopyWith<_$ContentCategoryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ContentAuthor _$ContentAuthorFromJson(Map<String, dynamic> json) {
  return _ContentAuthor.fromJson(json);
}

/// @nodoc
mixin _$ContentAuthor {
  int get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get avatar => throw _privateConstructorUsedError;
  String? get bio => throw _privateConstructorUsedError;
  String? get role => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ContentAuthorCopyWith<ContentAuthor> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ContentAuthorCopyWith<$Res> {
  factory $ContentAuthorCopyWith(
          ContentAuthor value, $Res Function(ContentAuthor) then) =
      _$ContentAuthorCopyWithImpl<$Res, ContentAuthor>;
  @useResult
  $Res call({int id, String name, String? avatar, String? bio, String? role});
}

/// @nodoc
class _$ContentAuthorCopyWithImpl<$Res, $Val extends ContentAuthor>
    implements $ContentAuthorCopyWith<$Res> {
  _$ContentAuthorCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? avatar = freezed,
    Object? bio = freezed,
    Object? role = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      avatar: freezed == avatar
          ? _value.avatar
          : avatar // ignore: cast_nullable_to_non_nullable
              as String?,
      bio: freezed == bio
          ? _value.bio
          : bio // ignore: cast_nullable_to_non_nullable
              as String?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ContentAuthorImplCopyWith<$Res>
    implements $ContentAuthorCopyWith<$Res> {
  factory _$$ContentAuthorImplCopyWith(
          _$ContentAuthorImpl value, $Res Function(_$ContentAuthorImpl) then) =
      __$$ContentAuthorImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int id, String name, String? avatar, String? bio, String? role});
}

/// @nodoc
class __$$ContentAuthorImplCopyWithImpl<$Res>
    extends _$ContentAuthorCopyWithImpl<$Res, _$ContentAuthorImpl>
    implements _$$ContentAuthorImplCopyWith<$Res> {
  __$$ContentAuthorImplCopyWithImpl(
      _$ContentAuthorImpl _value, $Res Function(_$ContentAuthorImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? avatar = freezed,
    Object? bio = freezed,
    Object? role = freezed,
  }) {
    return _then(_$ContentAuthorImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      avatar: freezed == avatar
          ? _value.avatar
          : avatar // ignore: cast_nullable_to_non_nullable
              as String?,
      bio: freezed == bio
          ? _value.bio
          : bio // ignore: cast_nullable_to_non_nullable
              as String?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ContentAuthorImpl implements _ContentAuthor {
  const _$ContentAuthorImpl(
      {required this.id, required this.name, this.avatar, this.bio, this.role});

  factory _$ContentAuthorImpl.fromJson(Map<String, dynamic> json) =>
      _$$ContentAuthorImplFromJson(json);

  @override
  final int id;
  @override
  final String name;
  @override
  final String? avatar;
  @override
  final String? bio;
  @override
  final String? role;

  @override
  String toString() {
    return 'ContentAuthor(id: $id, name: $name, avatar: $avatar, bio: $bio, role: $role)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ContentAuthorImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.avatar, avatar) || other.avatar == avatar) &&
            (identical(other.bio, bio) || other.bio == bio) &&
            (identical(other.role, role) || other.role == role));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, avatar, bio, role);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ContentAuthorImplCopyWith<_$ContentAuthorImpl> get copyWith =>
      __$$ContentAuthorImplCopyWithImpl<_$ContentAuthorImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ContentAuthorImplToJson(
      this,
    );
  }
}

abstract class _ContentAuthor implements ContentAuthor {
  const factory _ContentAuthor(
      {required final int id,
      required final String name,
      final String? avatar,
      final String? bio,
      final String? role}) = _$ContentAuthorImpl;

  factory _ContentAuthor.fromJson(Map<String, dynamic> json) =
      _$ContentAuthorImpl.fromJson;

  @override
  int get id;
  @override
  String get name;
  @override
  String? get avatar;
  @override
  String? get bio;
  @override
  String? get role;
  @override
  @JsonKey(ignore: true)
  _$$ContentAuthorImplCopyWith<_$ContentAuthorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ArticleListResponse _$ArticleListResponseFromJson(Map<String, dynamic> json) {
  return _ArticleListResponse.fromJson(json);
}

/// @nodoc
mixin _$ArticleListResponse {
  List<ContentArticle> get articles => throw _privateConstructorUsedError;
  int get total => throw _privateConstructorUsedError;
  int get pages => throw _privateConstructorUsedError;
  int get currentPage => throw _privateConstructorUsedError;
  int get perPage => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ArticleListResponseCopyWith<ArticleListResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArticleListResponseCopyWith<$Res> {
  factory $ArticleListResponseCopyWith(
          ArticleListResponse value, $Res Function(ArticleListResponse) then) =
      _$ArticleListResponseCopyWithImpl<$Res, ArticleListResponse>;
  @useResult
  $Res call(
      {List<ContentArticle> articles,
      int total,
      int pages,
      int currentPage,
      int perPage});
}

/// @nodoc
class _$ArticleListResponseCopyWithImpl<$Res, $Val extends ArticleListResponse>
    implements $ArticleListResponseCopyWith<$Res> {
  _$ArticleListResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? articles = null,
    Object? total = null,
    Object? pages = null,
    Object? currentPage = null,
    Object? perPage = null,
  }) {
    return _then(_value.copyWith(
      articles: null == articles
          ? _value.articles
          : articles // ignore: cast_nullable_to_non_nullable
              as List<ContentArticle>,
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      pages: null == pages
          ? _value.pages
          : pages // ignore: cast_nullable_to_non_nullable
              as int,
      currentPage: null == currentPage
          ? _value.currentPage
          : currentPage // ignore: cast_nullable_to_non_nullable
              as int,
      perPage: null == perPage
          ? _value.perPage
          : perPage // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ArticleListResponseImplCopyWith<$Res>
    implements $ArticleListResponseCopyWith<$Res> {
  factory _$$ArticleListResponseImplCopyWith(_$ArticleListResponseImpl value,
          $Res Function(_$ArticleListResponseImpl) then) =
      __$$ArticleListResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {List<ContentArticle> articles,
      int total,
      int pages,
      int currentPage,
      int perPage});
}

/// @nodoc
class __$$ArticleListResponseImplCopyWithImpl<$Res>
    extends _$ArticleListResponseCopyWithImpl<$Res, _$ArticleListResponseImpl>
    implements _$$ArticleListResponseImplCopyWith<$Res> {
  __$$ArticleListResponseImplCopyWithImpl(_$ArticleListResponseImpl _value,
      $Res Function(_$ArticleListResponseImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? articles = null,
    Object? total = null,
    Object? pages = null,
    Object? currentPage = null,
    Object? perPage = null,
  }) {
    return _then(_$ArticleListResponseImpl(
      articles: null == articles
          ? _value._articles
          : articles // ignore: cast_nullable_to_non_nullable
              as List<ContentArticle>,
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      pages: null == pages
          ? _value.pages
          : pages // ignore: cast_nullable_to_non_nullable
              as int,
      currentPage: null == currentPage
          ? _value.currentPage
          : currentPage // ignore: cast_nullable_to_non_nullable
              as int,
      perPage: null == perPage
          ? _value.perPage
          : perPage // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ArticleListResponseImpl implements _ArticleListResponse {
  const _$ArticleListResponseImpl(
      {required final List<ContentArticle> articles,
      required this.total,
      required this.pages,
      required this.currentPage,
      required this.perPage})
      : _articles = articles;

  factory _$ArticleListResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$ArticleListResponseImplFromJson(json);

  final List<ContentArticle> _articles;
  @override
  List<ContentArticle> get articles {
    if (_articles is EqualUnmodifiableListView) return _articles;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_articles);
  }

  @override
  final int total;
  @override
  final int pages;
  @override
  final int currentPage;
  @override
  final int perPage;

  @override
  String toString() {
    return 'ArticleListResponse(articles: $articles, total: $total, pages: $pages, currentPage: $currentPage, perPage: $perPage)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArticleListResponseImpl &&
            const DeepCollectionEquality().equals(other._articles, _articles) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.pages, pages) || other.pages == pages) &&
            (identical(other.currentPage, currentPage) ||
                other.currentPage == currentPage) &&
            (identical(other.perPage, perPage) || other.perPage == perPage));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_articles),
      total,
      pages,
      currentPage,
      perPage);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ArticleListResponseImplCopyWith<_$ArticleListResponseImpl> get copyWith =>
      __$$ArticleListResponseImplCopyWithImpl<_$ArticleListResponseImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ArticleListResponseImplToJson(
      this,
    );
  }
}

abstract class _ArticleListResponse implements ArticleListResponse {
  const factory _ArticleListResponse(
      {required final List<ContentArticle> articles,
      required final int total,
      required final int pages,
      required final int currentPage,
      required final int perPage}) = _$ArticleListResponseImpl;

  factory _ArticleListResponse.fromJson(Map<String, dynamic> json) =
      _$ArticleListResponseImpl.fromJson;

  @override
  List<ContentArticle> get articles;
  @override
  int get total;
  @override
  int get pages;
  @override
  int get currentPage;
  @override
  int get perPage;
  @override
  @JsonKey(ignore: true)
  _$$ArticleListResponseImplCopyWith<_$ArticleListResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$ArticleFilters {
  int? get categoryId => throw _privateConstructorUsedError;
  List<String>? get tags => throw _privateConstructorUsedError;
  String? get search => throw _privateConstructorUsedError;
  String? get sortBy => throw _privateConstructorUsedError;
  String? get sortOrder => throw _privateConstructorUsedError;
  int? get page => throw _privateConstructorUsedError;
  int? get limit => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $ArticleFiltersCopyWith<ArticleFilters> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArticleFiltersCopyWith<$Res> {
  factory $ArticleFiltersCopyWith(
          ArticleFilters value, $Res Function(ArticleFilters) then) =
      _$ArticleFiltersCopyWithImpl<$Res, ArticleFilters>;
  @useResult
  $Res call(
      {int? categoryId,
      List<String>? tags,
      String? search,
      String? sortBy,
      String? sortOrder,
      int? page,
      int? limit});
}

/// @nodoc
class _$ArticleFiltersCopyWithImpl<$Res, $Val extends ArticleFilters>
    implements $ArticleFiltersCopyWith<$Res> {
  _$ArticleFiltersCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? categoryId = freezed,
    Object? tags = freezed,
    Object? search = freezed,
    Object? sortBy = freezed,
    Object? sortOrder = freezed,
    Object? page = freezed,
    Object? limit = freezed,
  }) {
    return _then(_value.copyWith(
      categoryId: freezed == categoryId
          ? _value.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int?,
      tags: freezed == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      search: freezed == search
          ? _value.search
          : search // ignore: cast_nullable_to_non_nullable
              as String?,
      sortBy: freezed == sortBy
          ? _value.sortBy
          : sortBy // ignore: cast_nullable_to_non_nullable
              as String?,
      sortOrder: freezed == sortOrder
          ? _value.sortOrder
          : sortOrder // ignore: cast_nullable_to_non_nullable
              as String?,
      page: freezed == page
          ? _value.page
          : page // ignore: cast_nullable_to_non_nullable
              as int?,
      limit: freezed == limit
          ? _value.limit
          : limit // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ArticleFiltersImplCopyWith<$Res>
    implements $ArticleFiltersCopyWith<$Res> {
  factory _$$ArticleFiltersImplCopyWith(_$ArticleFiltersImpl value,
          $Res Function(_$ArticleFiltersImpl) then) =
      __$$ArticleFiltersImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int? categoryId,
      List<String>? tags,
      String? search,
      String? sortBy,
      String? sortOrder,
      int? page,
      int? limit});
}

/// @nodoc
class __$$ArticleFiltersImplCopyWithImpl<$Res>
    extends _$ArticleFiltersCopyWithImpl<$Res, _$ArticleFiltersImpl>
    implements _$$ArticleFiltersImplCopyWith<$Res> {
  __$$ArticleFiltersImplCopyWithImpl(
      _$ArticleFiltersImpl _value, $Res Function(_$ArticleFiltersImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? categoryId = freezed,
    Object? tags = freezed,
    Object? search = freezed,
    Object? sortBy = freezed,
    Object? sortOrder = freezed,
    Object? page = freezed,
    Object? limit = freezed,
  }) {
    return _then(_$ArticleFiltersImpl(
      categoryId: freezed == categoryId
          ? _value.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int?,
      tags: freezed == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      search: freezed == search
          ? _value.search
          : search // ignore: cast_nullable_to_non_nullable
              as String?,
      sortBy: freezed == sortBy
          ? _value.sortBy
          : sortBy // ignore: cast_nullable_to_non_nullable
              as String?,
      sortOrder: freezed == sortOrder
          ? _value.sortOrder
          : sortOrder // ignore: cast_nullable_to_non_nullable
              as String?,
      page: freezed == page
          ? _value.page
          : page // ignore: cast_nullable_to_non_nullable
              as int?,
      limit: freezed == limit
          ? _value.limit
          : limit // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc

class _$ArticleFiltersImpl implements _ArticleFilters {
  const _$ArticleFiltersImpl(
      {this.categoryId,
      final List<String>? tags,
      this.search,
      this.sortBy,
      this.sortOrder,
      this.page,
      this.limit})
      : _tags = tags;

  @override
  final int? categoryId;
  final List<String>? _tags;
  @override
  List<String>? get tags {
    final value = _tags;
    if (value == null) return null;
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  final String? search;
  @override
  final String? sortBy;
  @override
  final String? sortOrder;
  @override
  final int? page;
  @override
  final int? limit;

  @override
  String toString() {
    return 'ArticleFilters(categoryId: $categoryId, tags: $tags, search: $search, sortBy: $sortBy, sortOrder: $sortOrder, page: $page, limit: $limit)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArticleFiltersImpl &&
            (identical(other.categoryId, categoryId) ||
                other.categoryId == categoryId) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.search, search) || other.search == search) &&
            (identical(other.sortBy, sortBy) || other.sortBy == sortBy) &&
            (identical(other.sortOrder, sortOrder) ||
                other.sortOrder == sortOrder) &&
            (identical(other.page, page) || other.page == page) &&
            (identical(other.limit, limit) || other.limit == limit));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      categoryId,
      const DeepCollectionEquality().hash(_tags),
      search,
      sortBy,
      sortOrder,
      page,
      limit);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ArticleFiltersImplCopyWith<_$ArticleFiltersImpl> get copyWith =>
      __$$ArticleFiltersImplCopyWithImpl<_$ArticleFiltersImpl>(
          this, _$identity);
}

abstract class _ArticleFilters implements ArticleFilters {
  const factory _ArticleFilters(
      {final int? categoryId,
      final List<String>? tags,
      final String? search,
      final String? sortBy,
      final String? sortOrder,
      final int? page,
      final int? limit}) = _$ArticleFiltersImpl;

  @override
  int? get categoryId;
  @override
  List<String>? get tags;
  @override
  String? get search;
  @override
  String? get sortBy;
  @override
  String? get sortOrder;
  @override
  int? get page;
  @override
  int? get limit;
  @override
  @JsonKey(ignore: true)
  _$$ArticleFiltersImplCopyWith<_$ArticleFiltersImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
