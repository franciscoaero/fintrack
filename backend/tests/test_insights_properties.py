"""Property-based tests for insights service.

Uses Hypothesis for property-based testing.

**Validates: Requirements 8.4**
"""

import io
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from unittest.mock import MagicMock

from src.services.insights_service import InsightsService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_CATEGORIES = [
    "Alimentação", "Transporte", "Moradia",
    "Saúde", "Lazer", "Educação", "Outros",
]


def _make_bedrock_response(text: str):
    """Build a mock Bedrock invoke_model response."""
    body_content = json.dumps({
        "content": [{"text": text}],
    }).encode("utf-8")
    return {"body": io.BytesIO(body_content)}


def _make_mock_bedrock(response_text="Aqui estão seus insights de gastos."):
    """Return a mock bedrock client that returns a fixed text response."""
    client = MagicMock()
    client.invoke_model.return_value = _make_bedrock_response(response_text)
    return client


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

expense_dict = st.fixed_dictionaries({
    "description": st.text(min_size=1, max_size=50),
    "amount": st.integers(min_value=1, max_value=99_999_999),
    "date": st.dates(
        min_value=__import__("datetime").date(2020, 1, 1),
        max_value=__import__("datetime").date(2030, 12, 31),
    ).map(lambda d: d.isoformat()),
    "category": st.sampled_from(VALID_CATEGORIES),
})

# Lists with fewer than 3 items (should be rejected)
too_few_expenses = st.lists(expense_dict, min_size=0, max_size=2)

# Lists with 3 or more items (should be accepted)
enough_expenses = st.lists(expense_dict, min_size=3, max_size=20)


# ===========================================================================
# Property 13: Insights requer mínimo de despesas
# ===========================================================================


class TestProperty13InsightsRequiresMinimumExpenses:
    """**Validates: Requirements 8.4**

    For any list of expenses with fewer than 3 items, the insights service
    must raise ValueError. For any list with 3 or more items, the service
    must accept the request (assuming Bedrock is available).
    """

    @given(expenses=too_few_expenses)
    @settings(max_examples=100)
    def test_fewer_than_3_expenses_raises_value_error(self, expenses):
        """Lists with < 3 expenses must raise ValueError."""
        service = InsightsService(bedrock_client=_make_mock_bedrock())

        with pytest.raises(ValueError) as exc_info:
            service.generate_insights(expenses)

        assert "3" in str(exc_info.value), (
            f"Error message should mention minimum of 3, got: {exc_info.value}"
        )

    @given(expenses=enough_expenses)
    @settings(max_examples=100)
    def test_3_or_more_expenses_accepted(self, expenses):
        """Lists with >= 3 expenses must be accepted and return a string."""
        service = InsightsService(bedrock_client=_make_mock_bedrock())

        result = service.generate_insights(expenses)

        assert isinstance(result, str), f"Expected str, got {type(result)}"
        assert len(result) > 0, "Expected non-empty insights text"

    @given(
        expenses=st.lists(expense_dict, min_size=0, max_size=20),
    )
    @settings(max_examples=100)
    def test_boundary_behaviour_consistent(self, expenses):
        """Verify the boundary: < 3 raises, >= 3 succeeds."""
        service = InsightsService(bedrock_client=_make_mock_bedrock())

        if len(expenses) < 3:
            with pytest.raises(ValueError):
                service.generate_insights(expenses)
        else:
            result = service.generate_insights(expenses)
            assert isinstance(result, str)
            assert len(result) > 0
