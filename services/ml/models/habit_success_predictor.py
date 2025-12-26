"""
Habit Success Prediction Model
Phase 11 Week 1

XGBoost-based binary classifier to predict habit maintenance vs. abandonment
Predicts weekly success probability (0-100%) for each active habit
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
import json


class HabitSuccessPredictor:
    """
    Predicts likelihood of habit success using XGBoost classifier

    Features:
    - Habit streak length
    - Check-in time consistency
    - Day-of-week patterns
    - Reminder response rate
    - Mood correlation
    - Sleep quality correlation
    - Social accountability metrics
    """

    def __init__(self, model_path: Optional[str] = None):
        """Initialize predictor with optional pre-trained model"""
        self.model = None
        self.feature_names = []
        self.model_metadata = {}

        if model_path:
            self.load_model(model_path)
        else:
            self._initialize_new_model()

    def _initialize_new_model(self):
        """Initialize new XGBoost model with optimal hyperparameters"""
        self.model = xgb.XGBClassifier(
            max_depth=6,
            learning_rate=0.1,
            n_estimators=100,
            objective='binary:logistic',
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            gamma=0.1,
            reg_alpha=0.01,
            reg_lambda=1.0,
            scale_pos_weight=1.0,
            random_state=42,
            eval_metric='logloss'
        )

        self.feature_names = [
            'streak_length',
            'check_in_consistency_score',
            'weekday_completion_rate',
            'weekend_completion_rate',
            'reminder_response_rate',
            'avg_check_in_hour',
            'check_in_time_variance',
            'days_since_creation',
            'total_check_ins',
            'completion_rate_7d',
            'completion_rate_30d',
            'mood_correlation',
            'sleep_quality_correlation',
            'has_accountability_partner',
            'partner_engagement_score',
            'habit_difficulty_rating',
            'habit_category_encoded',
            'time_of_day_encoded',
            'momentum_score',
            'recent_miss_count'
        ]

    def train(
        self,
        training_data: pd.DataFrame,
        target_column: str = 'maintained',
        test_size: float = 0.2,
        validation_split: float = 0.1
    ) -> Dict[str, float]:
        """
        Train the model on historical habit data

        Args:
            training_data: DataFrame with features and target
            target_column: Name of target variable (1=maintained, 0=abandoned)
            test_size: Proportion of data for testing
            validation_split: Proportion for early stopping validation

        Returns:
            Dictionary of evaluation metrics
        """
        # Prepare features and target
        X = training_data[self.feature_names]
        y = training_data[target_column]

        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        # Further split for validation (early stopping)
        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, test_size=validation_split, random_state=42, stratify=y_train
        )

        # Train with early stopping
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            early_stopping_rounds=10,
            verbose=False
        )

        # Evaluate on test set
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]

        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'positive_class_ratio': y_train.mean()
        }

        # Store metadata
        self.model_metadata = {
            'trained_at': datetime.now().isoformat(),
            'metrics': metrics,
            'feature_importance': self._get_feature_importance()
        }

        return metrics

    def predict_success_probability(self, habit_features: Dict[str, float]) -> float:
        """
        Predict probability that habit will be maintained

        Args:
            habit_features: Dictionary of feature values

        Returns:
            Success probability (0.0 to 1.0)
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded")

        # Convert to DataFrame with correct feature order
        feature_vector = pd.DataFrame([habit_features])[self.feature_names]

        # Predict probability
        success_prob = self.model.predict_proba(feature_vector)[0, 1]

        return float(success_prob)

    def predict_batch(self, habits_features: List[Dict[str, float]]) -> List[float]:
        """Predict success probabilities for multiple habits"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")

        # Convert to DataFrame
        features_df = pd.DataFrame(habits_features)[self.feature_names]

        # Batch prediction
        success_probs = self.model.predict_proba(features_df)[:, 1]

        return success_probs.tolist()

    def get_risk_category(self, success_probability: float) -> str:
        """
        Categorize habit based on success probability

        Returns:
            'high_success' (>0.7)
            'moderate_risk' (0.4-0.7)
            'high_risk' (<0.4)
        """
        if success_probability >= 0.7:
            return 'high_success'
        elif success_probability >= 0.4:
            return 'moderate_risk'
        else:
            return 'high_risk'

    def _get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores from trained model"""
        if self.model is None:
            return {}

        importance_scores = self.model.feature_importances_

        return {
            feature: float(score)
            for feature, score in zip(self.feature_names, importance_scores)
        }

    def get_top_features(self, n: int = 5) -> List[Tuple[str, float]]:
        """Get top N most important features"""
        importance = self._get_feature_importance()

        sorted_features = sorted(
            importance.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return sorted_features[:n]

    def save_model(self, path: str):
        """Save model and metadata to disk"""
        if self.model is None:
            raise ValueError("No model to save")

        # Save XGBoost model
        self.model.save_model(f"{path}.xgb")

        # Save metadata
        metadata = {
            'feature_names': self.feature_names,
            'metadata': self.model_metadata
        }

        with open(f"{path}_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)

    def load_model(self, path: str):
        """Load model and metadata from disk"""
        # Load XGBoost model
        self.model = xgb.XGBClassifier()
        self.model.load_model(f"{path}.xgb")

        # Load metadata
        with open(f"{path}_metadata.json", 'r') as f:
            metadata = json.load(f)

        self.feature_names = metadata['feature_names']
        self.model_metadata = metadata['metadata']

    def explain_prediction(
        self,
        habit_features: Dict[str, float],
        top_n: int = 5
    ) -> Dict[str, any]:
        """
        Explain why a prediction was made

        Returns:
            Dictionary with prediction, probability, and contributing features
        """
        success_prob = self.predict_success_probability(habit_features)
        risk_category = self.get_risk_category(success_prob)

        # Get feature contributions (simplified SHAP-like approach)
        feature_vector = pd.DataFrame([habit_features])[self.feature_names]
        importance = self._get_feature_importance()

        # Calculate weighted feature contributions
        contributions = []
        for feature_name in self.feature_names:
            feature_value = habit_features.get(feature_name, 0)
            feature_importance = importance.get(feature_name, 0)

            # Normalized contribution
            contribution = feature_value * feature_importance

            contributions.append({
                'feature': feature_name,
                'value': feature_value,
                'importance': feature_importance,
                'contribution': contribution
            })

        # Sort by absolute contribution
        contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)

        return {
            'success_probability': success_prob,
            'risk_category': risk_category,
            'prediction': 'maintained' if success_prob >= 0.5 else 'at_risk',
            'top_contributing_features': contributions[:top_n],
            'model_confidence': abs(success_prob - 0.5) * 2  # 0 to 1 scale
        }


def calculate_habit_features(habit_data: Dict) -> Dict[str, float]:
    """
    Calculate feature vector from raw habit data

    Args:
        habit_data: Dictionary containing habit check-in history and metadata

    Returns:
        Feature dictionary ready for prediction
    """
    check_ins = habit_data.get('check_ins', [])

    # Basic metrics
    streak_length = habit_data.get('current_streak', 0)
    days_since_creation = (datetime.now() - datetime.fromisoformat(habit_data['created_at'])).days
    total_check_ins = len(check_ins)

    # Check-in consistency (coefficient of variation of check-in times)
    if len(check_ins) >= 2:
        check_in_hours = [datetime.fromisoformat(c['timestamp']).hour for c in check_ins]
        avg_hour = np.mean(check_in_hours)
        time_variance = np.std(check_in_hours)
        consistency_score = 1.0 / (1.0 + time_variance)  # 0 to 1
    else:
        avg_hour = 12.0
        time_variance = 0.0
        consistency_score = 0.5

    # Day-of-week patterns
    recent_check_ins = check_ins[-30:] if len(check_ins) > 30 else check_ins
    weekday_check_ins = [c for c in recent_check_ins if datetime.fromisoformat(c['timestamp']).weekday() < 5]
    weekend_check_ins = [c for c in recent_check_ins if datetime.fromisoformat(c['timestamp']).weekday() >= 5]

    weekday_rate = len(weekday_check_ins) / max(1, len(recent_check_ins))
    weekend_rate = len(weekend_check_ins) / max(1, len(recent_check_ins))

    # Completion rates
    last_7_days = [c for c in check_ins if (datetime.now() - datetime.fromisoformat(c['timestamp'])).days <= 7]
    last_30_days = [c for c in check_ins if (datetime.now() - datetime.fromisoformat(c['timestamp'])).days <= 30]

    completion_rate_7d = len(last_7_days) / 7.0
    completion_rate_30d = len(last_30_days) / 30.0

    # Reminder response rate
    reminder_responses = habit_data.get('reminder_responses', [])
    reminder_response_rate = len([r for r in reminder_responses if r['responded']]) / max(1, len(reminder_responses))

    # Momentum score (recent trend)
    if len(check_ins) >= 7:
        recent_7 = len(last_7_days)
        previous_7 = len([c for c in check_ins if 7 < (datetime.now() - datetime.fromisoformat(c['timestamp'])).days <= 14])
        momentum_score = (recent_7 - previous_7) / 7.0
    else:
        momentum_score = 0.0

    # Recent misses
    recent_miss_count = 7 - len(last_7_days)

    return {
        'streak_length': float(streak_length),
        'check_in_consistency_score': consistency_score,
        'weekday_completion_rate': weekday_rate,
        'weekend_completion_rate': weekend_rate,
        'reminder_response_rate': reminder_response_rate,
        'avg_check_in_hour': avg_hour,
        'check_in_time_variance': time_variance,
        'days_since_creation': float(days_since_creation),
        'total_check_ins': float(total_check_ins),
        'completion_rate_7d': completion_rate_7d,
        'completion_rate_30d': completion_rate_30d,
        'mood_correlation': habit_data.get('mood_correlation', 0.0),
        'sleep_quality_correlation': habit_data.get('sleep_correlation', 0.0),
        'has_accountability_partner': float(habit_data.get('has_partner', False)),
        'partner_engagement_score': habit_data.get('partner_engagement', 0.0),
        'habit_difficulty_rating': habit_data.get('difficulty', 5.0) / 10.0,
        'habit_category_encoded': float(habit_data.get('category_id', 0)),
        'time_of_day_encoded': float(habit_data.get('time_of_day', 0)),
        'momentum_score': momentum_score,
        'recent_miss_count': float(recent_miss_count)
    }
