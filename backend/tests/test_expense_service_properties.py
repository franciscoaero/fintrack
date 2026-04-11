"""Property-based tests for ExpenseService CRUD operations.

Uses Hypothesis for property-based testing and moto for DynamoDB mocking.
Each test validates a specific correctness property from the design document.

**Validates: Requirements 1.1, 2.1, 2.3, 2.4, 3.2, 4.2, 4.4**
"""

import datetime
import os
from unittest.mock import MagicMock

import boto3
from moto import mock_aws

from hypothesis import given, settings
from hypothesis import strategies as st

import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.services.expense_service import ExpenseService

# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

CATEGORIES = [
    "Alimentação", "Transporte", "Moradia",
    "Saúde", "Lazer", "Educação", "Outros",
]

valid_expense_input = st.fixed_dictionaries({
    "description": st.text(
        min_size=1,
        max_size=100,
        alphabet=st.characters(
            whitelist_categories=("L", "N", "P", "Z"),
        ),
    ),
    "amount": st.integers(min_value=1, max_value=99_999_999),
    "date": st.dates(
        min_value=datetime.date(2020, 1, 1),
        max_value=datetime.date(2030, 12, 31),
    ).map(lambda d: d.isoformat()),
    "category": st.sampled_from(CATEGORIES),
})


# ---------------------------------------------------------------------------
# Helper: create a fresh mocked DynamoDB table per test invocation
# ---------------------------------------------------------------------------

def _setup_env():
    os.environ["TABLE_NAME"] = "fintrack-expenses-test"
    os.environ["BUCKET_NAME"] = "fintrack-receipts-test"
    os.environ["AWS_REGION_NAME"] = "sa-east-1"
    os.environ["AWS_DEFAULT_REGION"] = "sa-east-1"
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"


def _create_table():
    dynamodb = boto3.resource("dynamodb", region_name="sa-east-1")
    table = dynamodb.create_table(
        TableName="fintrack-expenses-test",
        KeySchema=[
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
            {"AttributeName": "userId", "AttributeType": "S"},
            {"AttributeName": "category", "AttributeType": "S"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "CategoryIndex",
                "KeySchema": [
                    {"AttributeName": "userId", "KeyType": "HASH"},
                    {"AttributeName": "category", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    table.meta.client.get_waiter("table_exists").wait(
        TableName="fintrack-expenses-test"
    )
    return table


# ---------------------------------------------------------------------------
# Property 1: Round-trip de criação de despesa
# ---------------------------------------------------------------------------


class TestProperty1RoundTrip:
    """**Validates: Requirements 1.1**

    For any valid expense input, creating the expense and then retrieving it
    by the returned ID should preserve all original input fields, and the
    record must contain a unique expenseId.
    """

    @given(expense=valid_expense_input)
    @settings(max_examples=100, deadline=None)
    def test_create_then_get_preserves_fields(self, expense):
        """Property 1: Round-trip de criação de despesa."""
        _setup_env()
        with mock_aws():
            table = _create_table()
            service = ExpenseService(table=table, s3_client=MagicMock())

            created = service.create_expense(expense)

            assert "expenseId" in created
            assert len(created["expenseId"]) > 0

            retrieved = service.get_expense(created["expenseId"])

            assert retrieved is not None
            assert retrieved["description"] == expense["description"]
            assert retrieved["amount"] == expense["amount"]
            assert retrieved["date"] == expense["date"]
            assert retrieved["category"] == expense["category"]
            assert retrieved["expenseId"] == created["expenseId"]


# ---------------------------------------------------------------------------
# Property 3: Listagem ordenada por data decrescente
# ---------------------------------------------------------------------------


class TestProperty3SortedByDateDesc:
    """**Validates: Requirements 2.1**

    For any set of expenses with varied dates, listing them should return
    results sorted by date descending (most recent first).
    """

    @given(expenses=st.lists(valid_expense_input, min_size=2, max_size=15))
    @settings(max_examples=100, deadline=None)
    def test_list_returns_sorted_by_date_desc(self, expenses):
        """Property 3: Listagem ordenada por data decrescente."""
        _setup_env()
        with mock_aws():
            table = _create_table()
            service = ExpenseService(table=table, s3_client=MagicMock())

            for exp in expenses:
                service.create_expense(exp)

            result = service.list_expenses()

            dates = [item["date"] for item in result]
            for i in range(len(dates) - 1):
                assert dates[i] >= dates[i + 1], (
                    f"Not sorted desc: {dates[i]} < {dates[i + 1]}"
                )


# ---------------------------------------------------------------------------
# Property 5: Filtro por categoria retorna apenas a categoria selecionada
# ---------------------------------------------------------------------------


class TestProperty5FilterByCategory:
    """**Validates: Requirements 2.3**

    For any set of expenses with varied categories and any selected category
    filter, all returned expenses must belong exclusively to the selected
    category, and no expense of that category should be omitted.
    """

    @given(
        expenses=st.lists(valid_expense_input, min_size=1, max_size=15),
        filter_category=st.sampled_from(CATEGORIES),
    )
    @settings(max_examples=100, deadline=None)
    def test_filter_by_category_returns_only_selected(
        self, expenses, filter_category
    ):
        """Property 5: Filtro por categoria retorna apenas a categoria selecionada."""
        _setup_env()
        with mock_aws():
            table = _create_table()
            service = ExpenseService(table=table, s3_client=MagicMock())

            for exp in expenses:
                service.create_expense(exp)

            result = service.list_expenses(category=filter_category)

            # All returned items must have the selected category
            for item in result:
                assert item["category"] == filter_category, (
                    f"Expected '{filter_category}', got '{item['category']}'"
                )

            # No expense of that category should be omitted
            expected_count = sum(
                1 for e in expenses if e["category"] == filter_category
            )
            assert len(result) == expected_count, (
                f"Expected {expected_count} items, got {len(result)}"
            )


# ---------------------------------------------------------------------------
# Property 6: Filtro por período retorna apenas datas no intervalo
# ---------------------------------------------------------------------------


class TestProperty6FilterByDateRange:
    """**Validates: Requirements 2.4**

    For any set of expenses with varied dates and any date range
    (start_date <= end_date), all returned expenses must have dates within
    the specified range (inclusive).
    """

    @given(
        expenses=st.lists(valid_expense_input, min_size=1, max_size=15),
        date_pair=st.tuples(
            st.dates(
                min_value=datetime.date(2020, 1, 1),
                max_value=datetime.date(2030, 12, 31),
            ),
            st.dates(
                min_value=datetime.date(2020, 1, 1),
                max_value=datetime.date(2030, 12, 31),
            ),
        ),
    )
    @settings(max_examples=100, deadline=None)
    def test_filter_by_date_range_returns_only_in_range(
        self, expenses, date_pair
    ):
        """Property 6: Filtro por período retorna apenas datas no intervalo."""
        start_date = min(date_pair).isoformat()
        end_date = max(date_pair).isoformat()

        _setup_env()
        with mock_aws():
            table = _create_table()
            service = ExpenseService(table=table, s3_client=MagicMock())

            for exp in expenses:
                service.create_expense(exp)

            result = service.list_expenses(
                start_date=start_date, end_date=end_date
            )

            # All returned items must be within the range
            for item in result:
                assert item["date"] >= start_date, (
                    f"Date {item['date']} before start {start_date}"
                )
                assert item["date"] <= end_date, (
                    f"Date {item['date']} after end {end_date}"
                )

            # No expense within the range should be omitted
            expected_count = sum(
                1 for e in expenses
                if start_date <= e["date"] <= end_date
            )
            assert len(result) == expected_count, (
                f"Expected {expected_count} in range, got {len(result)}"
            )


# ---------------------------------------------------------------------------
# Property 7: Atualização preserva dados modificados
# ---------------------------------------------------------------------------


class TestProperty7UpdatePreservesData:
    """**Validates: Requirements 3.2**

    For any existing expense and any valid update data, after updating, the
    returned record must reflect exactly the new values while maintaining
    the same expenseId.
    """

    @given(
        original=valid_expense_input,
        update=valid_expense_input,
    )
    @settings(max_examples=100, deadline=None)
    def test_update_reflects_new_values(self, original, update):
        """Property 7: Atualização preserva dados modificados."""
        _setup_env()
        with mock_aws():
            table = _create_table()
            service = ExpenseService(table=table, s3_client=MagicMock())

            created = service.create_expense(original)
            expense_id = created["expenseId"]

            updated = service.update_expense(expense_id, update)

            assert updated is not None
            assert updated["expenseId"] == expense_id
            assert updated["description"] == update["description"]
            assert updated["amount"] == update["amount"]
            assert updated["date"] == update["date"]
            assert updated["category"] == update["category"]


# ---------------------------------------------------------------------------
# Property 8: Exclusão remove despesa do banco
# ---------------------------------------------------------------------------


class TestProperty8DeleteRemovesExpense:
    """**Validates: Requirements 4.2**

    For any existing expense, after deleting it, attempting to retrieve it
    by ID should return None.
    """

    @given(expense=valid_expense_input)
    @settings(max_examples=100, deadline=None)
    def test_delete_then_get_returns_none(self, expense):
        """Property 8: Exclusão remove despesa do banco."""
        _setup_env()
        with mock_aws():
            table = _create_table()
            service = ExpenseService(table=table, s3_client=MagicMock())

            created = service.create_expense(expense)
            expense_id = created["expenseId"]

            result = service.delete_expense(expense_id)
            assert result is True

            retrieved = service.get_expense(expense_id)
            assert retrieved is None


# ---------------------------------------------------------------------------
# Property 9: Exclusão de despesa com comprovante remove imagem
# ---------------------------------------------------------------------------


class TestProperty9DeleteRemovesReceipt:
    """**Validates: Requirements 4.4**

    For any expense with a receiptKey, deleting it should invoke S3
    delete_object with the correct key. For expenses without receiptKey,
    no S3 deletion should occur.
    """

    @given(
        expense=valid_expense_input,
        receipt_key=st.text(
            min_size=5,
            max_size=80,
            alphabet=st.characters(
                whitelist_categories=("L", "N"),
                whitelist_characters="/-_.",
            ),
        ),
    )
    @settings(max_examples=100, deadline=None)
    def test_delete_with_receipt_calls_s3(self, expense, receipt_key):
        """Property 9 (with receipt): deleting expense with receipt removes image from S3."""
        _setup_env()
        with mock_aws():
            table = _create_table()
            mock_s3 = MagicMock()
            service = ExpenseService(table=table, s3_client=mock_s3)

            expense_with_receipt = {**expense, "receiptKey": receipt_key}
            created = service.create_expense(expense_with_receipt)

            service.delete_expense(created["expenseId"])

            mock_s3.delete_object.assert_called_once_with(
                Bucket="fintrack-receipts-test",
                Key=receipt_key,
            )

    @given(expense=valid_expense_input)
    @settings(max_examples=100, deadline=None)
    def test_delete_without_receipt_does_not_call_s3(self, expense):
        """Property 9 (without receipt): no S3 deletion for expenses without receiptKey."""
        _setup_env()
        with mock_aws():
            table = _create_table()
            mock_s3 = MagicMock()
            service = ExpenseService(table=table, s3_client=mock_s3)

            created = service.create_expense(expense)

            service.delete_expense(created["expenseId"])

            mock_s3.delete_object.assert_not_called()
