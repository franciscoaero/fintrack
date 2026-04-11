from src.services.expense_service import ExpenseService
from src.services.insights_service import InsightsService
from src.utils.response import success_response, error_response

_expense_service = ExpenseService()
_insights_service = InsightsService()


def generate(event):
    """Generate spending insights via AI for a given period."""
    body = event.get("parsedBody", {})
    start_date = body.get("startDate")
    end_date = body.get("endDate")

    expenses = _expense_service.list_expenses(
        start_date=start_date,
        end_date=end_date,
    )

    try:
        text = _insights_service.generate_insights(expenses)
        return success_response({"insights": text})
    except ValueError as exc:
        return error_response(str(exc), 400)
    except Exception:
        return error_response(
            "Serviço de insights temporariamente indisponível.", 503
        )
