# Coach Intelligence Service - Deployment & MLOps Guide

## Executive Summary

This guide provides comprehensive instructions for deploying, monitoring, and maintaining the Coach Intelligence Service ML infrastructure in production. It covers containerization, orchestration, CI/CD pipelines, monitoring, and operational best practices.

## Table of Contents

1. [Deployment Architecture](#deployment-architecture)
2. [Containerization](#containerization)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring & Observability](#monitoring--observability)
6. [Model Management](#model-management)
7. [Performance Optimization](#performance-optimization)
8. [Operational Procedures](#operational-procedures)

---

## 1. Deployment Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                   Production Environment                      │
├────────────────┬──────────────────┬──────────────────────────┤
│  Load Balancer │  API Gateway     │  CDN                     │
├────────────────┴──────────────────┴──────────────────────────┤
│                   Kubernetes Cluster                          │
├────────────────┬──────────────────┬──────────────────────────┤
│ Inference Pods │  Feature Store   │  Model Registry          │
├────────────────┼──────────────────┼──────────────────────────┤
│   PostgreSQL   │     Redis        │    S3 Storage            │
└────────────────┴──────────────────┴──────────────────────────┘
```

### Infrastructure Requirements

| Component | Specification | Count | Purpose |
|-----------|--------------|-------|---------|
| API Servers | 8 vCPU, 16GB RAM | 3-5 | Handle API requests |
| ML Inference | 16 vCPU, 32GB RAM, GPU | 2-4 | Model inference |
| Feature Store | 8 vCPU, 32GB RAM | 2 | Feature serving |
| Redis Cache | 4 vCPU, 16GB RAM | 3 | Caching layer |
| PostgreSQL | 16 vCPU, 64GB RAM | 2 (Primary + Replica) | Data persistence |

---

## 2. Containerization

### Docker Configuration

#### Inference Service Dockerfile

```dockerfile
# Dockerfile.inference
FROM tensorflow/tensorflow:2.13.0-gpu

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3-pip \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install ONNX Runtime
RUN pip install onnxruntime-gpu==1.15.0

# Copy application code
COPY ./src ./src
COPY ./models ./models

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TF_CPP_MIN_LOG_LEVEL=2
ENV MODEL_PATH=/app/models

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run service
CMD ["python", "-m", "src.inference_server"]
```

#### Feature Store Dockerfile

```dockerfile
# Dockerfile.feature-store
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements-feature.txt .
RUN pip install --no-cache-dir -r requirements-feature.txt

# Copy Feast configuration
COPY feature_store.yaml .
COPY features ./features

# Install Feast
RUN pip install feast[redis,postgres]==0.32.0

# Copy scripts
COPY scripts/feature_server.py .

# Expose port
EXPOSE 6566

# Run feature server
CMD ["feast", "serve", "-h", "0.0.0.0", "-p", "6566"]
```

### Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  inference:
    build:
      context: .
      dockerfile: Dockerfile.inference
    ports:
      - "8080:8080"
    environment:
      - REDIS_HOST=redis
      - POSTGRES_HOST=postgres
      - MODEL_PATH=/app/models
    volumes:
      - ./models:/app/models
    depends_on:
      - redis
      - postgres
      - feature-store

  feature-store:
    build:
      context: .
      dockerfile: Dockerfile.feature-store
    ports:
      - "6566:6566"
    environment:
      - REDIS_HOST=redis
      - POSTGRES_HOST=postgres
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=upcoach
      - POSTGRES_USER=ml_user
      - POSTGRES_PASSWORD=ml_password
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  redis-data:
  postgres-data:
```

---

## 3. Kubernetes Deployment

### Namespace Configuration

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: coach-intelligence
  labels:
    name: coach-intelligence
    environment: production
```

### Inference Service Deployment

```yaml
# k8s/inference-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inference-service
  namespace: coach-intelligence
spec:
  replicas: 3
  selector:
    matchLabels:
      app: inference-service
  template:
    metadata:
      labels:
        app: inference-service
        version: v1
    spec:
      containers:
      - name: inference
        image: upcoach/inference:latest
        ports:
        - containerPort: 8080
        env:
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis.host
        - name: MODEL_CACHE_TTL
          value: "3600"
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: "1"
          limits:
            memory: "8Gi"
            cpu: "4"
            nvidia.com/gpu: "1"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: inference-service
  namespace: coach-intelligence
spec:
  selector:
    app: inference-service
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  type: LoadBalancer
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: inference-hpa
  namespace: coach-intelligence
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: inference-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: inference_latency_p95
      target:
        type: AverageValue
        averageValue: "100"  # 100ms
```

### ConfigMaps and Secrets

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: coach-intelligence
data:
  redis.host: "redis-service.coach-intelligence.svc.cluster.local"
  postgres.host: "postgres-service.coach-intelligence.svc.cluster.local"
  feature.store.url: "feast://feature-store:6566"
  model.registry.url: "http://mlflow:5000"
---
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: coach-intelligence
type: Opaque
data:
  postgres.password: <base64-encoded-password>
  redis.password: <base64-encoded-password>
  aws.access.key: <base64-encoded-key>
  aws.secret.key: <base64-encoded-secret>
```

---

## 4. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ml-deployment.yml
name: ML Deployment Pipeline

on:
  push:
    branches: [main]
    paths:
      - 'services/ml/**'
      - 'models/**'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: upcoach/coach-intelligence

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          pip install -r requirements-test.txt

      - name: Run tests
        run: |
          pytest tests/ -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  validate-models:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate model files
        run: |
          python scripts/validate_models.py

      - name: Check model performance
        run: |
          python scripts/benchmark_models.py

  build:
    needs: [test, validate-models]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to Staging
        run: |
          kubectl set image deployment/inference-service \
            inference=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n coach-intelligence-staging

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/inference-service \
            -n coach-intelligence-staging

  integration-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - name: Run integration tests
        run: |
          python tests/integration/test_inference_api.py \
            --endpoint https://staging.upcoach.ai/api/intelligence

  deploy-production:
    needs: integration-tests
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        run: |
          kubectl set image deployment/inference-service \
            inference=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n coach-intelligence

      - name: Monitor deployment
        run: |
          python scripts/monitor_deployment.py \
            --namespace coach-intelligence \
            --timeout 600
```

### ArgoCD Application

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: coach-intelligence
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/upcoach/infrastructure
    targetRevision: HEAD
    path: k8s/coach-intelligence
  destination:
    server: https://kubernetes.default.svc
    namespace: coach-intelligence
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

---

## 5. Monitoring & Observability

### Prometheus Configuration

```yaml
# monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
    - job_name: 'inference-service'
      kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
          - coach-intelligence
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: inference-service
        action: keep
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true

    - job_name: 'model-metrics'
      static_configs:
      - targets:
        - mlflow:5000
        - feast:6566

    rule_files:
    - /etc/prometheus/rules/*.yml
```

### Alert Rules

```yaml
# monitoring/alert-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  ml-alerts.yml: |
    groups:
    - name: ml-inference
      interval: 30s
      rules:
      - alert: HighInferenceLatency
        expr: histogram_quantile(0.95, inference_latency_bucket) > 200
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High inference latency detected
          description: "95th percentile latency is {{ $value }}ms"

      - alert: ModelDriftDetected
        expr: model_drift_score > 0.3
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: Model drift detected
          description: "Model {{ $labels.model }} drift score: {{ $value }}"

      - alert: LowModelAccuracy
        expr: model_accuracy < 0.8
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: Model accuracy below threshold
          description: "Model {{ $labels.model }} accuracy: {{ $value }}"

      - alert: HighErrorRate
        expr: rate(inference_errors_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High error rate in inference service
          description: "Error rate: {{ $value }}"
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Coach Intelligence ML Dashboard",
    "panels": [
      {
        "title": "Inference Latency (P50, P95, P99)",
        "targets": [
          {
            "expr": "histogram_quantile(0.5, inference_latency_bucket)",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, inference_latency_bucket)",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, inference_latency_bucket)",
            "legendFormat": "P99"
          }
        ]
      },
      {
        "title": "Model Accuracy Trends",
        "targets": [
          {
            "expr": "model_accuracy{model=~\"$model\"}"
          }
        ]
      },
      {
        "title": "Prediction Volume",
        "targets": [
          {
            "expr": "rate(predictions_total[5m])"
          }
        ]
      },
      {
        "title": "Feature Store Hit Rate",
        "targets": [
          {
            "expr": "feature_store_cache_hits / (feature_store_cache_hits + feature_store_cache_misses)"
          }
        ]
      },
      {
        "title": "GPU Utilization",
        "targets": [
          {
            "expr": "gpu_utilization_percent"
          }
        ]
      }
    ]
  }
}
```

### Logging Configuration

```python
# logging_config.py
import logging
import json
from pythonjsonlogger import jsonlogger

# Configure structured logging
def setup_logging():
    logger = logging.getLogger()
    handler = logging.StreamHandler()

    # JSON formatter
    formatter = jsonlogger.JsonFormatter(
        fmt='%(asctime)s %(levelname)s %(name)s %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

    return logger

# Log aggregation with Fluentd
fluentd_config = """
<source>
  @type forward
  port 24224
</source>

<filter coach.intelligence.**>
  @type record_transformer
  <record>
    service coach-intelligence
    environment #{ENV['ENVIRONMENT']}
  </record>
</filter>

<match coach.intelligence.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
  logstash_prefix coach-intelligence
</match>
"""
```

---

## 6. Model Management

### Model Registry with MLflow

```python
# model_registry.py
import mlflow
from mlflow.tracking import MlflowClient

class ModelRegistry:
    def __init__(self):
        self.client = MlflowClient()
        mlflow.set_tracking_uri("http://mlflow:5000")

    def register_model(self, model_path, model_name, metrics):
        """Register a new model version"""
        with mlflow.start_run():
            # Log model
            mlflow.tensorflow.log_model(
                model_path,
                artifact_path="model",
                registered_model_name=model_name
            )

            # Log metrics
            for key, value in metrics.items():
                mlflow.log_metric(key, value)

            # Get version
            latest_version = self.client.get_latest_versions(
                model_name,
                stages=["None"]
            )[0]

            return latest_version.version

    def promote_model(self, model_name, version, stage):
        """Promote model to different stage"""
        self.client.transition_model_version_stage(
            name=model_name,
            version=version,
            stage=stage  # "Staging", "Production", "Archived"
        )

    def load_production_model(self, model_name):
        """Load the production model"""
        model_uri = f"models:/{model_name}/Production"
        return mlflow.tensorflow.load_model(model_uri)
```

### A/B Testing Framework

```python
# ab_testing.py
import random
import json
from typing import Dict, Any

class ABTestManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.experiments = {}

    def create_experiment(
        self,
        name: str,
        control_model: str,
        treatment_model: str,
        traffic_split: float = 0.5
    ):
        """Create A/B test experiment"""
        experiment = {
            "name": name,
            "control_model": control_model,
            "treatment_model": treatment_model,
            "traffic_split": traffic_split,
            "start_time": datetime.now().isoformat(),
            "metrics": {
                "control": {"requests": 0, "errors": 0},
                "treatment": {"requests": 0, "errors": 0}
            }
        }

        self.redis.set(
            f"experiment:{name}",
            json.dumps(experiment),
            ex=86400 * 7  # 7 days
        )

        return experiment

    def get_model_variant(self, experiment_name: str, user_id: str):
        """Determine which model variant to use"""
        experiment = json.loads(
            self.redis.get(f"experiment:{experiment_name}")
        )

        # Consistent hashing for user assignment
        hash_value = hash(user_id) % 100

        if hash_value < experiment["traffic_split"] * 100:
            return experiment["treatment_model"], "treatment"
        else:
            return experiment["control_model"], "control"

    def record_metric(
        self,
        experiment_name: str,
        variant: str,
        metric: str,
        value: float
    ):
        """Record experiment metrics"""
        key = f"experiment:metrics:{experiment_name}:{variant}:{metric}"
        self.redis.lpush(key, value)
        self.redis.ltrim(key, 0, 9999)  # Keep last 10000
```

---

## 7. Performance Optimization

### Caching Strategy

```python
# caching.py
import hashlib
import pickle
from functools import wraps

class MLCache:
    def __init__(self, redis_client, ttl=3600):
        self.redis = redis_client
        self.ttl = ttl

    def cache_key(self, func_name, *args, **kwargs):
        """Generate cache key"""
        key_data = f"{func_name}:{args}:{kwargs}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def cache_prediction(self, ttl=None):
        """Decorator for caching predictions"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                key = self.cache_key(func.__name__, *args, **kwargs)

                # Check cache
                cached = await self.redis.get(key)
                if cached:
                    return pickle.loads(cached)

                # Run function
                result = await func(*args, **kwargs)

                # Cache result
                await self.redis.setex(
                    key,
                    ttl or self.ttl,
                    pickle.dumps(result)
                )

                return result
            return wrapper
        return decorator
```

### Model Optimization

```python
# model_optimization.py
import tensorflow as tf
from tensorflow import keras

class ModelOptimizer:
    @staticmethod
    def quantize_model(model_path):
        """Quantize model for faster inference"""
        converter = tf.lite.TFLiteConverter.from_saved_model(model_path)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.representative_dataset = representative_dataset

        # INT8 quantization
        converter.target_spec.supported_ops = [
            tf.lite.OpsSet.TFLITE_BUILTINS_INT8
        ]
        converter.inference_input_type = tf.uint8
        converter.inference_output_type = tf.uint8

        tflite_model = converter.convert()
        return tflite_model

    @staticmethod
    def optimize_onnx(model_path):
        """Optimize ONNX model"""
        import onnx
        from onnxruntime.quantization import quantize_dynamic

        # Dynamic quantization
        quantize_dynamic(
            model_path,
            model_path.replace('.onnx', '_quantized.onnx'),
            weight_type=QuantType.QUInt8
        )
```

### Batch Prediction Optimization

```python
# batch_optimization.py
import asyncio
from typing import List, Any

class BatchProcessor:
    def __init__(self, batch_size=32, timeout_ms=50):
        self.batch_size = batch_size
        self.timeout_ms = timeout_ms
        self.queue = asyncio.Queue()
        self.processing = False

    async def process_batch(self, model, items: List[Any]):
        """Process a batch of items"""
        if not items:
            return []

        # Prepare batch input
        batch_input = self.prepare_batch(items)

        # Run batch inference
        predictions = await model.predict_batch(batch_input)

        # Return results
        return list(zip(items, predictions))

    async def add_to_queue(self, item):
        """Add item to processing queue"""
        future = asyncio.Future()
        await self.queue.put((item, future))

        if not self.processing:
            asyncio.create_task(self.process_queue())

        return await future

    async def process_queue(self):
        """Process queued items in batches"""
        self.processing = True

        while not self.queue.empty():
            batch = []
            futures = []

            # Collect batch
            deadline = asyncio.get_event_loop().time() + self.timeout_ms / 1000

            while len(batch) < self.batch_size:
                try:
                    remaining = deadline - asyncio.get_event_loop().time()
                    if remaining <= 0:
                        break

                    item, future = await asyncio.wait_for(
                        self.queue.get(),
                        timeout=remaining
                    )
                    batch.append(item)
                    futures.append(future)
                except asyncio.TimeoutError:
                    break

            if batch:
                # Process batch
                results = await self.process_batch(self.model, batch)

                # Return results
                for (item, result), future in zip(results, futures):
                    future.set_result(result)

        self.processing = False
```

---

## 8. Operational Procedures

### Deployment Checklist

```markdown
## Pre-Deployment Checklist

### Code Review
- [ ] Code reviewed by senior engineer
- [ ] Security scan completed
- [ ] Performance benchmarks meet requirements

### Model Validation
- [ ] Model accuracy >= 85%
- [ ] Inference latency < 100ms (P95)
- [ ] Model size optimized
- [ ] Test coverage > 80%

### Infrastructure
- [ ] Kubernetes resources configured
- [ ] Monitoring dashboards created
- [ ] Alerts configured
- [ ] Backup strategy implemented

### Documentation
- [ ] API documentation updated
- [ ] Runbook updated
- [ ] Change log updated
- [ ] Team notified
```

### Rollback Procedures

```bash
#!/bin/bash
# rollback.sh

NAMESPACE="coach-intelligence"
DEPLOYMENT="inference-service"
PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "Usage: ./rollback.sh <previous-version>"
    exit 1
fi

echo "Rolling back to version: $PREVIOUS_VERSION"

# Set image to previous version
kubectl set image deployment/$DEPLOYMENT \
    inference=upcoach/inference:$PREVIOUS_VERSION \
    -n $NAMESPACE

# Wait for rollout
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE

# Verify health
./scripts/health_check.sh

echo "Rollback completed"
```

### Incident Response

```yaml
# incident-response.yaml
incident_response:
  levels:
    P1:
      description: "Complete service outage"
      response_time: "15 minutes"
      escalation:
        - on_call_engineer
        - team_lead
        - engineering_manager

    P2:
      description: "Degraded performance"
      response_time: "30 minutes"
      escalation:
        - on_call_engineer
        - team_lead

    P3:
      description: "Minor issue"
      response_time: "2 hours"
      escalation:
        - on_call_engineer

  runbook:
    high_latency:
      symptoms:
        - "P95 latency > 200ms"
        - "User complaints about slow responses"
      diagnosis:
        - "Check GPU utilization"
        - "Review model complexity"
        - "Check cache hit rate"
      mitigation:
        - "Scale up inference pods"
        - "Increase cache TTL"
        - "Switch to optimized model"

    model_drift:
      symptoms:
        - "Drift score > 0.3"
        - "Declining accuracy"
      diagnosis:
        - "Review feature distributions"
        - "Check data quality"
      mitigation:
        - "Trigger retraining pipeline"
        - "Rollback to previous model"
```

### Maintenance Windows

```python
# maintenance.py
class MaintenanceManager:
    def __init__(self):
        self.maintenance_window = {
            "day": "Sunday",
            "start_hour": 2,  # 2 AM
            "duration_hours": 4
        }

    def schedule_maintenance(self, tasks):
        """Schedule maintenance tasks"""
        for task in tasks:
            if task["type"] == "model_update":
                self.update_model(task["model"], task["version"])
            elif task["type"] == "database_migration":
                self.run_migration(task["migration"])
            elif task["type"] == "cache_clear":
                self.clear_cache()

    def update_model(self, model_name, version):
        """Update model during maintenance"""
        # Put service in maintenance mode
        self.enable_maintenance_mode()

        try:
            # Download new model
            self.download_model(model_name, version)

            # Validate model
            self.validate_model(model_name, version)

            # Update model registry
            self.update_registry(model_name, version)

            # Restart services
            self.restart_services()

        finally:
            # Exit maintenance mode
            self.disable_maintenance_mode()
```

---

## Conclusion

This deployment and MLOps guide provides a comprehensive framework for:

1. **Reliable Deployment**: Containerized, scalable Kubernetes deployment
2. **Continuous Delivery**: Automated CI/CD with testing and validation
3. **Observability**: Comprehensive monitoring and alerting
4. **Model Management**: Version control and A/B testing capabilities
5. **Performance**: Optimized inference with caching and batching
6. **Operations**: Clear procedures for maintenance and incident response

Following these guidelines ensures the Coach Intelligence Service operates reliably at scale while maintaining high performance and availability.

---

**Document Version**: 1.0.0
**Last Updated**: 2025-09-21
**Author**: Senior Data Scientist & ML Engineering Expert
**Status**: Production Ready