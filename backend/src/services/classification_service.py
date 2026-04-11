"""Classification service — categorizes expense descriptions via Amazon Bedrock."""

from __future__ import annotations

import json
import os

import boto3


VALID_CATEGORIES = [
    "Alimentação", "Transporte", "Moradia",
    "Saúde", "Lazer", "Educação", "Outros",
]


class ClassificationService:
    """Classifies expense descriptions into predefined categories using Bedrock."""

    def __init__(self, bedrock_client=None):
        if bedrock_client is not None:
            self._bedrock = bedrock_client
        else:
            region = os.environ.get("AWS_REGION_NAME", "sa-east-1")
            self._bedrock = boto3.client("bedrock-runtime", region_name=region)

        self._model_id = os.environ.get(
            "BEDROCK_MODEL_ID",
            "anthropic.claude-3-haiku-20240307-v1:0",
        )

    def classify(self, description: str) -> str:
        """Classify a description into one of the valid categories.

        Always returns a valid category string. Falls back to "Outros"
        when Bedrock is unavailable or returns an unexpected value.
        """
        try:
            prompt = (
                "Classifique a seguinte descrição de despesa em EXATAMENTE uma das categorias abaixo.\n"
                "Categorias válidas: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Outros\n\n"
                f"Descrição: {description}\n\n"
                "Responda APENAS com o nome da categoria, sem explicação ou pontuação adicional."
            )

            request_body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 256,
                "messages": [{"role": "user", "content": prompt}],
            })

            response = self._bedrock.invoke_model(
                modelId=self._model_id,
                body=request_body,
            )

            response_body = json.loads(response["body"].read())
            category = response_body["content"][0]["text"].strip()

            if category in VALID_CATEGORIES:
                return category
            return "Outros"

        except Exception:
            return "Outros"
