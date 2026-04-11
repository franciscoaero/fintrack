"""Property-based tests for validators module.

Uses Hypothesis for property-based testing.
Tests validate correctness properties for expense input validation
and upload validation from the design document.

**Validates: Requirements 1.2, 3.3, 5.1, 5.6**
"""

import os
import sys
import string

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from hypothesis import given, settings, assume
from hypothesis import strategies as st

from src.utils.validators import (
    validate_expense_input,
    validate_upload,
    VALID_CATEGORIES,
    VALID_PAYMENT_METHODS,
    VALID_IMAGE_TYPES,
    MAX_IMAGE_SIZE_BYTES,
)


# ---------------------------------------------------------------------------
# Strategies for Property 2
# ---------------------------------------------------------------------------

valid_date_str = st.dates(
    min_value=__import__("datetime").date(2020, 1, 1),
    max_value=__import__("datetime").date(2030, 12, 31),
).map(lambda d: d.isoformat())

valid_expense = st.fixed_dictionaries({
    "description": st.text(
        min_size=1,
        max_size=100,
        alphabet=st.characters(whitelist_categories=("L", "N", "Z")),
    ),
    "amount": st.integers(min_value=1, max_value=99_999_999),
    "date": valid_date_str,
    "category": st.sampled_from(VALID_CATEGORIES),
})

valid_expense_with_payment = st.fixed_dictionaries({
    "description": st.text(
        min_size=1,
        max_size=100,
        alphabet=st.characters(whitelist_categories=("L", "N", "Z")),
    ),
    "amount": st.integers(min_value=1, max_value=99_999_999),
    "date": valid_date_str,
    "category": st.sampled_from(VALID_CATEGORIES),
    "paymentMethod": st.sampled_from(VALID_PAYMENT_METHODS),
})

# Strategy for invalid amounts: 0, negative, floats, strings
invalid_amount = st.one_of(
    st.just(0),
    st.integers(max_value=-1),
    st.floats(allow_nan=False, allow_infinity=False),
    st.text(min_size=1, max_size=20),
    st.just(None),
)

# Strategy for invalid date formats (not YYYY-MM-DD)
invalid_date = st.one_of(
    st.just(""),
    st.just(None),
    st.just("31/12/2024"),       # DD/MM/YYYY
    st.just("12-31-2024"),       # MM-DD-YYYY
    st.just("2024/01/01"),       # slashes
    st.just("not-a-date"),
    st.text(min_size=1, max_size=20).filter(
        lambda s: not __import__("re").match(r"^\d{4}-\d{2}-\d{2}$", s)
    ),
    st.integers(),
)

# Strategy for invalid categories (not in predefined set)
invalid_category = st.one_of(
    st.just(""),
    st.just(None),
    st.text(min_size=1, max_size=50).filter(lambda s: s.strip() not in VALID_CATEGORIES),
    st.integers(),
)

# Strategy for invalid payment methods
invalid_payment_method = st.one_of(
    st.text(min_size=1, max_size=50).filter(lambda s: s not in VALID_PAYMENT_METHODS),
    st.integers(),
)

# Strategy for missing/empty descriptions
invalid_description = st.one_of(
    st.just(""),
    st.just(None),
    st.just("   "),  # whitespace only
)


# ===========================================================================
# Property 2: Validação rejeita inputs inválidos
# ===========================================================================


class TestProperty2ValidationRejectsInvalid:
    """**Validates: Requirements 1.2, 3.3**

    For any expense input where at least one required field is missing, empty,
    or invalid (amount <= 0, date in wrong format, category outside predefined
    set), validate_expense_input() must reject the input and return error
    messages referencing the specific invalid fields.
    """

    @given(expense=valid_expense)
    @settings(max_examples=100)
    def test_valid_input_returns_empty_errors(self, expense):
        """Valid inputs should return empty errors dict."""
        errors = validate_expense_input(expense)
        assert errors == {}, f"Expected no errors for valid input, got: {errors}"

    @given(expense=valid_expense_with_payment)
    @settings(max_examples=100)
    def test_valid_input_with_payment_returns_empty_errors(self, expense):
        """Valid inputs with paymentMethod should return empty errors dict."""
        errors = validate_expense_input(expense)
        assert errors == {}, f"Expected no errors for valid input with payment, got: {errors}"

    @given(
        base=valid_expense,
        bad_desc=invalid_description,
    )
    @settings(max_examples=100)
    def test_missing_or_empty_description_rejected(self, base, bad_desc):
        """Missing or empty description must be rejected with 'description' error."""
        data = {**base, "description": bad_desc}
        errors = validate_expense_input(data)
        assert "description" in errors, f"Expected 'description' error, got: {errors}"

    @given(
        base=valid_expense,
        bad_amount=invalid_amount,
    )
    @settings(max_examples=100)
    def test_invalid_amount_rejected(self, base, bad_amount):
        """Invalid amount (0, negative, float, string, None) must be rejected."""
        data = {**base, "amount": bad_amount}
        errors = validate_expense_input(data)
        assert "amount" in errors, f"Expected 'amount' error for {bad_amount!r}, got: {errors}"

    @given(
        base=valid_expense,
        bad_date=invalid_date,
    )
    @settings(max_examples=100)
    def test_invalid_date_rejected(self, base, bad_date):
        """Invalid date format must be rejected with 'date' error."""
        data = {**base, "date": bad_date}
        errors = validate_expense_input(data)
        assert "date" in errors, f"Expected 'date' error for {bad_date!r}, got: {errors}"

    @given(
        base=valid_expense,
        bad_category=invalid_category,
    )
    @settings(max_examples=100)
    def test_invalid_category_rejected(self, base, bad_category):
        """Invalid category must be rejected with 'category' error."""
        data = {**base, "category": bad_category}
        errors = validate_expense_input(data)
        assert "category" in errors, f"Expected 'category' error for {bad_category!r}, got: {errors}"

    @given(
        base=valid_expense,
        bad_payment=invalid_payment_method,
    )
    @settings(max_examples=100)
    def test_invalid_payment_method_rejected(self, base, bad_payment):
        """Invalid paymentMethod must be rejected with 'paymentMethod' error."""
        data = {**base, "paymentMethod": bad_payment}
        errors = validate_expense_input(data)
        assert "paymentMethod" in errors, (
            f"Expected 'paymentMethod' error for {bad_payment!r}, got: {errors}"
        )

    @given(base=valid_expense)
    @settings(max_examples=100)
    def test_missing_required_field_rejected(self, base):
        """Removing any required field should produce an error for that field."""
        required_fields = ["description", "amount", "date", "category"]
        for field in required_fields:
            data = {k: v for k, v in base.items() if k != field}
            errors = validate_expense_input(data)
            assert field in errors, (
                f"Expected '{field}' error when field is missing, got: {errors}"
            )

    @settings(max_examples=100)
    @given(data=st.one_of(st.just(None), st.just(42), st.just("string"), st.just([])))
    def test_non_dict_input_rejected(self, data):
        """Non-dict inputs must be rejected."""
        errors = validate_expense_input(data)
        assert len(errors) > 0, f"Expected errors for non-dict input {data!r}"



# ===========================================================================
# Property 10: Validação de upload aceita/rejeita corretamente
# ===========================================================================

# Strategies for Property 10

valid_content_types = st.sampled_from(VALID_IMAGE_TYPES)
valid_file_sizes = st.integers(min_value=0, max_value=MAX_IMAGE_SIZE_BYTES)

# Invalid content types: random strings, other MIME types
invalid_content_types = st.one_of(
    st.just("image/gif"),
    st.just("image/webp"),
    st.just("image/bmp"),
    st.just("application/pdf"),
    st.just("text/plain"),
    st.just("video/mp4"),
    st.just("application/octet-stream"),
    st.text(min_size=1, max_size=50).filter(lambda s: s not in VALID_IMAGE_TYPES),
)

# Sizes exceeding 5MB
oversized_file_sizes = st.integers(
    min_value=MAX_IMAGE_SIZE_BYTES + 1,
    max_value=MAX_IMAGE_SIZE_BYTES * 10,
)


class TestProperty10UploadValidation:
    """**Validates: Requirements 5.1, 5.6**

    For any file with content-type and size, validate_upload() must accept
    if and only if content-type is image/jpeg or image/png AND size is <= 5MB.
    Otherwise reject with descriptive error message.
    """

    @given(
        content_type=valid_content_types,
        file_size=valid_file_sizes,
    )
    @settings(max_examples=100)
    def test_valid_type_and_size_accepted(self, content_type, file_size):
        """Valid content type (JPEG/PNG) with valid size (<= 5MB) should be accepted."""
        errors = validate_upload(content_type, file_size)
        assert errors == {}, (
            f"Expected no errors for {content_type} / {file_size} bytes, got: {errors}"
        )

    @given(
        content_type=invalid_content_types,
        file_size=valid_file_sizes,
    )
    @settings(max_examples=100)
    def test_invalid_type_rejected(self, content_type, file_size):
        """Invalid content type must be rejected with 'contentType' error."""
        errors = validate_upload(content_type, file_size)
        assert "contentType" in errors, (
            f"Expected 'contentType' error for {content_type!r}, got: {errors}"
        )

    @given(
        content_type=valid_content_types,
        file_size=oversized_file_sizes,
    )
    @settings(max_examples=100)
    def test_oversized_file_rejected(self, content_type, file_size):
        """Valid content type with size > 5MB must be rejected with 'fileSize' error."""
        errors = validate_upload(content_type, file_size)
        assert "fileSize" in errors, (
            f"Expected 'fileSize' error for {file_size} bytes, got: {errors}"
        )

    @given(
        content_type=invalid_content_types,
        file_size=oversized_file_sizes,
    )
    @settings(max_examples=100)
    def test_invalid_type_and_oversized_both_rejected(self, content_type, file_size):
        """Invalid type AND oversized must produce errors for both fields."""
        errors = validate_upload(content_type, file_size)
        assert "contentType" in errors, (
            f"Expected 'contentType' error for {content_type!r}, got: {errors}"
        )
        assert "fileSize" in errors, (
            f"Expected 'fileSize' error for {file_size} bytes, got: {errors}"
        )

    @given(
        content_type=st.one_of(valid_content_types, invalid_content_types),
        file_size=st.one_of(valid_file_sizes, oversized_file_sizes),
    )
    @settings(max_examples=100)
    def test_accept_iff_valid_type_and_valid_size(self, content_type, file_size):
        """Upload accepted if and only if type is JPEG/PNG AND size <= 5MB."""
        errors = validate_upload(content_type, file_size)
        type_valid = content_type in VALID_IMAGE_TYPES
        size_valid = file_size <= MAX_IMAGE_SIZE_BYTES

        if type_valid and size_valid:
            assert errors == {}, (
                f"Should accept {content_type} / {file_size}B, got errors: {errors}"
            )
        else:
            assert len(errors) > 0, (
                f"Should reject {content_type} / {file_size}B, but got no errors"
            )
            if not type_valid:
                assert "contentType" in errors
            if not size_valid:
                assert "fileSize" in errors
