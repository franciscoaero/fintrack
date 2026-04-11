"""OCR service — generates presigned URLs and extracts receipt data via Bedrock."""

from __future__ import annotations

import base64
import json
import os
import uuid

import boto3


class OCRService:
    """Handles receipt upload URLs and OCR extraction via Bedrock Claude multimodal."""

    def __init__(self, s3_client=None, bedrock_client=None):
        region = os.environ.get("AWS_REGION_NAME", "sa-east-1")

        if s3_client is not None:
            self._s3 = s3_client
        else:
            self._s3 = boto3.client("s3", region_name=region)

        if bedrock_client is not None:
            self._bedrock = bedrock_client
        else:
            self._bedrock = boto3.client("bedrock-runtime", region_name=region)

        self._bucket = os.environ.get("BUCKET_NAME", "")
        self._model_id = os.environ.get(
            "BEDROCK_MODEL_ID",
            "anthropic.claude-3-haiku-20240307-v1:0",
        )

    def generate_presigned_url(self, content_type: str, file_name: str) -> dict:
        """Generate a presigned PUT URL for uploading a receipt image to S3.

        Returns {"uploadUrl": str, "receiptKey": str}.
        """
        extension = file_name.rsplit(".", 1)[-1] if "." in file_name else "jpg"
        receipt_key = f"receipts/default-user/{uuid.uuid4()}.{extension}"

        upload_url = self._s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self._bucket,
                "Key": receipt_key,
                "ContentType": content_type,
            },
            ExpiresIn=300,  # 5 minutes
        )

        return {"uploadUrl": upload_url, "receiptKey": receipt_key}

    def process_receipt(self, receipt_key: str) -> dict:
        """Download image from S3 and extract receipt data via Bedrock Claude.

        Returns {"description": str, "amount": int, "date": str, "receiptKey": str}.
        Raises Exception if extraction fails.
        """
        # Download image from S3
        s3_response = self._s3.get_object(Bucket=self._bucket, Key=receipt_key)
        image_bytes = s3_response["Body"].read()
        base64_data = base64.b64encode(image_bytes).decode("utf-8")

        # Determine media type from key extension
        extension = receipt_key.rsplit(".", 1)[-1].lower()
        media_type = "image/jpeg" if extension in ("jpg", "jpeg") else "image/png"

        prompt_text = (
            "Analise esta imagem de comprovante/recibo e extraia as seguintes informações:\n"
            "1. valor: o valor total em centavos como número inteiro (ex: R$ 42,50 = 4250)\n"
            "2. data: a data no formato YYYY-MM-DD\n"
            "3. descrição: nome do estabelecimento ou descrição da compra\n\n"
            'Responda APENAS com JSON no formato: {"amount": 4250, "date": "2024-01-15", "description": "Restaurante XYZ"}\n'
            "Sem texto adicional, apenas o JSON."
        )

        request_body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 256,
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": base64_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": prompt_text,
                    },
                ],
            }],
        })

        response = self._bedrock.invoke_model(
            modelId=self._model_id,
            body=request_body,
        )

        response_body = json.loads(response["body"].read())
        raw_text = response_body["content"][0]["text"].strip()

        try:
            extracted = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise Exception(f"Falha ao interpretar resposta do OCR: {raw_text}") from exc

        return {
            "description": str(extracted.get("description", "")),
            "amount": int(extracted.get("amount", 0)),
            "date": str(extracted.get("date", "")),
            "receiptKey": receipt_key,
        }
