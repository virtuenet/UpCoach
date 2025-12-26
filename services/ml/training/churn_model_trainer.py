"""
Churn Prediction Model Trainer (Phase 8)

Trains XGBoost model to predict user churn risk

Features:
- Behavioral features (login frequency, session duration)
- Engagement features (goals created, habits tracked)
- Temporal features (days since signup, last activity)
- Model versioning and artifact storage
- Performance evaluation and monitoring
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import json
import os

class ChurnModelTrainer:
    def __init__(self, db_connection_string: str, model_output_dir: str = './models'):
        self.db_conn = db_connection_string
        self.model_output_dir = model_output_dir
        self.model = None
        self.feature_names = []

    def extract_features(self) -> pd.DataFrame:
        """
        Extract features from database

        Returns:
            DataFrame with features and target variable
        """
        # In production: Connect to PostgreSQL and extract features
        # For now, create mock feature extraction query

        query = """
        WITH user_stats AS (
            SELECT
                u.id as user_id,
                EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400 as days_since_signup,
                EXTRACT(EPOCH FROM (NOW() - u.last_login_at)) / 86400 as days_since_last_login,
                u.login_count,
                u.total_session_duration_minutes,

                -- Goal statistics
                COALESCE(g.total_goals, 0) as total_goals,
                COALESCE(g.active_goals, 0) as active_goals,
                COALESCE(g.completed_goals, 0) as completed_goals,
                COALESCE(g.avg_goal_progress, 0) as avg_goal_progress,

                -- Habit statistics
                COALESCE(h.total_habits, 0) as total_habits,
                COALESCE(h.active_habits, 0) as active_habits,
                COALESCE(h.total_checkins, 0) as total_checkins,
                COALESCE(h.avg_streak, 0) as avg_streak,
                COALESCE(h.longest_streak, 0) as longest_streak,

                -- Engagement metrics
                COALESCE(up.engagement_score, 50.0) as engagement_score,
                COALESCE(up.churn_risk_score, 0.5) as current_churn_risk,

                -- Target: churned in next 30 days
                CASE
                    WHEN u.last_login_at < NOW() - INTERVAL '30 days' THEN 1
                    ELSE 0
                END as churned

            FROM users u
            LEFT JOIN (
                SELECT
                    user_id,
                    COUNT(*) as total_goals,
                    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_goals,
                    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_goals,
                    AVG(progress) as avg_goal_progress
                FROM goals
                GROUP BY user_id
            ) g ON u.id = g.user_id
            LEFT JOIN (
                SELECT
                    user_id,
                    COUNT(*) as total_habits,
                    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_habits,
                    SUM(total_checkins) as total_checkins,
                    AVG(streak) as avg_streak,
                    MAX(longest_streak) as longest_streak
                FROM habits
                GROUP BY user_id
            ) h ON u.id = h.user_id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.created_at < NOW() - INTERVAL '60 days'
        )
        SELECT * FROM user_stats
        """

        # Mock data for demonstration
        print("Extracting features from database...")

        # In production: df = pd.read_sql(query, self.db_conn)
        # Generate mock data
        np.random.seed(42)
        n_samples = 10000

        df = pd.DataFrame({
            'user_id': [f'user_{i}' for i in range(n_samples)],
            'days_since_signup': np.random.exponential(90, n_samples),
            'days_since_last_login': np.random.exponential(10, n_samples),
            'login_count': np.random.poisson(50, n_samples),
            'total_session_duration_minutes': np.random.exponential(500, n_samples),
            'total_goals': np.random.poisson(3, n_samples),
            'active_goals': np.random.poisson(2, n_samples),
            'completed_goals': np.random.poisson(1, n_samples),
            'avg_goal_progress': np.random.uniform(0, 100, n_samples),
            'total_habits': np.random.poisson(5, n_samples),
            'active_habits': np.random.poisson(3, n_samples),
            'total_checkins': np.random.poisson(100, n_samples),
            'avg_streak': np.random.exponential(10, n_samples),
            'longest_streak': np.random.exponential(20, n_samples),
            'engagement_score': np.random.uniform(20, 90, n_samples),
            'current_churn_risk': np.random.uniform(0, 1, n_samples),
        })

        # Create target based on heuristics
        df['churned'] = (
            (df['days_since_last_login'] > 30) |
            ((df['engagement_score'] < 30) & (df['active_goals'] == 0))
        ).astype(int)

        print(f"Extracted {len(df)} samples")
        print(f"Churn rate: {df['churned'].mean():.2%}")

        return df

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create derived features
        """
        print("Engineering features...")

        # Interaction features
        df['goals_per_day'] = df['total_goals'] / (df['days_since_signup'] + 1)
        df['checkins_per_habit'] = df['total_checkins'] / (df['total_habits'] + 1)
        df['session_duration_per_login'] = df['total_session_duration_minutes'] / (df['login_count'] + 1)
        df['goal_completion_rate'] = df['completed_goals'] / (df['total_goals'] + 1)
        df['habit_engagement'] = df['avg_streak'] / (df['total_habits'] + 1)

        # Recency features
        df['login_recency_score'] = 1 / (df['days_since_last_login'] + 1)
        df['is_new_user'] = (df['days_since_signup'] < 30).astype(int)

        print(f"Total features: {len(df.columns) - 2}")  # Exclude user_id and churned

        return df

    def train_model(self, df: pd.DataFrame):
        """
        Train XGBoost churn prediction model
        """
        print("Training model...")

        # Prepare data
        feature_cols = [col for col in df.columns if col not in ['user_id', 'churned']]
        X = df[feature_cols]
        y = df['churned']

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")

        # Train XGBoost
        self.model = xgb.XGBClassifier(
            max_depth=6,
            learning_rate=0.1,
            n_estimators=100,
            objective='binary:logistic',
            eval_metric='auc',
            random_state=42
        )

        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )

        # Evaluate
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]

        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
        }

        print("\n=== Model Performance ===")
        for metric_name, value in metrics.items():
            print(f"{metric_name}: {value:.4f}")

        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': feature_cols,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        print("\n=== Top 10 Most Important Features ===")
        print(feature_importance.head(10))

        self.feature_names = feature_cols

        return metrics, feature_importance

    def save_model(self, metrics: dict, feature_importance: pd.DataFrame):
        """
        Save model and metadata
        """
        os.makedirs(self.model_output_dir, exist_ok=True)

        version = datetime.now().strftime('%Y%m%d_%H%M%S')
        model_path = os.path.join(self.model_output_dir, f'churn_model_{version}.json')
        metadata_path = os.path.join(self.model_output_dir, f'churn_model_{version}_metadata.json')

        # Save model
        self.model.save_model(model_path)
        print(f"\nModel saved to: {model_path}")

        # Save metadata
        metadata = {
            'version': version,
            'trained_at': datetime.now().isoformat(),
            'metrics': metrics,
            'features': self.feature_names,
            'feature_importance': feature_importance.to_dict('records')[:20],
            'model_type': 'XGBClassifier',
            'model_params': self.model.get_params(),
        }

        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"Metadata saved to: {metadata_path}")

        return model_path, metadata_path


def main():
    """
    Main training pipeline
    """
    # Configuration
    DB_CONN = os.getenv('DATABASE_URL', 'postgresql://localhost/upcoach')
    MODEL_DIR = os.getenv('MODEL_OUTPUT_DIR', './models')

    # Initialize trainer
    trainer = ChurnModelTrainer(DB_CONN, MODEL_DIR)

    # Extract data
    df = trainer.extract_features()

    # Engineer features
    df = trainer.engineer_features(df)

    # Train model
    metrics, feature_importance = trainer.train_model(df)

    # Save model
    model_path, metadata_path = trainer.save_model(metrics, feature_importance)

    print("\n=== Training Complete ===")
    print(f"Model accuracy: {metrics['accuracy']:.2%}")
    print(f"ROC AUC: {metrics['roc_auc']:.4f}")
    print(f"\nNext steps:")
    print(f"1. Deploy model to production: {model_path}")
    print(f"2. Monitor model performance with drift detection")
    print(f"3. Schedule retraining (recommended: monthly)")


if __name__ == '__main__':
    main()
