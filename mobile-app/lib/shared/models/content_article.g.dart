// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'content_article.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ContentArticleImpl _$$ContentArticleImplFromJson(Map<String, dynamic> json) =>
    _$ContentArticleImpl(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String,
      slug: json['slug'] as String,
      summary: json['summary'] as String,
      content: ContentBody.fromJson(json['content'] as Map<String, dynamic>),
      featuredImage: json['featuredImage'] as String?,
      category:
          ContentCategory.fromJson(json['category'] as Map<String, dynamic>),
      tags: (json['tags'] as List<dynamic>).map((e) => e as String).toList(),
      author: ContentAuthor.fromJson(json['author'] as Map<String, dynamic>),
      status: json['status'] as String,
      publishedAt: json['publishedAt'] == null
          ? null
          : DateTime.parse(json['publishedAt'] as String),
      viewCount: (json['viewCount'] as num).toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      seoTitle: json['seoTitle'] as String?,
      seoDescription: json['seoDescription'] as String?,
      seoKeywords: (json['seoKeywords'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$ContentArticleImplToJson(
        _$ContentArticleImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'slug': instance.slug,
      'summary': instance.summary,
      'content': instance.content,
      'featuredImage': instance.featuredImage,
      'category': instance.category,
      'tags': instance.tags,
      'author': instance.author,
      'status': instance.status,
      'publishedAt': instance.publishedAt?.toIso8601String(),
      'viewCount': instance.viewCount,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'seoTitle': instance.seoTitle,
      'seoDescription': instance.seoDescription,
      'seoKeywords': instance.seoKeywords,
      'metadata': instance.metadata,
    };

_$ContentBodyImpl _$$ContentBodyImplFromJson(Map<String, dynamic> json) =>
    _$ContentBodyImpl(
      format: json['format'] as String,
      body: json['body'] as String,
    );

Map<String, dynamic> _$$ContentBodyImplToJson(_$ContentBodyImpl instance) =>
    <String, dynamic>{
      'format': instance.format,
      'body': instance.body,
    };

_$ContentCategoryImpl _$$ContentCategoryImplFromJson(
        Map<String, dynamic> json) =>
    _$ContentCategoryImpl(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
    );

Map<String, dynamic> _$$ContentCategoryImplToJson(
        _$ContentCategoryImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
      'description': instance.description,
      'icon': instance.icon,
    };

_$ContentAuthorImpl _$$ContentAuthorImplFromJson(Map<String, dynamic> json) =>
    _$ContentAuthorImpl(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      avatar: json['avatar'] as String?,
      bio: json['bio'] as String?,
      role: json['role'] as String?,
    );

Map<String, dynamic> _$$ContentAuthorImplToJson(_$ContentAuthorImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'avatar': instance.avatar,
      'bio': instance.bio,
      'role': instance.role,
    };

_$ArticleListResponseImpl _$$ArticleListResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$ArticleListResponseImpl(
      articles: (json['articles'] as List<dynamic>)
          .map((e) => ContentArticle.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num).toInt(),
      pages: (json['pages'] as num).toInt(),
      currentPage: (json['currentPage'] as num).toInt(),
      perPage: (json['perPage'] as num).toInt(),
    );

Map<String, dynamic> _$$ArticleListResponseImplToJson(
        _$ArticleListResponseImpl instance) =>
    <String, dynamic>{
      'articles': instance.articles,
      'total': instance.total,
      'pages': instance.pages,
      'currentPage': instance.currentPage,
      'perPage': instance.perPage,
    };
