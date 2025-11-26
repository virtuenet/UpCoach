#!/usr/bin/env python3
"""
LLM Runner Script for Local Language Model Integration
Supports various local LLM backends with OpenAI-compatible API
"""

import argparse
import json
import sys
import os
import time
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class LLMResponse:
    text: str
    finish_reason: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class LocalLLMRunner:
    """
    Local LLM runner that supports multiple backends
    """

    def __init__(self, model_path: str, backend: str = 'llama.cpp'):
        self.model_path = model_path
        self.backend = backend
        self.model = None
        self.tokenizer = None
        self._ort_genai = None

    def load_model(self) -> bool:
        """Load the specified model"""
        try:
            if self.backend == 'llama.cpp':
                return self._load_llama_cpp()
            elif self.backend == 'transformers':
                return self._load_transformers()
            elif self.backend == 'onnx':
                return self._load_onnxruntime()
            else:
                logger.error(f"Unsupported backend: {self.backend}")
                return False
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False

    def _load_llama_cpp(self) -> bool:
        """Load model using llama.cpp Python bindings"""
        try:
            from llama_cpp import Llama

            self.model = Llama(
                model_path=self.model_path,
                n_ctx=4096,  # Context length
                n_threads=None,  # Use all available threads
                n_gpu_layers=0,  # CPU-only for now
                verbose=False
            )
            return True
        except ImportError:
            logger.error("llama-cpp-python not installed. Install with: pip install llama-cpp-python")
            return False
        except Exception as e:
            logger.error(f"Failed to load llama.cpp model: {e}")
            return False

    def _load_transformers(self) -> bool:
        """Load model using Hugging Face transformers"""
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM
            import torch

            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_path,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto"
            )
            return True
        except ImportError:
            logger.error("transformers not installed. Install with: pip install transformers torch")
            return False
        except Exception as e:
            logger.error(f"Failed to load transformers model: {e}")
            return False

    def generate(self, prompt: str, max_tokens: int = 256, temperature: float = 0.7) -> Optional[LLMResponse]:
        """Generate text using the loaded model"""
        if self.model is None:
            logger.error("Model not loaded")
            return None

        try:
            if self.backend == 'llama.cpp':
                return self._generate_llama_cpp(prompt, max_tokens, temperature)
            elif self.backend == 'transformers':
                return self._generate_transformers(prompt, max_tokens, temperature)
            elif self.backend == 'onnx':
                return self._generate_onnxruntime(prompt, max_tokens, temperature)
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            return None

    def _generate_llama_cpp(self, prompt: str, max_tokens: int, temperature: float) -> LLMResponse:
        """Generate using llama.cpp"""
        response = self.model(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=0.9,
            echo=False,
            stop=["</s>", "\n\n"]
        )

        generated_text = response['choices'][0]['text']

        # Estimate token counts (rough approximation)
        prompt_tokens = len(prompt.split()) * 1.3  # Rough token estimation
        completion_tokens = len(generated_text.split()) * 1.3

        return LLMResponse(
            text=generated_text,
            finish_reason=response['choices'][0].get('finish_reason', 'stop'),
            prompt_tokens=int(prompt_tokens),
            completion_tokens=int(completion_tokens),
            total_tokens=int(prompt_tokens + completion_tokens)
        )

    def _generate_transformers(self, prompt: str, max_tokens: int, temperature: float) -> LLMResponse:
        """Generate using transformers"""
        import torch

        inputs = self.tokenizer(prompt, return_tensors="pt")
        prompt_length = inputs.input_ids.shape[1]

        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_new_tokens=max_tokens,
                temperature=temperature,
                do_sample=True,
                top_p=0.9,
                pad_token_id=self.tokenizer.eos_token_id
            )

        generated_tokens = outputs[0][prompt_length:]
        generated_text = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)

        return LLMResponse(
            text=generated_text,
            finish_reason='stop',
            prompt_tokens=prompt_length,
            completion_tokens=len(generated_tokens),
            total_tokens=prompt_length + len(generated_tokens)
        )

    def _load_onnxruntime(self) -> bool:
        """Load ONNX Runtime GenAI model"""
        try:
            import onnxruntime_genai as ort_genai  # type: ignore
        except ImportError:
            logger.error("onnxruntime-genai not installed. Install with: pip install onnxruntime-genai")
            return False

        try:
            model_path = self.model_path
            if os.path.isdir(model_path):
                self.model = ort_genai.Model(model_path)
            else:
                self.model = ort_genai.Model(model_path)
            self._ort_genai = ort_genai
            self.tokenizer = ort_genai.Tokenizer(self.model)
            return True
        except Exception as e:
            logger.error(f"Failed to load ONNX Runtime model: {e}")
            return False

    def _generate_onnxruntime(self, prompt: str, max_tokens: int, temperature: float) -> LLMResponse:
        """Generate text using onnxruntime-genai"""
        ort_genai = getattr(self, '_ort_genai', None)
        if ort_genai is None or self.model is None or self.tokenizer is None:
            raise RuntimeError('ONNX Runtime model not initialized')

        generation_config = ort_genai.GenerationConfig()
        generation_config.max_length = max_tokens
        generation_config.temperature = float(temperature)
        generation_config.top_p = 0.9

        generator = ort_genai.Generator(self.model, self.tokenizer, generation_config)
        generator.append_prompt(prompt)

        while not generator.is_done():
            generator.compute_logits()
            generator.generate_next_token()

        generated_text = generator.get_sequence(0)

        prompt_tokens = int(len(prompt.split()) * 1.3)
        completion_tokens = int(len(generated_text.split()) * 1.3)

        return LLMResponse(
            text=generated_text,
            finish_reason='stop',
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens
        )

def main():
    """Main entry point for the LLM runner"""
    parser = argparse.ArgumentParser(description='Local LLM Runner')
    parser.add_argument('--model', required=True, help='Path to the model file')
    parser.add_argument('--prompt', required=True, help='Input prompt')
    parser.add_argument('--max-tokens', type=int, default=256, help='Maximum tokens to generate')
    parser.add_argument('--temperature', type=float, default=0.7, help='Sampling temperature')
    parser.add_argument('--backend', default='llama.cpp', choices=['llama.cpp', 'transformers', 'onnx'],
                       help='Backend to use for model inference')

    args = parser.parse_args()

    # Check if model file exists
    if not os.path.exists(args.model):
        error_response = {
            'error': f'Model file not found: {args.model}',
            'text': '',
            'finish_reason': 'error',
            'prompt_tokens': 0,
            'completion_tokens': 0,
            'total_tokens': 0
        }
        print(json.dumps(error_response))
        sys.exit(1)

    # Initialize runner
    runner = LocalLLMRunner(args.model, args.backend)

    # Load model
    if not runner.load_model():
        error_response = {
            'error': 'Failed to load model',
            'text': '',
            'finish_reason': 'error',
            'prompt_tokens': 0,
            'completion_tokens': 0,
            'total_tokens': 0
        }
        print(json.dumps(error_response))
        sys.exit(1)

    # Generate response
    start_time = time.time()
    response = runner.generate(args.prompt, args.max_tokens, args.temperature)
    generation_time = time.time() - start_time

    if response is None:
        error_response = {
            'error': 'Generation failed',
            'text': '',
            'finish_reason': 'error',
            'prompt_tokens': 0,
            'completion_tokens': 0,
            'total_tokens': 0
        }
        print(json.dumps(error_response))
        sys.exit(1)

    # Output JSON response
    output = {
        'text': response.text,
        'finish_reason': response.finish_reason,
        'prompt_tokens': response.prompt_tokens,
        'completion_tokens': response.completion_tokens,
        'total_tokens': response.total_tokens,
        'generation_time': generation_time
    }

    print(json.dumps(output))

if __name__ == '__main__':
    main()