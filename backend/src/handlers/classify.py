from src.services.classification_service import ClassificationService
from src.utils.response import success_response, error_response

_service = ClassificationService()


def classify(event):
    """Classify an expense description into a category via Bedrock."""
    body = event.get("parsedBody", {})
    description = body.get("description")

    if not description or not isinstance(description, str) or not description.strip():
        return error_response("Descrição é obrigatória", 400)

    category = _service.classify(description)
    return success_response({"category": category})
