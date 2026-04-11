"""Insights service — generates spending insights via Amazon Bedrock."""

from __future__ import annotations

import json
import os
from collections import defaultdict

import boto3


class InsightsService:
    """Generates textual spending insights using Bedrock Claude."""

    MINIMUM_EXPENSES = 3

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

    def generate_insights(self, expenses: list) -> str:
        """Generate spending insights from a list of expenses.

        Requires at least 3 expenses. Raises ValueError if insufficient data.
        Raises Exception if Bedrock is unavailable.
        """
        if len(expenses) < self.MINIMUM_EXPENSES:
            raise ValueError(
                f"São necessários pelo menos {self.MINIMUM_EXPENSES} registros "
                "para gerar insights."
            )

        # Build summary by category
        by_category: dict[str, int] = defaultdict(int)
        total = 0
        for expense in expenses:
            amount = int(expense.get("amount", 0))
            category = expense.get("category", "Outros")
            by_category[category] += amount
            total += amount

        summary_lines = [f"Total geral: R$ {total / 100:.2f}"]
        for cat, amt in sorted(by_category.items(), key=lambda x: x[1], reverse=True):
            summary_lines.append(f"- {cat}: R$ {amt / 100:.2f}")

        summary_text = "\n".join(summary_lines)

        prompt = (
            "Analise o seguinte resumo de despesas pessoais e forneça insights em português:\n\n"
            f"{summary_text}\n\n"
            "Por favor, inclua:\n"
            "1. Categoria com maior gasto\n"
            "2. Comparação com período anterior (se os dados permitirem)\n"
            "3. Sugestão de economia\n\n"
            "Responda de forma concisa e útil."
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
        return response_body["content"][0]["text"].strip()
