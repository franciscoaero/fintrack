from src.services.ocr_service import OCRService
from src.utils.validators import validate_upload
from src.utils.response import success_response, error_response

_service = OCRService()


def presign(event):
    """Generate a presigned URL for receipt upload."""
    body = event.get("parsedBody", {})
    content_type = body.get("contentType", "")
    file_name = body.get("fileName", "")

    # Validate content type only (no file size at presign time)
    errors = validate_upload(content_type, 0)
    if errors:
        return error_response("Dados inválidos", 400, fields=errors)

    result = _service.generate_presigned_url(content_type, file_name)
    return success_response(result)


def process(event):
    """Process a receipt image via OCR."""
    body = event.get("parsedBody", {})
    receipt_key = body.get("receiptKey", "")

    if not receipt_key or not isinstance(receipt_key, str) or not receipt_key.strip():
        return error_response("receiptKey é obrigatório", 400)

    try:
        result = _service.process_receipt(receipt_key)
        return success_response(result)
    except Exception as exc:
        print(f"[ERROR] process_receipt failed: {exc}")
        import traceback
        traceback.print_exc()
        return error_response("Não foi possível extrair dados da imagem.", 422)
