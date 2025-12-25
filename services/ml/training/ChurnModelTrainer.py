"""
Churn Prediction Model Trainer

Trains XGBoost model for predicting user churn
Target accuracy: >89%
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
from sklearn.preprocessing import StandardScaler
import joblib
import tensorflowjs as tfjs
import tensorflow as tf

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from DataPipeline import DataPipeline
from ModelValidator import ModelValidator


class ChurnModelTrainer:
    """
    Churn prediction model trainer with XGBoost
    """

    def __init__(self, db_connection_string: str):
        self.db_connection_string = db_connection_string
        self.data_pipeline = DataPipeline(db_connection_string)
        self.validator = ModelValidator()

        self.feature_names = [
            'days_since_last_checkin',
            'completion_rate_7d',
            'completion_rate_14d',
            'session_frequency_14d',
            'avg_session_duration_14d',
            'goal_progress_rate',
            'days_on_platform',
        ]

        self.scaler = StandardScaler()
        self.model = None
        self.model_metadata = {}

    def load_data(self, lookback_days: int = 90) -> pd.DataFrame:
        """
        Load training data from database
        """
        print(f"Loading data for last {lookback_days} days...")

        query = f"""
        WITH user_features AS (
          SELECT
            u.id as user_id,
            EXTRACT(EPOCH FROM (NOW() - MAX(hc.created_at))) / 86400 as days_since_last_checkin,

            -- 7-day completion rate
            COALESCE(
              CAST(COUNT(*) FILTER (WHERE hc.status = 'completed' AND hc.created_at >= NOW() - INTERVAL '7 days') AS FLOAT) /
              NULLIF(COUNT(*) FILTER (WHERE hc.created_at >= NOW() - INTERVAL '7 days'), 0),
              0
            ) as completion_rate_7d,

            -- 14-day completion rate
            COALESCE(
              CAST(COUNT(*) FILTER (WHERE hc.status = 'completed' AND hc.created_at >= NOW() - INTERVAL '14 days') AS FLOAT) /
              NULLIF(COUNT(*) FILTER (WHERE hc.created_at >= NOW() - INTERVAL '14 days'), 0),
              0
            ) as completion_rate_14d,

            -- Session frequency (sessions per day in last 14 days)
            COALESCE(
              CAST(COUNT(DISTINCT us.id) FILTER (WHERE us.created_at >= NOW() - INTERVAL '14 days') AS FLOAT) / 14.0,
              0
            ) as session_frequency_14d,

            -- Avg session duration (minutes)
            COALESCE(
              AVG(EXTRACT(EPOCH FROM (us.logout_at - us.login_at)) / 60.0) FILTER (WHERE us.created_at >= NOW() - INTERVAL '14 days' AND us.logout_at IS NOT NULL),
              0
            ) as avg_session_duration_14d,

            -- Goal progress rate
            COALESCE(
              AVG(g.progress_percentage) FILTER (WHERE g.status = 'active'),
              0
            ) / 100.0 as goal_progress_rate,

            -- Days on platform
            EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400 as days_on_platform,

            -- Churn label (1 if churned, 0 if active)
            CASE
              WHEN MAX(us.created_at) < NOW() - INTERVAL '30 days' THEN 1
              ELSE 0
            END as churned

          FROM users u
          LEFT JOIN habit_checkins hc ON u.id = hc.user_id
          LEFT JOIN user_sessions us ON u.id = us.user_id
          LEFT JOIN goals g ON u.id = g.user_id
          WHERE u.created_at >= NOW() - INTERVAL '{lookback_days} days'
          GROUP BY u.id
          HAVING COUNT(hc.id) > 5  -- At least 5 checkins to be meaningful
        )
        SELECT * FROM user_features
        """

        df = self.data_pipeline.load_from_query(query)

        print(f"Loaded {len(df)} user records")
        print(f"Churn rate: {df['churned'].mean():.2%}")
        print(f"Class distribution:\n{df['churned'].value_counts()}")

        return df

    def prepare_features(self, df: pd.DataFrame):
        """
        Prepare features and labels
        """
        X = df[self.feature_names].values
        y = df['churned'].values

        # Handle missing values
        X = np.nan_to_num(X, nan=0.0)

        # Normalize features
        X = self.scaler.fit_transform(X)

        return X, y

    def train(
        self,
        X_train,
        y_train,
        X_val,
        y_val,
        params: dict = None
    ):
        """
        Train XGBoost model
        """
        if params is None:
            params = {
                'max_depth': 6,
                'learning_rate': 0.1,
                'n_estimators': 200,
                'objective': 'binary:logistic',
                'eval_metric': 'auc',
                'early_stopping_rounds': 20,
                'random_state': 42,
                'scale_pos_weight': len(y_train[y_train == 0]) / len(y_train[y_train == 1]),  # Handle imbalance
            }

        print("Training XGBoost model...")
        print(f"Parameters: {params}")

        self.model = xgb.XGBClassifier(**params)

        self.model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            verbose=True
        )

        print("Training completed!")

    def evaluate(self, X_test, y_test):
        """
        Evaluate model performance
        """
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
        for metric, value in metrics.items():
            print(f"{metric}: {value:.4f}")

        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, y_pred))

        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))

        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        print("\nFeature Importance:")
        print(feature_importance)

        self.model_metadata = {
            'metrics': metrics,
            'feature_importance': feature_importance.to_dict('records'),
            'training_date': datetime.now().isoformat(),
            'model_type': 'xgboost',
            'target_accuracy': 0.89,
        }

        return metrics

    def cross_validate(self, X, y, cv: int = 5):
        """
        Perform cross-validation
        """
        print(f"\nPerforming {cv}-fold cross-validation...")

        skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)

        scores = cross_val_score(
            self.model,
            X,
            y,
            cv=skf,
            scoring='roc_auc'
        )

        print(f"Cross-validation AUC scores: {scores}")
        print(f"Mean AUC: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")

        return scores

    def save_model(self, output_dir: str = './models/churn-predictor'):
        """
        Save model in multiple formats
        """
        os.makedirs(output_dir, exist_ok=True)

        # Save XGBoost model
        joblib.dump(self.model, os.path.join(output_dir, 'model.pkl'))
        print(f"Saved XGBoost model to {output_dir}/model.pkl")

        # Save scaler
        joblib.dump(self.scaler, os.path.join(output_dir, 'scaler.pkl'))
        print(f"Saved scaler to {output_dir}/scaler.pkl")

        # Save metadata
        with open(os.path.join(output_dir, 'metadata.json'), 'w') as f:
            json.dump(self.model_metadata, f, indent=2)
        print(f"Saved metadata to {output_dir}/metadata.json")

        # Convert to TensorFlow.js format
        self.convert_to_tfjs(output_dir)

    def convert_to_tfjs(self, output_dir: str):
        """
        Convert XGBoost model to TensorFlow.js format
        """
        print("Converting to TensorFlow.js format...")

        # Create simple TF model that mimics XGBoost predictions
        # This is a simplified conversion - for production, consider using ONNX

        # Get predictions on sample data to learn the mapping
        X_sample = np.random.randn(1000, len(self.feature_names))
        y_sample_proba = self.model.predict_proba(X_sample)[:, 1]

        # Train a simple neural network to approximate XGBoost
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(32, activation='relu', input_shape=(len(self.feature_names),)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])

        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )

        model.fit(X_sample, y_sample_proba, epochs=50, batch_size=32, verbose=0)

        # Save as TensorFlow.js
        tfjs_dir = os.path.join(output_dir, 'tfjs')
        tfjs.converters.save_keras_model(model, tfjs_dir)

        print(f"Saved TensorFlow.js model to {tfjs_dir}")

    def run_pipeline(self):
        """
        Run complete training pipeline
        """
        print("=== Churn Model Training Pipeline ===\n")

        # Load data
        df = self.load_data(lookback_days=90)

        # Prepare features
        X, y = self.prepare_features(df)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=0.2,
            random_state=42,
            stratify=y
        )

        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train,
            test_size=0.2,
            random_state=42,
            stratify=y_train
        )

        print(f"Train set: {len(X_train)} samples")
        print(f"Validation set: {len(X_val)} samples")
        print(f"Test set: {len(X_test)} samples\n")

        # Train model
        self.train(X_train, y_train, X_val, y_val)

        # Evaluate on test set
        metrics = self.evaluate(X_test, y_test)

        # Cross-validation
        self.cross_validate(X, y)

        # Validate model meets requirements
        if self.validator.validate_churn_model(metrics):
            print("\n✅ Model meets performance requirements!")

            # Save model
            self.save_model()

            print("\n✅ Training pipeline completed successfully!")
        else:
            print("\n❌ Model does not meet performance requirements. Tune hyperparameters and retrain.")


if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    db_connection_string = os.getenv('DATABASE_URL')

    if not db_connection_string:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    trainer = ChurnModelTrainer(db_connection_string)
    trainer.run_pipeline()
