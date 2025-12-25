"""
Data Pipeline for ML Training

Handles data extraction, transformation, and loading (ETL)
"""

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from typing import Optional, List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataPipeline:
    """
    Data pipeline for ML model training
    """

    def __init__(self, db_connection_string: str):
        self.engine = create_engine(db_connection_string)

    def load_from_query(self, query: str) -> pd.DataFrame:
        """
        Load data from SQL query
        """
        try:
            df = pd.read_sql(query, self.engine)
            logger.info(f"Loaded {len(df)} rows from database")
            return df
        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise

    def load_user_features(
        self,
        user_ids: Optional[List[str]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Load user features for training
        """
        where_clauses = []

        if user_ids:
            user_ids_str = "', '".join(user_ids)
            where_clauses.append(f"u.id IN ('{user_ids_str}')")

        if start_date:
            where_clauses.append(f"u.created_at >= '{start_date}'")

        if end_date:
            where_clauses.append(f"u.created_at <= '{end_date}'")

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        query = f"""
        SELECT
          u.id as user_id,
          u.created_at as user_created_at,
          COUNT(DISTINCT hc.id) as total_checkins,
          COUNT(DISTINCT g.id) as total_goals,
          COUNT(DISTINCT us.id) as total_sessions,
          u.subscription_tier
        FROM users u
        LEFT JOIN habit_checkins hc ON u.id = hc.user_id
        LEFT JOIN goals g ON u.id = g.user_id
        LEFT JOIN user_sessions us ON u.id = us.user_id
        WHERE {where_sql}
        GROUP BY u.id, u.created_at, u.subscription_tier
        """

        return self.load_from_query(query)

    def handle_missing_values(
        self,
        df: pd.DataFrame,
        strategy: str = 'mean',
        fill_value: float = 0.0
    ) -> pd.DataFrame:
        """
        Handle missing values in dataset
        """
        if strategy == 'mean':
            return df.fillna(df.mean())
        elif strategy == 'median':
            return df.fillna(df.median())
        elif strategy == 'constant':
            return df.fillna(fill_value)
        elif strategy == 'drop':
            return df.dropna()
        else:
            raise ValueError(f"Unknown strategy: {strategy}")

    def remove_outliers(
        self,
        df: pd.DataFrame,
        columns: List[str],
        n_std: float = 3.0
    ) -> pd.DataFrame:
        """
        Remove outliers using z-score method
        """
        df_clean = df.copy()

        for col in columns:
            if col not in df_clean.columns:
                continue

            mean = df_clean[col].mean()
            std = df_clean[col].std()

            lower_bound = mean - n_std * std
            upper_bound = mean + n_std * std

            df_clean = df_clean[
                (df_clean[col] >= lower_bound) & (df_clean[col] <= upper_bound)
            ]

        logger.info(f"Removed {len(df) - len(df_clean)} outlier rows")

        return df_clean

    def balance_dataset(
        self,
        df: pd.DataFrame,
        target_column: str,
        method: str = 'undersample'
    ) -> pd.DataFrame:
        """
        Balance imbalanced dataset
        """
        from imblearn.under_sampling import RandomUnderSampler
        from imblearn.over_sampling import RandomOverSampler, SMOTE

        X = df.drop(columns=[target_column])
        y = df[target_column]

        if method == 'undersample':
            sampler = RandomUnderSampler(random_state=42)
        elif method == 'oversample':
            sampler = RandomOverSampler(random_state=42)
        elif method == 'smote':
            sampler = SMOTE(random_state=42)
        else:
            raise ValueError(f"Unknown method: {method}")

        X_resampled, y_resampled = sampler.fit_resample(X, y)

        df_balanced = pd.concat([X_resampled, y_resampled], axis=1)

        logger.info(f"Balanced dataset from {len(df)} to {len(df_balanced)} rows")
        logger.info(f"Class distribution:\n{df_balanced[target_column].value_counts()}")

        return df_balanced

    def create_time_based_splits(
        self,
        df: pd.DataFrame,
        date_column: str,
        train_ratio: float = 0.7,
        val_ratio: float = 0.15
    ) -> Dict[str, pd.DataFrame]:
        """
        Create time-based train/val/test splits
        """
        df_sorted = df.sort_values(date_column)

        n = len(df_sorted)
        train_end = int(n * train_ratio)
        val_end = int(n * (train_ratio + val_ratio))

        splits = {
            'train': df_sorted.iloc[:train_end],
            'val': df_sorted.iloc[train_end:val_end],
            'test': df_sorted.iloc[val_end:]
        }

        logger.info(f"Train: {len(splits['train'])} rows")
        logger.info(f"Val: {len(splits['val'])} rows")
        logger.info(f"Test: {len(splits['test'])} rows")

        return splits

    def generate_feature_statistics(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate feature statistics for monitoring
        """
        stats = df.describe().T

        stats['missing_count'] = df.isnull().sum()
        stats['missing_percentage'] = (df.isnull().sum() / len(df)) * 100
        stats['unique_count'] = df.nunique()
        stats['dtype'] = df.dtypes

        return stats

    def save_processed_data(
        self,
        df: pd.DataFrame,
        table_name: str,
        if_exists: str = 'replace'
    ):
        """
        Save processed data back to database
        """
        try:
            df.to_sql(
                table_name,
                self.engine,
                if_exists=if_exists,
                index=False
            )
            logger.info(f"Saved {len(df)} rows to {table_name}")
        except Exception as e:
            logger.error(f"Failed to save data: {e}")
            raise

    def close(self):
        """
        Close database connection
        """
        self.engine.dispose()
