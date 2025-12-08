#!/usr/bin/env python3
"""
Model setup script for UpCoach LLM Server.
Downloads and configures required models for coaching scenarios.
"""

import os
import sys
import time
import yaml
import requests
from pathlib import Path

OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
CONFIG_PATH = os.getenv('CONFIG_PATH', '/config/models.yaml')

# Default models for coaching scenarios
DEFAULT_MODELS = [
    {
        'name': 'mistral',
        'description': 'General-purpose model for coaching conversations',
        'required': True,
    },
    {
        'name': 'llama3.2:3b',
        'description': 'Lightweight model for quick responses',
        'required': False,
    },
    {
        'name': 'nomic-embed-text',
        'description': 'Embedding model for semantic search',
        'required': True,
    },
]


def wait_for_ollama(max_retries=30, delay=5):
    """Wait for Ollama server to be ready."""
    print(f"Waiting for Ollama at {OLLAMA_URL}...")

    for i in range(max_retries):
        try:
            response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
            if response.status_code == 200:
                print("Ollama is ready!")
                return True
        except requests.exceptions.RequestException:
            pass

        print(f"Attempt {i + 1}/{max_retries}: Ollama not ready, retrying in {delay}s...")
        time.sleep(delay)

    print("Failed to connect to Ollama")
    return False


def get_installed_models():
    """Get list of currently installed models."""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        if response.status_code == 200:
            data = response.json()
            return [m['name'] for m in data.get('models', [])]
    except requests.exceptions.RequestException as e:
        print(f"Error fetching models: {e}")
    return []


def pull_model(model_name, description=""):
    """Pull a model from Ollama registry."""
    print(f"\n{'='*50}")
    print(f"Pulling model: {model_name}")
    if description:
        print(f"Description: {description}")
    print(f"{'='*50}")

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/pull",
            json={'name': model_name, 'stream': True},
            stream=True,
            timeout=3600  # 1 hour timeout for large models
        )

        for line in response.iter_lines():
            if line:
                try:
                    data = line.decode('utf-8')
                    import json
                    progress = json.loads(data)
                    if 'status' in progress:
                        status = progress['status']
                        if 'completed' in progress and 'total' in progress:
                            pct = (progress['completed'] / progress['total']) * 100
                            print(f"\r{status}: {pct:.1f}%", end='', flush=True)
                        else:
                            print(f"\r{status}", end='', flush=True)
                except:
                    pass

        print("\n✓ Model pulled successfully")
        return True

    except requests.exceptions.RequestException as e:
        print(f"\n✗ Failed to pull model: {e}")
        return False


def load_config():
    """Load model configuration from YAML file."""
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r') as f:
                config = yaml.safe_load(f)
                return config.get('models', DEFAULT_MODELS)
        except Exception as e:
            print(f"Error loading config: {e}")
    return DEFAULT_MODELS


def create_coaching_modelfile():
    """Create a custom Modelfile for coaching-optimized model."""
    modelfile_content = """
FROM mistral

SYSTEM You are an empathetic and supportive life coach named Coach AI. Your purpose is to help users:
- Set and achieve meaningful goals
- Build positive, sustainable habits
- Overcome obstacles and stay motivated
- Improve their overall well-being

Guidelines:
- Be warm, encouraging, and non-judgmental
- Ask thoughtful questions to understand the user's situation
- Provide specific, actionable advice
- Celebrate progress, no matter how small
- Use evidence-based coaching techniques
- Keep responses focused and practical

Remember: You're here to support and empower, not to prescribe or diagnose.

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER stop "</s>"
PARAMETER stop "[END]"
"""

    print("\nCreating custom coaching model...")

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/create",
            json={
                'name': 'upcoach-assistant',
                'modelfile': modelfile_content.strip()
            },
            stream=True,
            timeout=300
        )

        for line in response.iter_lines():
            if line:
                try:
                    import json
                    data = json.loads(line.decode('utf-8'))
                    if 'status' in data:
                        print(f"\r{data['status']}", end='', flush=True)
                except:
                    pass

        print("\n✓ Custom coaching model created: upcoach-assistant")
        return True

    except requests.exceptions.RequestException as e:
        print(f"\n✗ Failed to create custom model: {e}")
        return False


def main():
    """Main setup routine."""
    print("="*60)
    print("UpCoach LLM Model Setup")
    print("="*60)

    # Wait for Ollama to be ready
    if not wait_for_ollama():
        sys.exit(1)

    # Get installed models
    installed = get_installed_models()
    print(f"\nCurrently installed models: {installed or 'None'}")

    # Load configuration
    models = load_config()
    print(f"\nModels to install: {len(models)}")

    # Track results
    success = []
    failed = []
    skipped = []

    # Pull required models
    for model in models:
        name = model['name']
        description = model.get('description', '')
        required = model.get('required', True)

        # Check if already installed
        if any(name in m for m in installed):
            print(f"\n✓ Model already installed: {name}")
            skipped.append(name)
            continue

        # Pull the model
        if pull_model(name, description):
            success.append(name)
        else:
            if required:
                failed.append(name)
            else:
                print(f"Skipping optional model: {name}")
                skipped.append(name)

    # Create custom coaching model
    if 'mistral' in installed or 'mistral' in success:
        create_coaching_modelfile()

    # Summary
    print("\n" + "="*60)
    print("Setup Summary")
    print("="*60)
    print(f"✓ Successfully installed: {len(success)} models")
    if success:
        for m in success:
            print(f"  - {m}")

    print(f"→ Skipped (already installed): {len(skipped)} models")
    if skipped:
        for m in skipped:
            print(f"  - {m}")

    if failed:
        print(f"✗ Failed to install: {len(failed)} models")
        for m in failed:
            print(f"  - {m}")
        sys.exit(1)

    print("\n✓ Model setup complete!")


if __name__ == '__main__':
    main()
