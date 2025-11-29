import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_colors.dart';

class ShimmerLoading extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;
  final EdgeInsetsGeometry? margin;

  const ShimmerLoading({
    Key? key,
    this.width = double.infinity,
    this.height = 20,
    this.borderRadius = 8,
    this.margin,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.gray200,
      highlightColor: AppColors.gray100,
      child: Container(
        width: width,
        height: height,
        margin: margin,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

class ShimmerCard extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const ShimmerCard({
    Key? key,
    this.width,
    this.height = 120,
    this.borderRadius = 12,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ShimmerLoading(width: 120, height: 16),
          const SizedBox(height: 12),
          const ShimmerLoading(height: 14),
          const SizedBox(height: 8),
          const ShimmerLoading(width: 200, height: 14),
          const Spacer(),
          Row(
            children: const [
              ShimmerLoading(width: 60, height: 24, borderRadius: 12),
              SizedBox(width: 8),
              ShimmerLoading(width: 60, height: 24, borderRadius: 12),
            ],
          ),
        ],
      ),
    );
  }
}

class ShimmerListItem extends StatelessWidget {
  final double height;
  final EdgeInsetsGeometry? margin;

  const ShimmerListItem({
    Key? key,
    this.height = 80,
    this.margin,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Row(
        children: [
          const ShimmerLoading(width: 56, height: 56, borderRadius: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                ShimmerLoading(width: 140, height: 16),
                SizedBox(height: 8),
                ShimmerLoading(height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ShimmerAvatar extends StatelessWidget {
  final double size;

  const ShimmerAvatar({
    Key? key,
    this.size = 48,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ShimmerLoading(
      width: size,
      height: size,
      borderRadius: size / 2,
    );
  }
}
