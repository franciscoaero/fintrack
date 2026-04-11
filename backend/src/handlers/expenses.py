from src.services.expense_service import ExpenseService
from src.utils.validators import validate_expense_input
from src.utils.response import success_response, error_response

_service = ExpenseService()


def create(event):
    """Create a new expense."""
    body = event.get("parsedBody", {})
    errors = validate_expense_input(body)
    if errors:
        return error_response("Dados inválidos", 400, fields=errors)

    expense = _service.create_expense(body)
    return success_response(expense, 201)


def list_expenses(event):
    """List expenses with optional filters."""
    params = event.get("queryStringParameters") or {}
    category = params.get("category")
    start_date = params.get("startDate")
    end_date = params.get("endDate")

    expenses = _service.list_expenses(
        category=category,
        start_date=start_date,
        end_date=end_date,
    )
    return success_response(expenses)


def get(event):
    """Get a single expense by ID."""
    expense_id = event.get("pathParams", {}).get("id", "")
    expense = _service.get_expense(expense_id)
    if expense is None:
        return error_response("Despesa não encontrada", 404)
    return success_response(expense)


def update(event):
    """Update an existing expense."""
    expense_id = event.get("pathParams", {}).get("id", "")
    body = event.get("parsedBody", {})
    errors = validate_expense_input(body)
    if errors:
        return error_response("Dados inválidos", 400, fields=errors)

    expense = _service.update_expense(expense_id, body)
    if expense is None:
        return error_response("Despesa não encontrada", 404)
    return success_response(expense)


def delete(event):
    """Delete an expense."""
    expense_id = event.get("pathParams", {}).get("id", "")
    deleted = _service.delete_expense(expense_id)
    if not deleted:
        return error_response("Despesa não encontrada", 404)
    return success_response({"deleted": True})
