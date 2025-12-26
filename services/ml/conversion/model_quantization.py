"""
Model Quantization Utilities (Phase 9)

Provides quantization techniques for model compression and optimization.

Quantization Types:
- Post-training INT8 quantization (4x smaller, 3x faster)
- Dynamic range quantization
- Float16 quantization (2x smaller, minimal accuracy loss)
- Quantization-aware training preparation

Usage:
    python model_quantization.py --input churn_prediction.tflite --method int8
"""

import argparse
import tensorflow as tf
import numpy as np
from pathlib import Path
import json
import logging
from typing import Callable, Iterator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelQuantizer:
    def __init__(self, model_path: str):
        """
        Initialize quantizer

        Args:
            model_path: Path to TensorFlow SavedModel or Keras .h5 file
        """
        self.model_path = model_path
        self.model = None

    def load_model(self):
        """Load TensorFlow model"""
        logger.info(f"Loading model from {self.model_path}")

        if self.model_path.endswith('.h5'):
            self.model = tf.keras.models.load_model(self.model_path)
        else:
            self.model = tf.saved_model.load(self.model_path)

        logger.info("Model loaded successfully")
        return self.model

    def quantize_dynamic_range(self, output_path: str) -> bytes:
        """
        Dynamic range quantization

        Quantizes weights to INT8, but activations remain FP32.
        Good balance: 4x smaller, 2-3x faster, minimal accuracy loss (<1%).

        Args:
            output_path: Output path for quantized .tflite

        Returns:
            Quantized model bytes
        """
        logger.info("Applying dynamic range quantization...")

        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]

        tflite_model = converter.convert()

        with open(output_path, 'wb') as f:
            f.write(tflite_model)

        size_mb = len(tflite_model) / (1024 * 1024)
        logger.info(f"Dynamic range quantized model saved to {output_path} ({size_mb:.2f} MB)")

        return tflite_model

    def quantize_int8_full(self, output_path: str,
                           representative_dataset: Callable[[], Iterator[list]]) -> bytes:
        """
        Full INT8 quantization (weights + activations)

        Requires representative dataset for calibration.
        Best compression: 4x smaller, 3-4x faster, ~2-3% accuracy loss.

        Args:
            output_path: Output path for quantized .tflite
            representative_dataset: Generator function yielding calibration samples

        Returns:
            Quantized model bytes
        """
        logger.info("Applying full INT8 quantization...")

        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)

        # Enable full INT8 quantization
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.representative_dataset = representative_dataset

        # Enforce INT8 for input/output
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type = tf.int8
        converter.inference_output_type = tf.int8

        tflite_model = converter.convert()

        with open(output_path, 'wb') as f:
            f.write(tflite_model)

        size_mb = len(tflite_model) / (1024 * 1024)
        logger.info(f"Full INT8 quantized model saved to {output_path} ({size_mb:.2f} MB)")

        return tflite_model

    def quantize_float16(self, output_path: str) -> bytes:
        """
        Float16 quantization

        Reduces model size by 2x with minimal accuracy impact (<0.5%).
        Good for GPU acceleration.

        Args:
            output_path: Output path for quantized .tflite

        Returns:
            Quantized model bytes
        """
        logger.info("Applying Float16 quantization...")

        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]

        tflite_model = converter.convert()

        with open(output_path, 'wb') as f:
            f.write(tflite_model)

        size_mb = len(tflite_model) / (1024 * 1024)
        logger.info(f"Float16 quantized model saved to {output_path} ({size_mb:.2f} MB)")

        return tflite_model

    def compare_quantization_methods(self, test_data: np.ndarray, test_labels: np.ndarray,
                                    output_dir: str = './quantized_models'):
        """
        Compare all quantization methods

        Args:
            test_data: Test input data
            test_labels: Test labels
            output_dir: Directory to save quantized models

        Returns:
            Comparison report
        """
        logger.info("Comparing quantization methods...")

        Path(output_dir).mkdir(parents=True, exist_ok=True)

        # Original model size (TFLite FP32)
        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
        original_tflite = converter.convert()
        original_path = f"{output_dir}/original_fp32.tflite"
        with open(original_path, 'wb') as f:
            f.write(original_tflite)

        original_size = len(original_tflite) / (1024 * 1024)

        # Quantization methods
        methods = {
            'FP32 (Original)': {
                'path': original_path,
                'size_mb': original_size,
            },
            'Dynamic Range': {
                'path': f"{output_dir}/dynamic_range_int8.tflite",
                'quantizer': self.quantize_dynamic_range,
            },
            'Float16': {
                'path': f"{output_dir}/float16.tflite",
                'quantizer': self.quantize_float16,
            },
        }

        # Add INT8 full quantization with representative dataset
        def representative_dataset_gen():
            for i in range(100):
                yield [test_data[i:i+1].astype(np.float32)]

        methods['INT8 Full'] = {
            'path': f"{output_dir}/int8_full.tflite",
            'quantizer': lambda p: self.quantize_int8_full(p, representative_dataset_gen),
        }

        # Apply quantization and measure
        results = {}

        for method_name, method_info in methods.items():
            logger.info(f"\n--- {method_name} ---")

            if 'quantizer' in method_info:
                method_info['quantizer'](method_info['path'])
                method_info['size_mb'] = Path(method_info['path']).stat().st_size / (1024 * 1024)

            # Measure accuracy
            interpreter = tf.lite.Interpreter(model_path=method_info['path'])
            interpreter.allocate_tensors()

            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()

            predictions = []
            inference_times = []

            import time

            for i in range(len(test_data)):
                input_data = test_data[i:i+1].astype(input_details[0]['dtype'])

                start = time.perf_counter()
                interpreter.set_tensor(input_details[0]['index'], input_data)
                interpreter.invoke()
                output = interpreter.get_tensor(output_details[0]['index'])
                end = time.perf_counter()

                predictions.append(output[0][0])
                inference_times.append((end - start) * 1000)  # ms

            predictions = np.array(predictions)

            # Calculate metrics
            from sklearn.metrics import accuracy_score, roc_auc_score

            binary_preds = (predictions > 0.5).astype(int)
            accuracy = accuracy_score(test_labels, binary_preds)
            auc = roc_auc_score(test_labels, predictions)

            results[method_name] = {
                'size_mb': method_info['size_mb'],
                'size_reduction': f"{(1 - method_info['size_mb'] / original_size) * 100:.1f}%",
                'accuracy': accuracy,
                'auc': auc,
                'mean_latency_ms': np.mean(inference_times),
                'p95_latency_ms': np.percentile(inference_times, 95),
                'speedup': f"{original_size / method_info['size_mb']:.2f}x",
            }

            logger.info(f"Size: {results[method_name]['size_mb']:.2f} MB ({results[method_name]['size_reduction']})")
            logger.info(f"Accuracy: {results[method_name]['accuracy']:.4f}")
            logger.info(f"AUC: {results[method_name]['auc']:.4f}")
            logger.info(f"Mean Latency: {results[method_name]['mean_latency_ms']:.2f} ms")

        # Summary table
        logger.info("\n=== Quantization Comparison Summary ===")
        logger.info(f"{'Method':<20} {'Size (MB)':<12} {'Reduction':<12} {'Accuracy':<12} {'AUC':<12} {'Latency (ms)':<15}")
        logger.info("-" * 95)

        for method_name, metrics in results.items():
            logger.info(
                f"{method_name:<20} "
                f"{metrics['size_mb']:<12.2f} "
                f"{metrics['size_reduction']:<12} "
                f"{metrics['accuracy']:<12.4f} "
                f"{metrics['auc']:<12.4f} "
                f"{metrics['mean_latency_ms']:<15.2f}"
            )

        # Save report
        report_path = f"{output_dir}/quantization_comparison.json"
        with open(report_path, 'w') as f:
            json.dump(results, f, indent=2)
        logger.info(f"\nComparison report saved to {report_path}")

        # Recommendation
        logger.info("\n=== Recommendation ===")
        logger.info("For mobile deployment:")
        logger.info("  - iOS (Neural Engine): Use INT8 Full for best performance")
        logger.info("  - Android (mid-range): Use Dynamic Range for balance")
        logger.info("  - High-end devices: Use Float16 for minimal accuracy loss")

        return results


def generate_mock_test_data(n_samples: int = 1000, n_features: int = 24):
    """Generate mock test data"""
    np.random.seed(42)
    X = np.random.randn(n_samples, n_features).astype(np.float32)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    return X, y


def main():
    parser = argparse.ArgumentParser(description='Quantize TensorFlow models')
    parser.add_argument('--input', type=str, default='tf_model.h5',
                       help='Path to TensorFlow model (.h5 or SavedModel)')
    parser.add_argument('--method', type=str, default='compare',
                       choices=['dynamic', 'int8', 'float16', 'compare'],
                       help='Quantization method')
    parser.add_argument('--output', type=str, default='quantized_model.tflite',
                       help='Output path for quantized model')
    parser.add_argument('--output-dir', type=str, default='./quantized_models',
                       help='Output directory for comparison')

    args = parser.parse_args()

    # Check if model exists
    if not Path(args.input).exists():
        logger.warning(f"Model not found at {args.input}")
        logger.info("Creating mock Keras model for demonstration...")

        # Create simple mock model
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(24,)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid'),
        ])

        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

        # Train briefly
        X_train, y_train = generate_mock_test_data(5000, 24)
        model.fit(X_train, y_train, epochs=5, batch_size=128, verbose=0)

        # Save
        Path(args.input).parent.mkdir(parents=True, exist_ok=True)
        model.save(args.input)
        logger.info(f"Mock model saved to {args.input}")

    # Initialize quantizer
    quantizer = ModelQuantizer(args.input)
    quantizer.load_model()

    # Generate test data
    X_test, y_test = generate_mock_test_data(1000, 24)

    # Apply quantization
    if args.method == 'compare':
        results = quantizer.compare_quantization_methods(X_test, y_test, args.output_dir)
    elif args.method == 'dynamic':
        quantizer.quantize_dynamic_range(args.output)
    elif args.method == 'float16':
        quantizer.quantize_float16(args.output)
    elif args.method == 'int8':
        def representative_dataset_gen():
            for i in range(100):
                yield [X_test[i:i+1]]

        quantizer.quantize_int8_full(args.output, representative_dataset_gen)

    logger.info("✅ Quantization complete!")


if __name__ == '__main__':
    main()
