import json
from src.utils.response import success_response, error_response, CORS_HEADERS


def _get_handler(method, resource):
    """Lazily import and return the appropriate handler function."""
    routes = {
        ("POST", "/expenses"): ("src.handlers.expenses", "create"),
        ("GET", "/expenses"): ("src.handlers.expenses", "list_expenses"),
        ("GET", "/expenses/{id}"): ("src.handlers.expenses", "get"),
        ("PUT", "/expenses/{id}"): ("src.handlers.expenses", "update"),
        ("DELETE", "/expenses/{id}"): ("src.handlers.expenses", "delete"),
        ("POST", "/receipts/presign"): ("src.handlers.receipts", "presign"),
        ("POST", "/receipts/process"): ("src.handlers.receipts", "process"),
        ("POST", "/classify"): ("src.handlers.classify", "classify"),
        ("POST", "/insights"): ("src.handlers.insights", "generate"),
    }

    key = (method, resource)
    if key not in routes:
        return None

    module_path, func_name = routes[key]
    try:
        import importlib
        module = importlib.import_module(module_path)
        return getattr(module, func_name, None)
    except (ImportError, AttributeError):
        return None


def _resolve_resource(event):
    """Determine the route resource from the event.

    API Gateway provides 'resource' (e.g. /expenses/{id}).
    Falls back to matching the raw path against known patterns.
    """
    resource = event.get("resource")
    if resource:
        return resource

    path = event.get("path", "")
    # Match /expenses/{id} pattern
    if path.startswith("/expenses/") and len(path.split("/")) == 3:
        return "/expenses/{id}"
    return path


def lambda_handler(event, context):
    """Main Lambda entry point — routes requests to handlers."""
    method = event.get("httpMethod", "").upper()

    # Handle CORS preflight
    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": "",
        }

    resource = _resolve_resource(event)

    # Parse body safely
    try:
        body = json.loads(event.get("body", "{}") or "{}")
    except (json.JSONDecodeError, TypeError):
        body = {}
    event["parsedBody"] = body

    # Extract path parameters
    path_params = event.get("pathParameters") or {}
    event["pathParams"] = path_params

    handler = _get_handler(method, resource)
    if handler is None:
        return error_response("Rota não encontrada", 404)

    try:
        return handler(event)
    except Exception:
        return error_response("Erro interno do servidor", 500)
