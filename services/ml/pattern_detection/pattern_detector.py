"""
Pattern Detector
Phase 11 Week 4

Time-series clustering for habit performance and behavioral
pattern classification using K-means and DBSCAN
"""

import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any
import json


class PatternDetector:
    """Detects behavioral patterns in user habit data"""

    PATTERN_TYPES = {
        'weekend_warrior': 'High weekend activity, lower weekday performance',
        'steady_eddie': 'Consistent daily performer across all days',
        'burst_mode': 'Intense streaks followed by breaks',
        'struggling_starter': 'Frequent early abandonment, low completion rates',
        'morning_person': 'High completion rates in morning hours',
        'evening_person': 'Peak performance in evening hours'
    }

    def __init__(self, n_clusters: int = 5):
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        self.dbscan = DBSCAN(eps=0.5, min_samples=5)

    def extract_temporal_features(self, user_data: Dict[str, Any]) -> np.ndarray:
        """
        Extract 15 temporal features from user habit data

        Features:
        1-7: Completion rate per day of week (Mon-Sun)
        8: Weekend vs weekday ratio
        9-12: Completion rate by time of day (morning/afternoon/evening/night)
        13: Average streak length
        14: Streak variability (std dev)
        15: Total active days
        """
        features = []

        # Day of week completion rates (7 features)
        day_rates = user_data.get('day_of_week_rates', [0] * 7)
        features.extend(day_rates)

        # Weekend vs weekday ratio (1 feature)
        weekend_rate = np.mean([day_rates[5], day_rates[6]])  # Sat, Sun
        weekday_rate = np.mean([day_rates[i] for i in range(5)])  # Mon-Fri
        weekend_weekday_ratio = weekend_rate / (weekday_rate + 0.01)
        features.append(weekend_weekday_ratio)

        # Time of day completion rates (4 features)
        time_rates = user_data.get('time_of_day_rates', {
            'morning': 0,
            'afternoon': 0,
            'evening': 0,
            'night': 0
        })
        features.extend([
            time_rates.get('morning', 0),
            time_rates.get('afternoon', 0),
            time_rates.get('evening', 0),
            time_rates.get('night', 0)
        ])

        # Streak statistics (3 features)
        features.append(user_data.get('avg_streak_length', 0))
        features.append(user_data.get('streak_std_dev', 0))
        features.append(user_data.get('total_active_days', 0))

        return np.array(features)

    def classify_pattern(self, features: np.ndarray) -> str:
        """
        Classify user into behavioral pattern type

        Args:
            features: 15-element feature vector

        Returns:
            Pattern type label
        """
        # Extract key features for rule-based classification
        day_rates = features[0:7]
        weekend_weekday_ratio = features[7]
        time_rates = features[8:12]  # morning, afternoon, evening, night
        avg_streak = features[12]
        streak_variability = features[13]

        # Weekend Warrior: Weekend rate > 1.5x weekday rate
        if weekend_weekday_ratio > 1.5:
            return 'weekend_warrior'

        # Steady Eddie: Low variability across days
        if np.std(day_rates) < 10 and avg_streak > 14:
            return 'steady_eddie'

        # Burst Mode: High streak variability
        if streak_variability > 10 and avg_streak > 7:
            return 'burst_mode'

        # Struggling Starter: Low completion, short streaks
        if avg_streak < 7 and np.mean(day_rates) < 50:
            return 'struggling_starter'

        # Morning Person: Morning rate > 1.3x other times
        if time_rates[0] > max(time_rates[1:]) * 1.3:
            return 'morning_person'

        # Evening Person: Evening/night rate > 1.3x other times
        if max(time_rates[2:]) > max(time_rates[:2]) * 1.3:
            return 'evening_person'

        return 'steady_eddie'  # Default

    def fit_clusters(self, user_features: List[np.ndarray]) -> Dict[str, Any]:
        """
        Fit K-means clustering on user feature vectors

        Args:
            user_features: List of feature vectors for multiple users

        Returns:
            Clustering results with centroids and labels
        """
        X = np.vstack(user_features)

        # Standardize features
        X_scaled = self.scaler.fit_transform(X)

        # Fit K-means
        self.kmeans.fit(X_scaled)

        return {
            'labels': self.kmeans.labels_.tolist(),
            'centroids': self.scaler.inverse_transform(self.kmeans.cluster_centers_).tolist(),
            'inertia': float(self.kmeans.inertia_)
        }

    def detect_anomalies(self, user_features: List[np.ndarray]) -> List[int]:
        """
        Detect anomalous patterns using DBSCAN

        Args:
            user_features: List of feature vectors

        Returns:
            Indices of anomalous users (outliers)
        """
        X = np.vstack(user_features)
        X_scaled = self.scaler.fit_transform(X)

        # Fit DBSCAN
        labels = self.dbscan.fit_predict(X_scaled)

        # Anomalies are labeled as -1
        anomaly_indices = np.where(labels == -1)[0].tolist()

        return anomaly_indices

    def predict_pattern(self, new_user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict behavioral pattern for new user

        Args:
            new_user_data: User habit data dictionary

        Returns:
            Pattern classification and recommendations
        """
        features = self.extract_temporal_features(new_user_data)
        pattern_type = self.classify_pattern(features)

        return {
            'pattern_type': pattern_type,
            'description': self.PATTERN_TYPES[pattern_type],
            'features': features.tolist(),
            'recommendations': self._get_recommendations(pattern_type)
        }

    def _get_recommendations(self, pattern_type: str) -> List[str]:
        """Get personalized recommendations based on pattern"""
        recommendations = {
            'weekend_warrior': [
                'Try to maintain consistency on weekdays',
                'Set smaller weekday goals to build momentum',
                'Use weekend success as motivation for the week'
            ],
            'steady_eddie': [
                'Great consistency! Consider adding challenging habits',
                'Share your strategies with others',
                'Set ambitious long-term goals'
            ],
            'burst_mode': [
                'Focus on sustainable daily habits',
                'Reduce habit difficulty during low-energy periods',
                'Build recovery strategies before breaks'
            ],
            'struggling_starter': [
                'Start with one very easy habit',
                'Lower your expectations temporarily',
                'Find an accountability partner'
            ],
            'morning_person': [
                'Schedule important habits in the morning',
                'Stack new habits with morning routine',
                'Use morning momentum for difficult tasks'
            ],
            'evening_person': [
                'Schedule habits for evening hours',
                'Avoid morning commitments when possible',
                'Use evening energy for creative habits'
            ]
        }

        return recommendations.get(pattern_type, [])


# Example usage
if __name__ == '__main__':
    detector = PatternDetector()

    # Sample user data
    user_data = {
        'day_of_week_rates': [70, 75, 72, 68, 65, 45, 40],  # Mon-Sun
        'time_of_day_rates': {
            'morning': 85,
            'afternoon': 60,
            'evening': 50,
            'night': 30
        },
        'avg_streak_length': 21,
        'streak_std_dev': 5,
        'total_active_days': 120
    }

    result = detector.predict_pattern(user_data)
    print(json.dumps(result, indent=2))
