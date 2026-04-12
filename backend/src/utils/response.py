import json
from decimal import Decimal

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
}


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that converts Decimal to int or float."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj == int(obj) else float(obj)
        return super().default(obj)


def _dumps(obj):
    return json.dumps(obj, ensure_ascii=False, cls=DecimalEncoder)


def success_response(data, status_code=200):
    """Return a JSON success response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": _dumps({"data": data}),
    }


def error_response(message, status_code, fields=None):
    """Return a standardized JSON error response with CORS headers."""
    error_body = {"message": message}
    if fields:
        error_body["fields"] = fields
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": _dumps({"error": error_body}),
    }
