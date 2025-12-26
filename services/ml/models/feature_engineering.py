"""
Feature Engineering for Habit Success Prediction
Phase 11 Week 1

Transforms raw habit data into ML-ready features
Handles temporal patterns, correlations, and derived metrics
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from scipy import stats
from collections import Counter


class FeatureEngineer:
    """
    Feature engineering pipeline for habit prediction models
    """

    def __init__(self):
        self.scaler_params = {}
        self.encoders = {}

    def engineer_features(
        self,
        habit_data: Dict,
        user_data: Optional[Dict] = None,
        include_correlations: bool = True
    ) -> Dict[str, float]:
        """
        Create comprehensive feature set from raw habit data

        Args:
            habit_data: Raw habit check-in and metadata
            user_data: Optional user profile and health data
            include_correlations: Whether to calculate mood/sleep correlations

        Returns:
            Dictionary of engineered features
        """
        features = {}

        # Basic temporal features
        features.update(self._temporal_features(habit_data))

        # Pattern features
        features.update(self._pattern_features(habit_data))

        # Consistency metrics
        features.update(self._consistency_features(habit_data))

        # Momentum indicators
        features.update(self._momentum_features(habit_data))

        # Social features
        features.update(self._social_features(habit_data))

        # Correlation features (if user data available)
        if include_correlations and user_data:
            features.update(self._correlation_features(habit_data, user_data))

        # Derived features
        features.update(self._derived_features(features))

        return features

    def _temporal_features(self, habit_data: Dict) -> Dict[str, float]:
        """Extract time-based features"""
        check_ins = habit_data.get('check_ins', [])
        created_at = datetime.fromisoformat(habit_data['created_at'])

        return {
            'streak_length': float(habit_data.get('current_streak', 0)),
            'days_since_creation': (datetime.now() - created_at).days,
            'total_check_ins': len(check_ins),
            'habit_age_weeks': (datetime.now() - created_at).days / 7.0,
            'check_ins_per_week': len(check_ins) / max(1, (datetime.now() - created_at).days / 7.0)
        }

    def _pattern_features(self, habit_data: Dict) -> Dict[str, float]:
        """Extract behavioral patterns"""
        check_ins = habit_data.get('check_ins', [])

        if not check_ins:
            return {
                'weekday_completion_rate': 0.0,
                'weekend_completion_rate': 0.0,
                'morning_check_in_rate': 0.0,
                'evening_check_in_rate': 0.0,
                'most_common_hour': 12.0,
                'hour_entropy': 0.0
            }

        # Convert to datetime objects
        timestamps = [datetime.fromisoformat(c['timestamp']) for c in check_ins]

        # Day of week patterns
        weekdays = [t.weekday() for t in timestamps]
        weekday_count = sum(1 for d in weekdays if d < 5)
        weekend_count = sum(1 for d in weekdays if d >= 5)

        # Time of day patterns
        hours = [t.hour for t in timestamps]
        morning_count = sum(1 for h in hours if 5 <= h < 12)
        evening_count = sum(1 for h in hours if 17 <= h < 22)

        # Hour distribution entropy (measure of consistency)
        hour_counts = Counter(hours)
        hour_probs = np.array(list(hour_counts.values())) / len(hours)
        hour_entropy = stats.entropy(hour_probs)

        return {
            'weekday_completion_rate': weekday_count / max(1, len(check_ins)),
            'weekend_completion_rate': weekend_count / max(1, len(check_ins)),
            'morning_check_in_rate': morning_count / len(check_ins),
            'evening_check_in_rate': evening_count / len(check_ins),
            'most_common_hour': float(Counter(hours).most_common(1)[0][0]) if hours else 12.0,
            'hour_entropy': float(hour_entropy)
        }

    def _consistency_features(self, habit_data: Dict) -> Dict[str, float]:
        """Measure consistency and regularity"""
        check_ins = habit_data.get('check_ins', [])

        if len(check_ins) < 2:
            return {
                'check_in_consistency_score': 0.5,
                'avg_check_in_hour': 12.0,
                'check_in_time_variance': 0.0,
                'inter_checkin_mean_days': 0.0,
                'inter_checkin_std_days': 0.0,
                'regularity_score': 0.5
            }

        timestamps = [datetime.fromisoformat(c['timestamp']) for c in check_ins]

        # Time of day consistency
        hours = [t.hour + t.minute/60.0 for t in timestamps]
        avg_hour = np.mean(hours)
        hour_std = np.std(hours)
        consistency_score = 1.0 / (1.0 + hour_std)  # Lower variance = higher consistency

        # Inter-check-in intervals
        intervals = [(timestamps[i+1] - timestamps[i]).days for i in range(len(timestamps)-1)]
        mean_interval = np.mean(intervals) if intervals else 0.0
        std_interval = np.std(intervals) if len(intervals) > 1 else 0.0

        # Regularity score (how close to expected frequency)
        expected_freq = habit_data.get('target_frequency', 1)  # days
        regularity = 1.0 - min(1.0, abs(mean_interval - expected_freq) / max(1, expected_freq))

        return {
            'check_in_consistency_score': float(consistency_score),
            'avg_check_in_hour': float(avg_hour),
            'check_in_time_variance': float(hour_std),
            'inter_checkin_mean_days': float(mean_interval),
            'inter_checkin_std_days': float(std_interval),
            'regularity_score': float(regularity)
        }

    def _momentum_features(self, habit_data: Dict) -> Dict[str, float]:
        """Calculate momentum and trend indicators"""
        check_ins = habit_data.get('check_ins', [])

        # Time windows
        now = datetime.now()
        last_7 = [c for c in check_ins if (now - datetime.fromisoformat(c['timestamp'])).days <= 7]
        last_14 = [c for c in check_ins if (now - datetime.fromisoformat(c['timestamp'])).days <= 14]
        last_30 = [c for c in check_ins if (now - datetime.fromisoformat(c['timestamp'])).days <= 30]

        # Completion rates by window
        rate_7d = len(last_7) / 7.0
        rate_30d = len(last_30) / 30.0

        # Momentum (comparing recent vs previous period)
        prev_7_count = len([c for c in check_ins if 7 < (now - datetime.fromisoformat(c['timestamp'])).days <= 14])
        momentum = (len(last_7) - prev_7_count) / 7.0

        # Recent miss count
        recent_misses = 7 - len(last_7)

        # Trend (linear regression on recent completions)
        if len(last_30) >= 3:
            days_ago = [(now - datetime.fromisoformat(c['timestamp'])).days for c in last_30]
            trend_slope, _ = np.polyfit(days_ago, [1]*len(days_ago), 1)
        else:
            trend_slope = 0.0

        return {
            'completion_rate_7d': float(rate_7d),
            'completion_rate_30d': float(rate_30d),
            'momentum_score': float(momentum),
            'recent_miss_count': float(recent_misses),
            'trend_slope': float(trend_slope),
            'acceleration': float(rate_7d - rate_30d)  # Recent vs longer-term rate
        }

    def _social_features(self, habit_data: Dict) -> Dict[str, float]:
        """Extract social accountability features"""
        has_partner = habit_data.get('accountability_partner_id') is not None

        # Partner engagement metrics
        partner_check_ins = habit_data.get('partner_check_ins', [])
        partner_messages = habit_data.get('partner_messages', [])

        partner_engagement = 0.0
        if has_partner and (partner_check_ins or partner_messages):
            # Calculate engagement score
            recent_interactions = len([
                p for p in partner_check_ins + partner_messages
                if (datetime.now() - datetime.fromisoformat(p['timestamp'])).days <= 7
            ])
            partner_engagement = min(1.0, recent_interactions / 7.0)

        # Reminder response rate
        reminders = habit_data.get('reminder_sent', [])
        if reminders:
            responded = sum(1 for r in reminders if r.get('responded', False))
            response_rate = responded / len(reminders)
        else:
            response_rate = 0.5  # Neutral default

        return {
            'has_accountability_partner': float(has_partner),
            'partner_engagement_score': float(partner_engagement),
            'reminder_response_rate': float(response_rate),
            'social_support_score': (float(has_partner) + partner_engagement + response_rate) / 3.0
        }

    def _correlation_features(self, habit_data: Dict, user_data: Dict) -> Dict[str, float]:
        """Calculate correlations with mood and sleep"""
        check_ins = habit_data.get('check_ins', [])
        mood_logs = user_data.get('mood_logs', [])
        sleep_logs = user_data.get('sleep_logs', [])

        # Mood correlation
        if check_ins and mood_logs:
            mood_corr = self._calculate_temporal_correlation(check_ins, mood_logs, 'mood_score')
        else:
            mood_corr = 0.0

        # Sleep correlation
        if check_ins and sleep_logs:
            sleep_corr = self._calculate_temporal_correlation(check_ins, sleep_logs, 'quality_score')
        else:
            sleep_corr = 0.0

        return {
            'mood_correlation': float(mood_corr),
            'sleep_quality_correlation': float(sleep_corr)
        }

    def _calculate_temporal_correlation(
        self,
        check_ins: List[Dict],
        logs: List[Dict],
        log_field: str
    ) -> float:
        """Calculate correlation between check-ins and another metric"""
        # Align check-ins with logs by date
        check_in_dates = {datetime.fromisoformat(c['timestamp']).date() for c in check_ins}
        log_dict = {
            datetime.fromisoformat(l['timestamp']).date(): l[log_field]
            for l in logs
        }

        # Find overlapping dates
        common_dates = sorted(check_in_dates & set(log_dict.keys()))

        if len(common_dates) < 3:
            return 0.0  # Not enough data

        # Create binary check-in vector and continuous log vector
        check_in_vector = [1 if d in check_in_dates else 0 for d in common_dates]
        log_vector = [log_dict[d] for d in common_dates]

        # Calculate correlation
        if len(set(check_in_vector)) < 2 or len(set(log_vector)) < 2:
            return 0.0  # No variance

        corr, _ = stats.pearsonr(check_in_vector, log_vector)

        return float(corr) if not np.isnan(corr) else 0.0

    def _derived_features(self, features: Dict[str, float]) -> Dict[str, float]:
        """Create derived features from existing ones"""
        derived = {}

        # Habit maturity indicator
        if features.get('days_since_creation', 0) > 0:
            maturity = min(1.0, features['days_since_creation'] / 90.0)  # 90 days = mature
        else:
            maturity = 0.0

        # Overall engagement score
        engagement = (
            features.get('completion_rate_30d', 0) * 0.4 +
            features.get('consistency_score', 0) * 0.3 +
            features.get('social_support_score', 0) * 0.3
        )

        # Risk indicators
        high_variance = features.get('check_in_time_variance', 0) > 4.0
        declining_momentum = features.get('momentum_score', 0) < -0.1
        low_recent_rate = features.get('completion_rate_7d', 0) < 0.5

        risk_flags = sum([high_variance, declining_momentum, low_recent_rate])

        derived.update({
            'habit_maturity': float(maturity),
            'overall_engagement_score': float(engagement),
            'risk_flag_count': float(risk_flags),
            'habit_category_encoded': features.get('habit_category_encoded', 0.0),
            'time_of_day_encoded': features.get('time_of_day_encoded', 0.0),
            'habit_difficulty_rating': features.get('habit_difficulty_rating', 0.5)
        })

        return derived


def prepare_training_dataset(
    habits_history: List[Dict],
    user_profiles: Dict[str, Dict],
    lookback_days: int = 90
) -> pd.DataFrame:
    """
    Prepare training dataset from historical habit data

    Args:
        habits_history: List of habit records with check-in history
        user_profiles: User profile data keyed by user_id
        lookback_days: How far back to look for features

    Returns:
        DataFrame ready for model training
    """
    engineer = FeatureEngineer()
    training_records = []

    for habit in habits_history:
        user_id = habit['user_id']
        user_data = user_profiles.get(user_id, {})

        # Engineer features
        features = engineer.engineer_features(habit, user_data)

        # Add target variable (maintained = 1, abandoned = 0)
        features['maintained'] = int(habit.get('is_active', False) or habit.get('completed', False))
        features['habit_id'] = habit['id']
        features['user_id'] = user_id

        training_records.append(features)

    return pd.DataFrame(training_records)
