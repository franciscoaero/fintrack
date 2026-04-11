import json

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
}


def success_response(data, status_code=200):
    """Return a JSON success response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"data": data}, ensure_ascii=False),
    }


def error_response(message, status_code, fields=None):
    """Return a standardized JSON error response with CORS headers."""
    error_body = {"message": message}
    if fields:
        error_body["fields"] = fields
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"error": error_body}, ensure_ascii=False),
    }
