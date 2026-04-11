import re

VALID_CATEGORIES = [
    "Alimentação", "Transporte", "Moradia",
    "Saúde", "Lazer", "Educação", "Outros",
]

VALID_PAYMENT_METHODS = [
    "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "PIX", "Outros",
]

DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")

VALID_IMAGE_TYPES = ["image/jpeg", "image/png"]
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def validate_expense_input(data):
    """Validate expense input fields.

    Returns a dict of field errors (empty dict if valid).
    """
    errors = {}

    if data is None or not isinstance(data, dict):
        return {"_general": "Dados de entrada inválidos"}

    # description
    description = data.get("description")
    if description is None or not isinstance(description, str) or not description.strip():
        errors["description"] = "Descrição é obrigatória"
    elif len(description) > 500:
        errors["description"] = "Descrição deve ter no máximo 500 caracteres"

    # amount
    amount = data.get("amount")
    if amount is None:
        errors["amount"] = "Valor é obrigatório"
    elif not isinstance(amount, int) or amount <= 0:
        errors["amount"] = "Valor deve ser um inteiro positivo (centavos)"

    # date
    date = data.get("date")
    if date is None or not isinstance(date, str) or not date.strip():
        errors["date"] = "Data é obrigatória"
    elif not DATE_PATTERN.match(date):
        errors["date"] = "Data deve estar no formato YYYY-MM-DD"

    # category
    category = data.get("category")
    if category is None or not isinstance(category, str) or not category.strip():
        errors["category"] = "Categoria é obrigatória"
    elif category not in VALID_CATEGORIES:
        errors["category"] = f"Categoria inválida. Opções: {', '.join(VALID_CATEGORIES)}"

    # paymentMethod (optional)
    payment_method = data.get("paymentMethod")
    if payment_method is not None:
        if not isinstance(payment_method, str) or payment_method not in VALID_PAYMENT_METHODS:
            errors["paymentMethod"] = (
                f"Método de pagamento inválido. Opções: {', '.join(VALID_PAYMENT_METHODS)}"
            )

    return errors


def validate_upload(content_type, file_size):
    """Validate image upload type and size.

    Returns a dict of errors (empty dict if valid).
    """
    errors = {}

    if content_type not in VALID_IMAGE_TYPES:
        errors["contentType"] = "Formato não suportado. Use JPEG ou PNG."

    if file_size is not None and file_size > MAX_IMAGE_SIZE_BYTES:
        errors["fileSize"] = "Arquivo excede o tamanho máximo de 5 MB."

    return errors
