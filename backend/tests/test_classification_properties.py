"""Property-based tests for classification service.

Uses Hypothesis for property-based testing.

**Validates: Requirements 6.3**
"""

import io
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from hypothesis import given, settings
from hypothesis import strategies as st
from unittest.mock import MagicMock

from src.services.classification_service import ClassificationService, VALID_CATEGORIES


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_bedrock_response(text: str):
    """Build a mock Bedrock invoke_model response returning *text*."""
    body_content = json.dumps({
        "content": [{"text": text}],
    }).encode("utf-8")
    return {"body": io.BytesIO(body_content)}


def _make_error_client(exc_class=Exception, message="Bedrock unavailable"):
    """Return a mock bedrock client whose invoke_model raises."""
    client = MagicMock()
    client.invoke_model.side_effect = exc_class(message)
    return client


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# Strategy: Bedrock returns one of the valid categories
valid_category_response = st.sampled_from(VALID_CATEGORIES)

# Strategy: Bedrock returns garbage / unexpected text
garbage_text = st.one_of(
    st.just(""),
    st.just("   "),
    st.just("InvalidCategory"),
    st.just("alimentação"),       # lowercase — not in set
    st.just("TRANSPORTE"),        # uppercase — not in set
    st.just("Alimentação\n"),     # trailing newline (strip should handle)
    st.just("Saúde."),            # trailing period
    st.just("Categoria: Lazer"),  # extra text
    st.text(min_size=0, max_size=200),
)

# Strategy: random descriptions to classify
random_description = st.text(min_size=1, max_size=300)


# ===========================================================================
# Property 11: Classificação sempre retorna categoria válida
# ===========================================================================


class TestProperty11ClassificationAlwaysReturnsValidCategory:
    """**Validates: Requirements 6.3**

    For any response from Bedrock (including unexpected, empty, or error
    responses), the classification service must always return a string
    from the predefined set of valid categories.
    """

    @given(category=valid_category_response, description=random_description)
    @settings(max_examples=100)
    def test_valid_bedrock_response_returns_valid_category(self, category, description):
        """When Bedrock returns a valid category, classify returns it."""
        client = MagicMock()
        client.invoke_model.return_value = _make_bedrock_response(category)

        service = ClassificationService(bedrock_client=client)
        result = service.classify(description)

        assert result in VALID_CATEGORIES, (
            f"Expected valid category, got: {result!r}"
        )
        assert result == category

    @given(garbage=garbage_text, description=random_description)
    @settings(max_examples=100)
    def test_garbage_bedrock_response_returns_valid_category(self, garbage, description):
        """When Bedrock returns garbage text, classify still returns a valid category."""
        client = MagicMock()
        client.invoke_model.return_value = _make_bedrock_response(garbage)

        service = ClassificationService(bedrock_client=client)
        result = service.classify(description)

        assert result in VALID_CATEGORIES, (
            f"Expected valid category for garbage response {garbage!r}, got: {result!r}"
        )

    @given(description=random_description)
    @settings(max_examples=100)
    def test_bedrock_exception_returns_outros(self, description):
        """When Bedrock raises an exception, classify returns 'Outros'."""
        client = _make_error_client()

        service = ClassificationService(bedrock_client=client)
        result = service.classify(description)

        assert result == "Outros", (
            f"Expected 'Outros' on exception, got: {result!r}"
        )
        assert result in VALID_CATEGORIES

    @given(
        bedrock_text=st.one_of(valid_category_response, garbage_text),
        description=random_description,
        should_error=st.booleans(),
    )
    @settings(max_examples=100)
    def test_classify_always_returns_from_valid_set(
        self, bedrock_text, description, should_error
    ):
        """Regardless of Bedrock behaviour, result is always in VALID_CATEGORIES."""
        client = MagicMock()
        if should_error:
            client.invoke_model.side_effect = Exception("boom")
        else:
            client.invoke_model.return_value = _make_bedrock_response(bedrock_text)

        service = ClassificationService(bedrock_client=client)
        result = service.classify(description)

        assert isinstance(result, str), f"Expected str, got {type(result)}"
        assert result in VALID_CATEGORIES, (
            f"Result {result!r} not in valid categories"
        )
