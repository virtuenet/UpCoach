"""
Model Validator

Validates ML models meet performance requirements before deployment
"""

import logging
from typing import Dict, List, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelValidator:
    """
    Validates ML models against performance thresholds
    """

    def __init__(self):
        # Performance thresholds
        self.churn_thresholds = {
            'accuracy': 0.85,
            'precision': 0.80,
            'recall': 0.75,
            'f1_score': 0.77,
            'roc_auc': 0.89,
        }

        self.goal_success_thresholds = {
            'accuracy': 0.80,
            'precision': 0.75,
            'recall': 0.70,
            'f1_score': 0.72,
            'roc_auc': 0.82,
        }

    def validate_churn_model(self, metrics: Dict[str, float]) -> bool:
        """
        Validate churn prediction model
        """
        logger.info("Validating churn prediction model...")

        passed = True
        failed_metrics = []

        for metric, threshold in self.churn_thresholds.items():
            if metric not in metrics:
                logger.warning(f"Metric {metric} not found in results")
                continue

            actual = metrics[metric]

            if actual < threshold:
                passed = False
                failed_metrics.append(
                    f"{metric}: {actual:.4f} < {threshold:.4f} (threshold)"
                )
            else:
                logger.info(f"✅ {metric}: {actual:.4f} >= {threshold:.4f}")

        if not passed:
            logger.error("❌ Model validation failed:")
            for failure in failed_metrics:
                logger.error(f"  - {failure}")

        return passed

    def validate_goal_success_model(self, metrics: Dict[str, float]) -> bool:
        """
        Validate goal success prediction model
        """
        logger.info("Validating goal success prediction model...")

        passed = True
        failed_metrics = []

        for metric, threshold in self.goal_success_thresholds.items():
            if metric not in metrics:
                logger.warning(f"Metric {metric} not found in results")
                continue

            actual = metrics[metric]

            if actual < threshold:
                passed = False
                failed_metrics.append(
                    f"{metric}: {actual:.4f} < {threshold:.4f} (threshold)"
                )
            else:
                logger.info(f"✅ {metric}: {actual:.4f} >= {threshold:.4f}")

        if not passed:
            logger.error("❌ Model validation failed:")
            for failure in failed_metrics:
                logger.error(f"  - {failure}")

        return passed

    def validate_prediction_latency(
        self,
        latencies: List[float],
        p95_threshold_ms: float = 100.0
    ) -> bool:
        """
        Validate prediction latency meets SLA
        """
        import numpy as np

        p50 = np.percentile(latencies, 50)
        p95 = np.percentile(latencies, 95)
        p99 = np.percentile(latencies, 99)

        logger.info(f"Latency percentiles:")
        logger.info(f"  p50: {p50:.2f}ms")
        logger.info(f"  p95: {p95:.2f}ms")
        logger.info(f"  p99: {p99:.2f}ms")

        if p95 <= p95_threshold_ms:
            logger.info(f"✅ p95 latency {p95:.2f}ms <= {p95_threshold_ms}ms threshold")
            return True
        else:
            logger.error(f"❌ p95 latency {p95:.2f}ms > {p95_threshold_ms}ms threshold")
            return False

    def validate_data_quality(
        self,
        data_stats: Dict[str, any],
        max_missing_percentage: float = 10.0
    ) -> Tuple[bool, List[str]]:
        """
        Validate data quality for training
        """
        logger.info("Validating data quality...")

        passed = True
        issues = []

        # Check missing values
        for feature, stats in data_stats.items():
            if 'missing_percentage' in stats:
                missing_pct = stats['missing_percentage']

                if missing_pct > max_missing_percentage:
                    passed = False
                    issues.append(
                        f"Feature '{feature}' has {missing_pct:.2f}% missing values "
                        f"(threshold: {max_missing_percentage}%)"
                    )

        # Check class imbalance
        if 'class_distribution' in data_stats:
            dist = data_stats['class_distribution']
            minority_pct = min(dist.values()) / sum(dist.values()) * 100

            if minority_pct < 10:
                issues.append(
                    f"Severe class imbalance detected: minority class = {minority_pct:.2f}%"
                )

        if passed:
            logger.info("✅ Data quality validation passed")
        else:
            logger.error("❌ Data quality issues detected:")
            for issue in issues:
                logger.error(f"  - {issue}")

        return passed, issues

    def validate_feature_importance(
        self,
        feature_importances: Dict[str, float],
        min_features_threshold: float = 0.01
    ) -> Tuple[bool, List[str]]:
        """
        Validate feature importance distribution
        """
        logger.info("Validating feature importance...")

        issues = []

        # Check if any features have very low importance
        low_importance_features = [
            feature
            for feature, importance in feature_importances.items()
            if importance < min_features_threshold
        ]

        if low_importance_features:
            issues.append(
                f"{len(low_importance_features)} features have importance < {min_features_threshold}: "
                f"{', '.join(low_importance_features)}"
            )

        # Check if importance is concentrated in few features
        sorted_importances = sorted(feature_importances.values(), reverse=True)
        top_3_contribution = sum(sorted_importances[:3]) if len(sorted_importances) >= 3 else sum(sorted_importances)

        if top_3_contribution > 0.8:
            issues.append(
                f"Top 3 features contribute {top_3_contribution:.2%} of total importance "
                f"(potential overfitting risk)"
            )

        if issues:
            logger.warning("⚠️  Feature importance warnings:")
            for issue in issues:
                logger.warning(f"  - {issue}")
            return False, issues
        else:
            logger.info("✅ Feature importance validation passed")
            return True, []

    def validate_model_size(
        self,
        model_size_mb: float,
        max_size_mb: float = 50.0
    ) -> bool:
        """
        Validate model size for deployment
        """
        logger.info(f"Model size: {model_size_mb:.2f}MB")

        if model_size_mb <= max_size_mb:
            logger.info(f"✅ Model size {model_size_mb:.2f}MB <= {max_size_mb}MB threshold")
            return True
        else:
            logger.error(f"❌ Model size {model_size_mb:.2f}MB > {max_size_mb}MB threshold")
            return False

    def comprehensive_validation(
        self,
        model_type: str,
        metrics: Dict[str, float],
        feature_importances: Dict[str, float],
        latencies: List[float],
        model_size_mb: float
    ) -> bool:
        """
        Run comprehensive validation suite
        """
        logger.info(f"\n=== Comprehensive Validation for {model_type} ===\n")

        validations = []

        # Performance validation
        if model_type == 'churn':
            validations.append(('Performance', self.validate_churn_model(metrics)))
        elif model_type == 'goal_success':
            validations.append(('Performance', self.validate_goal_success_model(metrics)))

        # Latency validation
        validations.append(('Latency', self.validate_prediction_latency(latencies)))

        # Feature importance validation
        fi_passed, _ = self.validate_feature_importance(feature_importances)
        validations.append(('Feature Importance', fi_passed))

        # Model size validation
        validations.append(('Model Size', self.validate_model_size(model_size_mb)))

        # Summary
        logger.info("\n=== Validation Summary ===")
        all_passed = True

        for name, passed in validations:
            status = "✅ PASS" if passed else "❌ FAIL"
            logger.info(f"{name}: {status}")
            if not passed:
                all_passed = False

        if all_passed:
            logger.info("\n🎉 All validations passed! Model is ready for deployment.")
        else:
            logger.error("\n❌ Some validations failed. Please address issues before deployment.")

        return all_passed
