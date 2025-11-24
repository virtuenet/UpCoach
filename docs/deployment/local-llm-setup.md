# Local LLM Setup Guide

## Quick Start

This guide will help you set up the local ONNX-based LLM inference for the Sticky Engagement features.

---

## Prerequisites

### System Requirements
- **OS**: macOS 12+, Ubuntu 20.04+, or Windows 10+
- **RAM**: 8 GB minimum, 16 GB recommended
- **Storage**: 10 GB free space (for model files)
- **Python**: 3.9+ (3.13 recommended)
- **Node.js**: 20.x

### Dependencies
```bash
# Python dependencies
pip install onnxruntime-genai==0.11.2

# Verify installation
python3 -c "import onnxruntime_genai; print(onnxruntime_genai.__version__)"
# Expected output: 0.11.2
```

---

## Step 1: Download ONNX Model Files

You already have the Phi-3 mini model files in:
```
/Users/ardisetiadharma/CURSOR Repository/UpCoach/models/edge/
├── phi-3-mini-4k-instruct.onnx       (226 KB)
├── phi-3-mini-4k-instruct.onnx.data  (2.5 GB)
├── phi-4-mini-instruct.onnx          (50 MB)
└── phi-4-mini-instruct.onnx.data     (4.5 GB)
```

**Alternative**: Download from Hugging Face:
```bash
# Create models directory
mkdir -p models/edge
cd models/edge

# Download Phi-3 mini ONNX
wget https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/phi-3-mini-4k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx
wget https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/phi-3-mini-4k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx.data

# Rename for consistency
mv phi-3-mini-4k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx phi-3-mini-4k-instruct.onnx
mv phi-3-mini-4k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx.data phi-3-mini-4k-instruct.onnx.data
```

---

## Step 2: Configure Environment Variables

Your `.env` file already has the correct configuration:

```bash
# services/api/.env
LOCAL_LLM_ENABLED=true
LOCAL_LLM_BACKEND=onnx
LOCAL_LLM_MODEL_PATH=/Users/ardisetiadharma/CURSOR Repository/UpCoach/models/edge/phi-3-mini-4k-instruct.onnx
LOCAL_LLM_MAX_TOKENS=512
LOCAL_LLM_CONTEXT_WINDOW=4096
LOCAL_LLM_TIMEOUT_MS=20000
```

**Verify paths**:
```bash
cd services/api
source .env  # Or use dotenv-cli

# Check model file exists
test -f "$LOCAL_LLM_MODEL_PATH" && echo "✓ Model file found" || echo "✗ Model file not found"
test -f "$LOCAL_LLM_MODEL_PATH.data" && echo "✓ Model data found" || echo "✗ Model data not found"
```

---

## Step 3: Test Python Runner

Test the Python LLM runner directly:

```bash
cd services/api

python3 src/scripts/llm_runner.py \
  --model "/Users/ardisetiadharma/CURSOR Repository/UpCoach/models/edge/phi-3-mini-4k-instruct.onnx" \
  --backend onnx \
  --prompt "What is 2+2?" \
  --max-tokens 50
```

**Expected output**:
```json
{
  "text": "2+2 equals 4.",
  "prompt_tokens": 5,
  "completion_tokens": 8,
  "total_tokens": 13
}
```

**Common errors**:
- `ImportError: No module named 'onnxruntime_genai'`
  → Run `pip install onnxruntime-genai`

- `Model file not found`
  → Verify `LOCAL_LLM_MODEL_PATH` is correct

- `ONNX Runtime error: Invalid model`
  → Re-download model files (may be corrupted)

---

## Step 4: Test via API

Start the API server:

```bash
cd services/api
npm run dev
```

Check local LLM status:

```bash
curl http://localhost:1080/api/ai/local-llm/status
```

**Expected response**:
```json
{
  "online": true,
  "backend": "onnx",
  "modelPath": "/Users/ardisetiadharma/CURSOR Repository/UpCoach/models/edge/phi-3-mini-4k-instruct.onnx",
  "maxTokens": 512,
  "contextWindow": 4096
}
```

Test inference through companion chat:

```bash
# Get your JWT token
export TOKEN="your-jwt-token-here"

curl -X POST http://localhost:1080/api/ai/companion/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Give me a quick productivity tip",
    "provider": "local"
  }'
```

**Expected response**:
```json
{
  "user": {
    "id": "...",
    "role": "user",
    "content": "Give me a quick productivity tip",
    "createdAt": "..."
  },
  "assistant": {
    "id": "...",
    "role": "assistant",
    "content": "Try the Pomodoro Technique: work for 25 minutes, then take a 5-minute break.",
    "createdAt": "..."
  }
}
```

---

## Step 5: Verify Fallback Behavior

Test that the system falls back to cloud LLM when local fails:

```bash
# Temporarily break local LLM
mv .env .env.bak
echo "LOCAL_LLM_ENABLED=false" > .env

# Restart server
npm run dev

# Test - should use OpenAI/Claude
curl -X POST http://localhost:1080/api/ai/companion/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Hello"}'

# Restore
rm .env
mv .env.bak .env
```

---

## Performance Tuning

### Adjust Token Limits

For faster responses:
```bash
LOCAL_LLM_MAX_TOKENS=256  # Shorter responses
LOCAL_LLM_TIMEOUT_MS=10000  # Faster timeout
```

For higher quality:
```bash
LOCAL_LLM_MAX_TOKENS=1024  # Longer responses
LOCAL_LLM_CONTEXT_WINDOW=8192  # Larger context
```

### Switch Models

To use Phi-4 instead:
```bash
LOCAL_LLM_MODEL_PATH=/Users/ardisetiadharma/CURSOR Repository/UpCoach/models/edge/phi-4-mini-instruct.onnx
```

---

## Monitoring

### Check Logs

```bash
# API logs (includes LLM inference times)
tail -f services/api/logs/app.log | grep "Local LLM"

# Python runner logs
tail -f services/api/logs/llm.log
```

### Metrics to Track

- **Latency**: Inference time (should be < 2s for 256 tokens)
- **Fallback rate**: % of requests using cloud LLM
- **Error rate**: Failed local LLM calls
- **Cache hit rate**: Cached responses vs fresh generations

---

## Troubleshooting

### Issue: "Model loading failed"

**Symptoms**: API returns 500 error, logs show `Failed to load ONNX Runtime model`

**Solutions**:
1. Verify model files are not corrupted:
   ```bash
   ls -lh models/edge/*.onnx*
   # Should show 226 KB for .onnx, 2.5 GB for .onnx.data
   ```

2. Re-download model files if corrupted

3. Check Python version:
   ```bash
   python3 --version  # Should be 3.9+
   ```

### Issue: "Timeout errors"

**Symptoms**: Requests fail with `Local LLM generation timeout`

**Solutions**:
1. Increase timeout:
   ```bash
   LOCAL_LLM_TIMEOUT_MS=30000  # 30 seconds
   ```

2. Reduce max tokens:
   ```bash
   LOCAL_LLM_MAX_TOKENS=256
   ```

3. Check CPU usage - model may be resource-starved

### Issue: "Permission denied"

**Symptoms**: `spawn EACCES` error when calling Python

**Solutions**:
```bash
# Make Python script executable
chmod +x services/api/src/scripts/llm_runner.py

# Verify Python is accessible
which python3
```

### Issue: "Module not found"

**Symptoms**: `ImportError: No module named 'onnxruntime_genai'`

**Solutions**:
```bash
# Reinstall with correct Python
pip3 install --break-system-packages onnxruntime-genai

# Or use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install onnxruntime-genai
```

---

## Production Deployment

### Containerization (Docker)

```dockerfile
# Dockerfile for API service
FROM node:20-slim

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy model files
COPY models/edge /app/models/edge

# Environment variables
ENV LOCAL_LLM_ENABLED=true
ENV LOCAL_LLM_BACKEND=onnx
ENV LOCAL_LLM_MODEL_PATH=/app/models/edge/phi-3-mini-4k-instruct.onnx

# ... rest of Dockerfile
```

### Cloud Deployment

**Option 1: Include model in container** (7GB image)
- ✅ Faster startup
- ❌ Large image size
- ❌ Expensive storage

**Option 2: Download model at runtime**
- ✅ Smaller image
- ❌ Slower first start
- ✅ Can update model independently

```bash
# Download model on first run
if [ ! -f "$LOCAL_LLM_MODEL_PATH" ]; then
  wget -O "$LOCAL_LLM_MODEL_PATH" https://your-cdn.com/phi-3-mini.onnx
  wget -O "$LOCAL_LLM_MODEL_PATH.data" https://your-cdn.com/phi-3-mini.onnx.data
fi
```

---

## Cost Savings Estimate

### Local LLM (Phi-3)
- **Cost**: $0 per request
- **Latency**: 1-2s
- **Privacy**: High (on-premise)

### Cloud LLM (GPT-4)
- **Cost**: $0.03 per request
- **Latency**: 2-3s
- **Privacy**: Medium (third-party)

**Example savings** (10,000 requests/day):
- Local only: **$0/day**
- Cloud only: **$300/day** ($9,000/month)
- Hybrid (80% local): **$60/day** ($1,800/month)

**ROI**: Pays for infrastructure costs within 1-2 weeks

---

## Next Steps

1. ✅ Verify local LLM is working
2. ⏳ Monitor performance metrics
3. ⏳ Tune token limits based on usage
4. ⏳ Set up alerting for fallback rate
5. ⏳ Plan model update strategy

---

*Last updated: 2025-11-24*
