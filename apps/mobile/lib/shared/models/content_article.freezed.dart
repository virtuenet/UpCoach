// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'content_article.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ContentArticle {

 int get id; String get title; String get slug; String get summary; ContentBody get content; String? get featuredImage; ContentCategory get category; List<String> get tags; ContentAuthor get author; String get status; DateTime? get publishedAt; int get viewCount; DateTime get createdAt; DateTime get updatedAt; String? get seoTitle; String? get seoDescription; List<String>? get seoKeywords; Map<String, dynamic>? get metadata;
/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContentArticleCopyWith<ContentArticle> get copyWith => _$ContentArticleCopyWithImpl<ContentArticle>(this as ContentArticle, _$identity);

  /// Serializes this ContentArticle to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ContentArticle&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.summary, summary) || other.summary == summary)&&(identical(other.content, content) || other.content == content)&&(identical(other.featuredImage, featuredImage) || other.featuredImage == featuredImage)&&(identical(other.category, category) || other.category == category)&&const DeepCollectionEquality().equals(other.tags, tags)&&(identical(other.author, author) || other.author == author)&&(identical(other.status, status) || other.status == status)&&(identical(other.publishedAt, publishedAt) || other.publishedAt == publishedAt)&&(identical(other.viewCount, viewCount) || other.viewCount == viewCount)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.seoTitle, seoTitle) || other.seoTitle == seoTitle)&&(identical(other.seoDescription, seoDescription) || other.seoDescription == seoDescription)&&const DeepCollectionEquality().equals(other.seoKeywords, seoKeywords)&&const DeepCollectionEquality().equals(other.metadata, metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,slug,summary,content,featuredImage,category,const DeepCollectionEquality().hash(tags),author,status,publishedAt,viewCount,createdAt,updatedAt,seoTitle,seoDescription,const DeepCollectionEquality().hash(seoKeywords),const DeepCollectionEquality().hash(metadata));

@override
String toString() {
  return 'ContentArticle(id: $id, title: $title, slug: $slug, summary: $summary, content: $content, featuredImage: $featuredImage, category: $category, tags: $tags, author: $author, status: $status, publishedAt: $publishedAt, viewCount: $viewCount, createdAt: $createdAt, updatedAt: $updatedAt, seoTitle: $seoTitle, seoDescription: $seoDescription, seoKeywords: $seoKeywords, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class $ContentArticleCopyWith<$Res>  {
  factory $ContentArticleCopyWith(ContentArticle value, $Res Function(ContentArticle) _then) = _$ContentArticleCopyWithImpl;
@useResult
$Res call({
 int id, String title, String slug, String summary, ContentBody content, String? featuredImage, ContentCategory category, List<String> tags, ContentAuthor author, String status, DateTime? publishedAt, int viewCount, DateTime createdAt, DateTime updatedAt, String? seoTitle, String? seoDescription, List<String>? seoKeywords, Map<String, dynamic>? metadata
});


$ContentBodyCopyWith<$Res> get content;$ContentCategoryCopyWith<$Res> get category;$ContentAuthorCopyWith<$Res> get author;

}
/// @nodoc
class _$ContentArticleCopyWithImpl<$Res>
    implements $ContentArticleCopyWith<$Res> {
  _$ContentArticleCopyWithImpl(this._self, this._then);

  final ContentArticle _self;
  final $Res Function(ContentArticle) _then;

/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? slug = null,Object? summary = null,Object? content = null,Object? featuredImage = freezed,Object? category = null,Object? tags = null,Object? author = null,Object? status = null,Object? publishedAt = freezed,Object? viewCount = null,Object? createdAt = null,Object? updatedAt = null,Object? seoTitle = freezed,Object? seoDescription = freezed,Object? seoKeywords = freezed,Object? metadata = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,summary: null == summary ? _self.summary : summary // ignore: cast_nullable_to_non_nullable
as String,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as ContentBody,featuredImage: freezed == featuredImage ? _self.featuredImage : featuredImage // ignore: cast_nullable_to_non_nullable
as String?,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as ContentCategory,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,author: null == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as ContentAuthor,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,publishedAt: freezed == publishedAt ? _self.publishedAt : publishedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,viewCount: null == viewCount ? _self.viewCount : viewCount // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,seoTitle: freezed == seoTitle ? _self.seoTitle : seoTitle // ignore: cast_nullable_to_non_nullable
as String?,seoDescription: freezed == seoDescription ? _self.seoDescription : seoDescription // ignore: cast_nullable_to_non_nullable
as String?,seoKeywords: freezed == seoKeywords ? _self.seoKeywords : seoKeywords // ignore: cast_nullable_to_non_nullable
as List<String>?,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}
/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContentBodyCopyWith<$Res> get content {
  
  return $ContentBodyCopyWith<$Res>(_self.content, (value) {
    return _then(_self.copyWith(content: value));
  });
}/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContentCategoryCopyWith<$Res> get category {
  
  return $ContentCategoryCopyWith<$Res>(_self.category, (value) {
    return _then(_self.copyWith(category: value));
  });
}/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContentAuthorCopyWith<$Res> get author {
  
  return $ContentAuthorCopyWith<$Res>(_self.author, (value) {
    return _then(_self.copyWith(author: value));
  });
}
}


/// Adds pattern-matching-related methods to [ContentArticle].
extension ContentArticlePatterns on ContentArticle {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ContentArticle value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ContentArticle() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ContentArticle value)  $default,){
final _that = this;
switch (_that) {
case _ContentArticle():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ContentArticle value)?  $default,){
final _that = this;
switch (_that) {
case _ContentArticle() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String title,  String slug,  String summary,  ContentBody content,  String? featuredImage,  ContentCategory category,  List<String> tags,  ContentAuthor author,  String status,  DateTime? publishedAt,  int viewCount,  DateTime createdAt,  DateTime updatedAt,  String? seoTitle,  String? seoDescription,  List<String>? seoKeywords,  Map<String, dynamic>? metadata)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ContentArticle() when $default != null:
return $default(_that.id,_that.title,_that.slug,_that.summary,_that.content,_that.featuredImage,_that.category,_that.tags,_that.author,_that.status,_that.publishedAt,_that.viewCount,_that.createdAt,_that.updatedAt,_that.seoTitle,_that.seoDescription,_that.seoKeywords,_that.metadata);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String title,  String slug,  String summary,  ContentBody content,  String? featuredImage,  ContentCategory category,  List<String> tags,  ContentAuthor author,  String status,  DateTime? publishedAt,  int viewCount,  DateTime createdAt,  DateTime updatedAt,  String? seoTitle,  String? seoDescription,  List<String>? seoKeywords,  Map<String, dynamic>? metadata)  $default,) {final _that = this;
switch (_that) {
case _ContentArticle():
return $default(_that.id,_that.title,_that.slug,_that.summary,_that.content,_that.featuredImage,_that.category,_that.tags,_that.author,_that.status,_that.publishedAt,_that.viewCount,_that.createdAt,_that.updatedAt,_that.seoTitle,_that.seoDescription,_that.seoKeywords,_that.metadata);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String title,  String slug,  String summary,  ContentBody content,  String? featuredImage,  ContentCategory category,  List<String> tags,  ContentAuthor author,  String status,  DateTime? publishedAt,  int viewCount,  DateTime createdAt,  DateTime updatedAt,  String? seoTitle,  String? seoDescription,  List<String>? seoKeywords,  Map<String, dynamic>? metadata)?  $default,) {final _that = this;
switch (_that) {
case _ContentArticle() when $default != null:
return $default(_that.id,_that.title,_that.slug,_that.summary,_that.content,_that.featuredImage,_that.category,_that.tags,_that.author,_that.status,_that.publishedAt,_that.viewCount,_that.createdAt,_that.updatedAt,_that.seoTitle,_that.seoDescription,_that.seoKeywords,_that.metadata);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ContentArticle implements ContentArticle {
  const _ContentArticle({required this.id, required this.title, required this.slug, required this.summary, required this.content, this.featuredImage, required this.category, required final  List<String> tags, required this.author, required this.status, this.publishedAt, required this.viewCount, required this.createdAt, required this.updatedAt, this.seoTitle, this.seoDescription, final  List<String>? seoKeywords, final  Map<String, dynamic>? metadata}): _tags = tags,_seoKeywords = seoKeywords,_metadata = metadata;
  factory _ContentArticle.fromJson(Map<String, dynamic> json) => _$ContentArticleFromJson(json);

@override final  int id;
@override final  String title;
@override final  String slug;
@override final  String summary;
@override final  ContentBody content;
@override final  String? featuredImage;
@override final  ContentCategory category;
 final  List<String> _tags;
@override List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}

@override final  ContentAuthor author;
@override final  String status;
@override final  DateTime? publishedAt;
@override final  int viewCount;
@override final  DateTime createdAt;
@override final  DateTime updatedAt;
@override final  String? seoTitle;
@override final  String? seoDescription;
 final  List<String>? _seoKeywords;
@override List<String>? get seoKeywords {
  final value = _seoKeywords;
  if (value == null) return null;
  if (_seoKeywords is EqualUnmodifiableListView) return _seoKeywords;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

 final  Map<String, dynamic>? _metadata;
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}


/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContentArticleCopyWith<_ContentArticle> get copyWith => __$ContentArticleCopyWithImpl<_ContentArticle>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContentArticleToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ContentArticle&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.summary, summary) || other.summary == summary)&&(identical(other.content, content) || other.content == content)&&(identical(other.featuredImage, featuredImage) || other.featuredImage == featuredImage)&&(identical(other.category, category) || other.category == category)&&const DeepCollectionEquality().equals(other._tags, _tags)&&(identical(other.author, author) || other.author == author)&&(identical(other.status, status) || other.status == status)&&(identical(other.publishedAt, publishedAt) || other.publishedAt == publishedAt)&&(identical(other.viewCount, viewCount) || other.viewCount == viewCount)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.seoTitle, seoTitle) || other.seoTitle == seoTitle)&&(identical(other.seoDescription, seoDescription) || other.seoDescription == seoDescription)&&const DeepCollectionEquality().equals(other._seoKeywords, _seoKeywords)&&const DeepCollectionEquality().equals(other._metadata, _metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,slug,summary,content,featuredImage,category,const DeepCollectionEquality().hash(_tags),author,status,publishedAt,viewCount,createdAt,updatedAt,seoTitle,seoDescription,const DeepCollectionEquality().hash(_seoKeywords),const DeepCollectionEquality().hash(_metadata));

@override
String toString() {
  return 'ContentArticle(id: $id, title: $title, slug: $slug, summary: $summary, content: $content, featuredImage: $featuredImage, category: $category, tags: $tags, author: $author, status: $status, publishedAt: $publishedAt, viewCount: $viewCount, createdAt: $createdAt, updatedAt: $updatedAt, seoTitle: $seoTitle, seoDescription: $seoDescription, seoKeywords: $seoKeywords, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class _$ContentArticleCopyWith<$Res> implements $ContentArticleCopyWith<$Res> {
  factory _$ContentArticleCopyWith(_ContentArticle value, $Res Function(_ContentArticle) _then) = __$ContentArticleCopyWithImpl;
@override @useResult
$Res call({
 int id, String title, String slug, String summary, ContentBody content, String? featuredImage, ContentCategory category, List<String> tags, ContentAuthor author, String status, DateTime? publishedAt, int viewCount, DateTime createdAt, DateTime updatedAt, String? seoTitle, String? seoDescription, List<String>? seoKeywords, Map<String, dynamic>? metadata
});


@override $ContentBodyCopyWith<$Res> get content;@override $ContentCategoryCopyWith<$Res> get category;@override $ContentAuthorCopyWith<$Res> get author;

}
/// @nodoc
class __$ContentArticleCopyWithImpl<$Res>
    implements _$ContentArticleCopyWith<$Res> {
  __$ContentArticleCopyWithImpl(this._self, this._then);

  final _ContentArticle _self;
  final $Res Function(_ContentArticle) _then;

/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? slug = null,Object? summary = null,Object? content = null,Object? featuredImage = freezed,Object? category = null,Object? tags = null,Object? author = null,Object? status = null,Object? publishedAt = freezed,Object? viewCount = null,Object? createdAt = null,Object? updatedAt = null,Object? seoTitle = freezed,Object? seoDescription = freezed,Object? seoKeywords = freezed,Object? metadata = freezed,}) {
  return _then(_ContentArticle(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,summary: null == summary ? _self.summary : summary // ignore: cast_nullable_to_non_nullable
as String,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as ContentBody,featuredImage: freezed == featuredImage ? _self.featuredImage : featuredImage // ignore: cast_nullable_to_non_nullable
as String?,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as ContentCategory,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,author: null == author ? _self.author : author // ignore: cast_nullable_to_non_nullable
as ContentAuthor,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,publishedAt: freezed == publishedAt ? _self.publishedAt : publishedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,viewCount: null == viewCount ? _self.viewCount : viewCount // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,seoTitle: freezed == seoTitle ? _self.seoTitle : seoTitle // ignore: cast_nullable_to_non_nullable
as String?,seoDescription: freezed == seoDescription ? _self.seoDescription : seoDescription // ignore: cast_nullable_to_non_nullable
as String?,seoKeywords: freezed == seoKeywords ? _self._seoKeywords : seoKeywords // ignore: cast_nullable_to_non_nullable
as List<String>?,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}

/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContentBodyCopyWith<$Res> get content {
  
  return $ContentBodyCopyWith<$Res>(_self.content, (value) {
    return _then(_self.copyWith(content: value));
  });
}/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContentCategoryCopyWith<$Res> get category {
  
  return $ContentCategoryCopyWith<$Res>(_self.category, (value) {
    return _then(_self.copyWith(category: value));
  });
}/// Create a copy of ContentArticle
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContentAuthorCopyWith<$Res> get author {
  
  return $ContentAuthorCopyWith<$Res>(_self.author, (value) {
    return _then(_self.copyWith(author: value));
  });
}
}


/// @nodoc
mixin _$ContentBody {

 String get format; String get body;
/// Create a copy of ContentBody
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContentBodyCopyWith<ContentBody> get copyWith => _$ContentBodyCopyWithImpl<ContentBody>(this as ContentBody, _$identity);

  /// Serializes this ContentBody to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ContentBody&&(identical(other.format, format) || other.format == format)&&(identical(other.body, body) || other.body == body));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,format,body);

@override
String toString() {
  return 'ContentBody(format: $format, body: $body)';
}


}

/// @nodoc
abstract mixin class $ContentBodyCopyWith<$Res>  {
  factory $ContentBodyCopyWith(ContentBody value, $Res Function(ContentBody) _then) = _$ContentBodyCopyWithImpl;
@useResult
$Res call({
 String format, String body
});




}
/// @nodoc
class _$ContentBodyCopyWithImpl<$Res>
    implements $ContentBodyCopyWith<$Res> {
  _$ContentBodyCopyWithImpl(this._self, this._then);

  final ContentBody _self;
  final $Res Function(ContentBody) _then;

/// Create a copy of ContentBody
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? format = null,Object? body = null,}) {
  return _then(_self.copyWith(
format: null == format ? _self.format : format // ignore: cast_nullable_to_non_nullable
as String,body: null == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ContentBody].
extension ContentBodyPatterns on ContentBody {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ContentBody value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ContentBody() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ContentBody value)  $default,){
final _that = this;
switch (_that) {
case _ContentBody():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ContentBody value)?  $default,){
final _that = this;
switch (_that) {
case _ContentBody() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String format,  String body)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ContentBody() when $default != null:
return $default(_that.format,_that.body);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String format,  String body)  $default,) {final _that = this;
switch (_that) {
case _ContentBody():
return $default(_that.format,_that.body);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String format,  String body)?  $default,) {final _that = this;
switch (_that) {
case _ContentBody() when $default != null:
return $default(_that.format,_that.body);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ContentBody implements ContentBody {
  const _ContentBody({required this.format, required this.body});
  factory _ContentBody.fromJson(Map<String, dynamic> json) => _$ContentBodyFromJson(json);

@override final  String format;
@override final  String body;

/// Create a copy of ContentBody
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContentBodyCopyWith<_ContentBody> get copyWith => __$ContentBodyCopyWithImpl<_ContentBody>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContentBodyToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ContentBody&&(identical(other.format, format) || other.format == format)&&(identical(other.body, body) || other.body == body));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,format,body);

@override
String toString() {
  return 'ContentBody(format: $format, body: $body)';
}


}

/// @nodoc
abstract mixin class _$ContentBodyCopyWith<$Res> implements $ContentBodyCopyWith<$Res> {
  factory _$ContentBodyCopyWith(_ContentBody value, $Res Function(_ContentBody) _then) = __$ContentBodyCopyWithImpl;
@override @useResult
$Res call({
 String format, String body
});




}
/// @nodoc
class __$ContentBodyCopyWithImpl<$Res>
    implements _$ContentBodyCopyWith<$Res> {
  __$ContentBodyCopyWithImpl(this._self, this._then);

  final _ContentBody _self;
  final $Res Function(_ContentBody) _then;

/// Create a copy of ContentBody
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? format = null,Object? body = null,}) {
  return _then(_ContentBody(
format: null == format ? _self.format : format // ignore: cast_nullable_to_non_nullable
as String,body: null == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$ContentCategory {

 int get id; String get name; String get slug; String? get description; String? get icon;
/// Create a copy of ContentCategory
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContentCategoryCopyWith<ContentCategory> get copyWith => _$ContentCategoryCopyWithImpl<ContentCategory>(this as ContentCategory, _$identity);

  /// Serializes this ContentCategory to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ContentCategory&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.description, description) || other.description == description)&&(identical(other.icon, icon) || other.icon == icon));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,slug,description,icon);

@override
String toString() {
  return 'ContentCategory(id: $id, name: $name, slug: $slug, description: $description, icon: $icon)';
}


}

/// @nodoc
abstract mixin class $ContentCategoryCopyWith<$Res>  {
  factory $ContentCategoryCopyWith(ContentCategory value, $Res Function(ContentCategory) _then) = _$ContentCategoryCopyWithImpl;
@useResult
$Res call({
 int id, String name, String slug, String? description, String? icon
});




}
/// @nodoc
class _$ContentCategoryCopyWithImpl<$Res>
    implements $ContentCategoryCopyWith<$Res> {
  _$ContentCategoryCopyWithImpl(this._self, this._then);

  final ContentCategory _self;
  final $Res Function(ContentCategory) _then;

/// Create a copy of ContentCategory
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? slug = null,Object? description = freezed,Object? icon = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,icon: freezed == icon ? _self.icon : icon // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ContentCategory].
extension ContentCategoryPatterns on ContentCategory {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ContentCategory value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ContentCategory() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ContentCategory value)  $default,){
final _that = this;
switch (_that) {
case _ContentCategory():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ContentCategory value)?  $default,){
final _that = this;
switch (_that) {
case _ContentCategory() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String name,  String slug,  String? description,  String? icon)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ContentCategory() when $default != null:
return $default(_that.id,_that.name,_that.slug,_that.description,_that.icon);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String name,  String slug,  String? description,  String? icon)  $default,) {final _that = this;
switch (_that) {
case _ContentCategory():
return $default(_that.id,_that.name,_that.slug,_that.description,_that.icon);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String name,  String slug,  String? description,  String? icon)?  $default,) {final _that = this;
switch (_that) {
case _ContentCategory() when $default != null:
return $default(_that.id,_that.name,_that.slug,_that.description,_that.icon);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ContentCategory implements ContentCategory {
  const _ContentCategory({required this.id, required this.name, required this.slug, this.description, this.icon});
  factory _ContentCategory.fromJson(Map<String, dynamic> json) => _$ContentCategoryFromJson(json);

@override final  int id;
@override final  String name;
@override final  String slug;
@override final  String? description;
@override final  String? icon;

/// Create a copy of ContentCategory
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContentCategoryCopyWith<_ContentCategory> get copyWith => __$ContentCategoryCopyWithImpl<_ContentCategory>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContentCategoryToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ContentCategory&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.description, description) || other.description == description)&&(identical(other.icon, icon) || other.icon == icon));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,slug,description,icon);

@override
String toString() {
  return 'ContentCategory(id: $id, name: $name, slug: $slug, description: $description, icon: $icon)';
}


}

/// @nodoc
abstract mixin class _$ContentCategoryCopyWith<$Res> implements $ContentCategoryCopyWith<$Res> {
  factory _$ContentCategoryCopyWith(_ContentCategory value, $Res Function(_ContentCategory) _then) = __$ContentCategoryCopyWithImpl;
@override @useResult
$Res call({
 int id, String name, String slug, String? description, String? icon
});




}
/// @nodoc
class __$ContentCategoryCopyWithImpl<$Res>
    implements _$ContentCategoryCopyWith<$Res> {
  __$ContentCategoryCopyWithImpl(this._self, this._then);

  final _ContentCategory _self;
  final $Res Function(_ContentCategory) _then;

/// Create a copy of ContentCategory
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? slug = null,Object? description = freezed,Object? icon = freezed,}) {
  return _then(_ContentCategory(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,icon: freezed == icon ? _self.icon : icon // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$ContentAuthor {

 int get id; String get name; String? get avatar; String? get bio; String? get role;
/// Create a copy of ContentAuthor
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContentAuthorCopyWith<ContentAuthor> get copyWith => _$ContentAuthorCopyWithImpl<ContentAuthor>(this as ContentAuthor, _$identity);

  /// Serializes this ContentAuthor to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ContentAuthor&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.avatar, avatar) || other.avatar == avatar)&&(identical(other.bio, bio) || other.bio == bio)&&(identical(other.role, role) || other.role == role));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,avatar,bio,role);

@override
String toString() {
  return 'ContentAuthor(id: $id, name: $name, avatar: $avatar, bio: $bio, role: $role)';
}


}

/// @nodoc
abstract mixin class $ContentAuthorCopyWith<$Res>  {
  factory $ContentAuthorCopyWith(ContentAuthor value, $Res Function(ContentAuthor) _then) = _$ContentAuthorCopyWithImpl;
@useResult
$Res call({
 int id, String name, String? avatar, String? bio, String? role
});




}
/// @nodoc
class _$ContentAuthorCopyWithImpl<$Res>
    implements $ContentAuthorCopyWith<$Res> {
  _$ContentAuthorCopyWithImpl(this._self, this._then);

  final ContentAuthor _self;
  final $Res Function(ContentAuthor) _then;

/// Create a copy of ContentAuthor
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? avatar = freezed,Object? bio = freezed,Object? role = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,avatar: freezed == avatar ? _self.avatar : avatar // ignore: cast_nullable_to_non_nullable
as String?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ContentAuthor].
extension ContentAuthorPatterns on ContentAuthor {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ContentAuthor value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ContentAuthor() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ContentAuthor value)  $default,){
final _that = this;
switch (_that) {
case _ContentAuthor():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ContentAuthor value)?  $default,){
final _that = this;
switch (_that) {
case _ContentAuthor() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String name,  String? avatar,  String? bio,  String? role)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ContentAuthor() when $default != null:
return $default(_that.id,_that.name,_that.avatar,_that.bio,_that.role);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String name,  String? avatar,  String? bio,  String? role)  $default,) {final _that = this;
switch (_that) {
case _ContentAuthor():
return $default(_that.id,_that.name,_that.avatar,_that.bio,_that.role);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String name,  String? avatar,  String? bio,  String? role)?  $default,) {final _that = this;
switch (_that) {
case _ContentAuthor() when $default != null:
return $default(_that.id,_that.name,_that.avatar,_that.bio,_that.role);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ContentAuthor implements ContentAuthor {
  const _ContentAuthor({required this.id, required this.name, this.avatar, this.bio, this.role});
  factory _ContentAuthor.fromJson(Map<String, dynamic> json) => _$ContentAuthorFromJson(json);

@override final  int id;
@override final  String name;
@override final  String? avatar;
@override final  String? bio;
@override final  String? role;

/// Create a copy of ContentAuthor
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContentAuthorCopyWith<_ContentAuthor> get copyWith => __$ContentAuthorCopyWithImpl<_ContentAuthor>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContentAuthorToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ContentAuthor&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.avatar, avatar) || other.avatar == avatar)&&(identical(other.bio, bio) || other.bio == bio)&&(identical(other.role, role) || other.role == role));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,avatar,bio,role);

@override
String toString() {
  return 'ContentAuthor(id: $id, name: $name, avatar: $avatar, bio: $bio, role: $role)';
}


}

/// @nodoc
abstract mixin class _$ContentAuthorCopyWith<$Res> implements $ContentAuthorCopyWith<$Res> {
  factory _$ContentAuthorCopyWith(_ContentAuthor value, $Res Function(_ContentAuthor) _then) = __$ContentAuthorCopyWithImpl;
@override @useResult
$Res call({
 int id, String name, String? avatar, String? bio, String? role
});




}
/// @nodoc
class __$ContentAuthorCopyWithImpl<$Res>
    implements _$ContentAuthorCopyWith<$Res> {
  __$ContentAuthorCopyWithImpl(this._self, this._then);

  final _ContentAuthor _self;
  final $Res Function(_ContentAuthor) _then;

/// Create a copy of ContentAuthor
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? avatar = freezed,Object? bio = freezed,Object? role = freezed,}) {
  return _then(_ContentAuthor(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,avatar: freezed == avatar ? _self.avatar : avatar // ignore: cast_nullable_to_non_nullable
as String?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$ArticleListResponse {

 List<ContentArticle> get articles; int get total; int get pages; int get currentPage; int get perPage;
/// Create a copy of ArticleListResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ArticleListResponseCopyWith<ArticleListResponse> get copyWith => _$ArticleListResponseCopyWithImpl<ArticleListResponse>(this as ArticleListResponse, _$identity);

  /// Serializes this ArticleListResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ArticleListResponse&&const DeepCollectionEquality().equals(other.articles, articles)&&(identical(other.total, total) || other.total == total)&&(identical(other.pages, pages) || other.pages == pages)&&(identical(other.currentPage, currentPage) || other.currentPage == currentPage)&&(identical(other.perPage, perPage) || other.perPage == perPage));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(articles),total,pages,currentPage,perPage);

@override
String toString() {
  return 'ArticleListResponse(articles: $articles, total: $total, pages: $pages, currentPage: $currentPage, perPage: $perPage)';
}


}

/// @nodoc
abstract mixin class $ArticleListResponseCopyWith<$Res>  {
  factory $ArticleListResponseCopyWith(ArticleListResponse value, $Res Function(ArticleListResponse) _then) = _$ArticleListResponseCopyWithImpl;
@useResult
$Res call({
 List<ContentArticle> articles, int total, int pages, int currentPage, int perPage
});




}
/// @nodoc
class _$ArticleListResponseCopyWithImpl<$Res>
    implements $ArticleListResponseCopyWith<$Res> {
  _$ArticleListResponseCopyWithImpl(this._self, this._then);

  final ArticleListResponse _self;
  final $Res Function(ArticleListResponse) _then;

/// Create a copy of ArticleListResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? articles = null,Object? total = null,Object? pages = null,Object? currentPage = null,Object? perPage = null,}) {
  return _then(_self.copyWith(
articles: null == articles ? _self.articles : articles // ignore: cast_nullable_to_non_nullable
as List<ContentArticle>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,pages: null == pages ? _self.pages : pages // ignore: cast_nullable_to_non_nullable
as int,currentPage: null == currentPage ? _self.currentPage : currentPage // ignore: cast_nullable_to_non_nullable
as int,perPage: null == perPage ? _self.perPage : perPage // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [ArticleListResponse].
extension ArticleListResponsePatterns on ArticleListResponse {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ArticleListResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ArticleListResponse() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ArticleListResponse value)  $default,){
final _that = this;
switch (_that) {
case _ArticleListResponse():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ArticleListResponse value)?  $default,){
final _that = this;
switch (_that) {
case _ArticleListResponse() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<ContentArticle> articles,  int total,  int pages,  int currentPage,  int perPage)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ArticleListResponse() when $default != null:
return $default(_that.articles,_that.total,_that.pages,_that.currentPage,_that.perPage);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<ContentArticle> articles,  int total,  int pages,  int currentPage,  int perPage)  $default,) {final _that = this;
switch (_that) {
case _ArticleListResponse():
return $default(_that.articles,_that.total,_that.pages,_that.currentPage,_that.perPage);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<ContentArticle> articles,  int total,  int pages,  int currentPage,  int perPage)?  $default,) {final _that = this;
switch (_that) {
case _ArticleListResponse() when $default != null:
return $default(_that.articles,_that.total,_that.pages,_that.currentPage,_that.perPage);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ArticleListResponse implements ArticleListResponse {
  const _ArticleListResponse({required final  List<ContentArticle> articles, required this.total, required this.pages, required this.currentPage, required this.perPage}): _articles = articles;
  factory _ArticleListResponse.fromJson(Map<String, dynamic> json) => _$ArticleListResponseFromJson(json);

 final  List<ContentArticle> _articles;
@override List<ContentArticle> get articles {
  if (_articles is EqualUnmodifiableListView) return _articles;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_articles);
}

@override final  int total;
@override final  int pages;
@override final  int currentPage;
@override final  int perPage;

/// Create a copy of ArticleListResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ArticleListResponseCopyWith<_ArticleListResponse> get copyWith => __$ArticleListResponseCopyWithImpl<_ArticleListResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ArticleListResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ArticleListResponse&&const DeepCollectionEquality().equals(other._articles, _articles)&&(identical(other.total, total) || other.total == total)&&(identical(other.pages, pages) || other.pages == pages)&&(identical(other.currentPage, currentPage) || other.currentPage == currentPage)&&(identical(other.perPage, perPage) || other.perPage == perPage));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_articles),total,pages,currentPage,perPage);

@override
String toString() {
  return 'ArticleListResponse(articles: $articles, total: $total, pages: $pages, currentPage: $currentPage, perPage: $perPage)';
}


}

/// @nodoc
abstract mixin class _$ArticleListResponseCopyWith<$Res> implements $ArticleListResponseCopyWith<$Res> {
  factory _$ArticleListResponseCopyWith(_ArticleListResponse value, $Res Function(_ArticleListResponse) _then) = __$ArticleListResponseCopyWithImpl;
@override @useResult
$Res call({
 List<ContentArticle> articles, int total, int pages, int currentPage, int perPage
});




}
/// @nodoc
class __$ArticleListResponseCopyWithImpl<$Res>
    implements _$ArticleListResponseCopyWith<$Res> {
  __$ArticleListResponseCopyWithImpl(this._self, this._then);

  final _ArticleListResponse _self;
  final $Res Function(_ArticleListResponse) _then;

/// Create a copy of ArticleListResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? articles = null,Object? total = null,Object? pages = null,Object? currentPage = null,Object? perPage = null,}) {
  return _then(_ArticleListResponse(
articles: null == articles ? _self._articles : articles // ignore: cast_nullable_to_non_nullable
as List<ContentArticle>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,pages: null == pages ? _self.pages : pages // ignore: cast_nullable_to_non_nullable
as int,currentPage: null == currentPage ? _self.currentPage : currentPage // ignore: cast_nullable_to_non_nullable
as int,perPage: null == perPage ? _self.perPage : perPage // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

/// @nodoc
mixin _$ArticleFilters {

 int? get categoryId; List<String>? get tags; String? get search; String? get sortBy; String? get sortOrder; int? get page; int? get limit;
/// Create a copy of ArticleFilters
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ArticleFiltersCopyWith<ArticleFilters> get copyWith => _$ArticleFiltersCopyWithImpl<ArticleFilters>(this as ArticleFilters, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ArticleFilters&&(identical(other.categoryId, categoryId) || other.categoryId == categoryId)&&const DeepCollectionEquality().equals(other.tags, tags)&&(identical(other.search, search) || other.search == search)&&(identical(other.sortBy, sortBy) || other.sortBy == sortBy)&&(identical(other.sortOrder, sortOrder) || other.sortOrder == sortOrder)&&(identical(other.page, page) || other.page == page)&&(identical(other.limit, limit) || other.limit == limit));
}


@override
int get hashCode => Object.hash(runtimeType,categoryId,const DeepCollectionEquality().hash(tags),search,sortBy,sortOrder,page,limit);

@override
String toString() {
  return 'ArticleFilters(categoryId: $categoryId, tags: $tags, search: $search, sortBy: $sortBy, sortOrder: $sortOrder, page: $page, limit: $limit)';
}


}

/// @nodoc
abstract mixin class $ArticleFiltersCopyWith<$Res>  {
  factory $ArticleFiltersCopyWith(ArticleFilters value, $Res Function(ArticleFilters) _then) = _$ArticleFiltersCopyWithImpl;
@useResult
$Res call({
 int? categoryId, List<String>? tags, String? search, String? sortBy, String? sortOrder, int? page, int? limit
});




}
/// @nodoc
class _$ArticleFiltersCopyWithImpl<$Res>
    implements $ArticleFiltersCopyWith<$Res> {
  _$ArticleFiltersCopyWithImpl(this._self, this._then);

  final ArticleFilters _self;
  final $Res Function(ArticleFilters) _then;

/// Create a copy of ArticleFilters
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? categoryId = freezed,Object? tags = freezed,Object? search = freezed,Object? sortBy = freezed,Object? sortOrder = freezed,Object? page = freezed,Object? limit = freezed,}) {
  return _then(_self.copyWith(
categoryId: freezed == categoryId ? _self.categoryId : categoryId // ignore: cast_nullable_to_non_nullable
as int?,tags: freezed == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>?,search: freezed == search ? _self.search : search // ignore: cast_nullable_to_non_nullable
as String?,sortBy: freezed == sortBy ? _self.sortBy : sortBy // ignore: cast_nullable_to_non_nullable
as String?,sortOrder: freezed == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as String?,page: freezed == page ? _self.page : page // ignore: cast_nullable_to_non_nullable
as int?,limit: freezed == limit ? _self.limit : limit // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [ArticleFilters].
extension ArticleFiltersPatterns on ArticleFilters {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ArticleFilters value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ArticleFilters() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ArticleFilters value)  $default,){
final _that = this;
switch (_that) {
case _ArticleFilters():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ArticleFilters value)?  $default,){
final _that = this;
switch (_that) {
case _ArticleFilters() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int? categoryId,  List<String>? tags,  String? search,  String? sortBy,  String? sortOrder,  int? page,  int? limit)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ArticleFilters() when $default != null:
return $default(_that.categoryId,_that.tags,_that.search,_that.sortBy,_that.sortOrder,_that.page,_that.limit);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int? categoryId,  List<String>? tags,  String? search,  String? sortBy,  String? sortOrder,  int? page,  int? limit)  $default,) {final _that = this;
switch (_that) {
case _ArticleFilters():
return $default(_that.categoryId,_that.tags,_that.search,_that.sortBy,_that.sortOrder,_that.page,_that.limit);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int? categoryId,  List<String>? tags,  String? search,  String? sortBy,  String? sortOrder,  int? page,  int? limit)?  $default,) {final _that = this;
switch (_that) {
case _ArticleFilters() when $default != null:
return $default(_that.categoryId,_that.tags,_that.search,_that.sortBy,_that.sortOrder,_that.page,_that.limit);case _:
  return null;

}
}

}

/// @nodoc


class _ArticleFilters extends ArticleFilters {
  const _ArticleFilters({this.categoryId, final  List<String>? tags, this.search, this.sortBy, this.sortOrder, this.page, this.limit}): _tags = tags,super._();
  

@override final  int? categoryId;
 final  List<String>? _tags;
@override List<String>? get tags {
  final value = _tags;
  if (value == null) return null;
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override final  String? search;
@override final  String? sortBy;
@override final  String? sortOrder;
@override final  int? page;
@override final  int? limit;

/// Create a copy of ArticleFilters
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ArticleFiltersCopyWith<_ArticleFilters> get copyWith => __$ArticleFiltersCopyWithImpl<_ArticleFilters>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ArticleFilters&&(identical(other.categoryId, categoryId) || other.categoryId == categoryId)&&const DeepCollectionEquality().equals(other._tags, _tags)&&(identical(other.search, search) || other.search == search)&&(identical(other.sortBy, sortBy) || other.sortBy == sortBy)&&(identical(other.sortOrder, sortOrder) || other.sortOrder == sortOrder)&&(identical(other.page, page) || other.page == page)&&(identical(other.limit, limit) || other.limit == limit));
}


@override
int get hashCode => Object.hash(runtimeType,categoryId,const DeepCollectionEquality().hash(_tags),search,sortBy,sortOrder,page,limit);

@override
String toString() {
  return 'ArticleFilters(categoryId: $categoryId, tags: $tags, search: $search, sortBy: $sortBy, sortOrder: $sortOrder, page: $page, limit: $limit)';
}


}

/// @nodoc
abstract mixin class _$ArticleFiltersCopyWith<$Res> implements $ArticleFiltersCopyWith<$Res> {
  factory _$ArticleFiltersCopyWith(_ArticleFilters value, $Res Function(_ArticleFilters) _then) = __$ArticleFiltersCopyWithImpl;
@override @useResult
$Res call({
 int? categoryId, List<String>? tags, String? search, String? sortBy, String? sortOrder, int? page, int? limit
});




}
/// @nodoc
class __$ArticleFiltersCopyWithImpl<$Res>
    implements _$ArticleFiltersCopyWith<$Res> {
  __$ArticleFiltersCopyWithImpl(this._self, this._then);

  final _ArticleFilters _self;
  final $Res Function(_ArticleFilters) _then;

/// Create a copy of ArticleFilters
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? categoryId = freezed,Object? tags = freezed,Object? search = freezed,Object? sortBy = freezed,Object? sortOrder = freezed,Object? page = freezed,Object? limit = freezed,}) {
  return _then(_ArticleFilters(
categoryId: freezed == categoryId ? _self.categoryId : categoryId // ignore: cast_nullable_to_non_nullable
as int?,tags: freezed == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>?,search: freezed == search ? _self.search : search // ignore: cast_nullable_to_non_nullable
as String?,sortBy: freezed == sortBy ? _self.sortBy : sortBy // ignore: cast_nullable_to_non_nullable
as String?,sortOrder: freezed == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as String?,page: freezed == page ? _self.page : page // ignore: cast_nullable_to_non_nullable
as int?,limit: freezed == limit ? _self.limit : limit // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}

// dart format on
