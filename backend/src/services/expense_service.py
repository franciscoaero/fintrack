from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key, Attr


class ExpenseService:
    """Service for CRUD operations on expenses in DynamoDB."""

    DEFAULT_USER_ID = "default-user"

    def __init__(self, table=None, s3_client=None):
        if table is not None:
            self._table = table
        else:
            from src.utils.dynamo_client import get_table
            self._table = get_table()

        if s3_client is not None:
            self._s3 = s3_client
        else:
            self._s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION_NAME", "sa-east-1"))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _now_iso():
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    @staticmethod
    def _build_pk(user_id):
        return f"USER#{user_id}"

    @staticmethod
    def _build_sk(date, expense_id):
        return f"EXPENSE#{date}#{expense_id}"

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create_expense(self, expense_input: dict) -> dict:
        """Create a new expense in DynamoDB and return the full record."""
        expense_id = str(uuid.uuid4())
        now = self._now_iso()
        user_id = self.DEFAULT_USER_ID
        expense_date = expense_input["date"]

        item = {
            "PK": self._build_pk(user_id),
            "SK": self._build_sk(expense_date, expense_id),
            "expenseId": expense_id,
            "userId": user_id,
            "description": expense_input["description"],
            "amount": expense_input["amount"],
            "date": expense_date,
            "category": expense_input["category"],
            "createdAt": now,
            "updatedAt": now,
        }

        if expense_input.get("paymentMethod"):
            item["paymentMethod"] = expense_input["paymentMethod"]

        if expense_input.get("receiptKey"):
            item["receiptKey"] = expense_input["receiptKey"]

        self._table.put_item(Item=item)
        return item

    def list_expenses(self, user_id: str = None, category: str = None,
                      start_date: str = None, end_date: str = None) -> list:
        """List expenses with optional filters, sorted by date descending."""
        user_id = user_id or self.DEFAULT_USER_ID
        pk = self._build_pk(user_id)

        if category:
            # Use the CategoryIndex GSI
            key_condition = Key("userId").eq(user_id) & Key("category").eq(category)
            response = self._table.query(
                IndexName="CategoryIndex",
                KeyConditionExpression=key_condition,
            )
            items = response.get("Items", [])
        else:
            # Query main table with SK prefix
            key_condition = Key("PK").eq(pk) & Key("SK").begins_with("EXPENSE#")
            response = self._table.query(KeyConditionExpression=key_condition)
            items = response.get("Items", [])

        # Apply date filters
        if start_date:
            items = [i for i in items if i.get("date", "") >= start_date]
        if end_date:
            items = [i for i in items if i.get("date", "") <= end_date]

        # Sort by date descending
        items.sort(key=lambda x: x.get("date", ""), reverse=True)
        return items

    def get_expense(self, expense_id: str) -> dict | None:
        """Find an expense by expenseId. Returns the item dict or None."""
        pk = self._build_pk(self.DEFAULT_USER_ID)
        response = self._table.query(
            KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("EXPENSE#"),
            FilterExpression=Attr("expenseId").eq(expense_id),
        )
        items = response.get("Items", [])
        return items[0] if items else None

    def update_expense(self, expense_id: str, expense_input: dict) -> dict | None:
        """Update an existing expense. Returns updated item or None if not found."""
        existing = self.get_expense(expense_id)
        if not existing:
            return None

        now = self._now_iso()

        # Build the updated item, preserving PK/SK and expenseId
        updated = {**existing}
        for field in ("description", "amount", "date", "category", "paymentMethod", "receiptKey"):
            if field in expense_input:
                updated[field] = expense_input[field]
        updated["updatedAt"] = now

        # If the date changed we need a new SK
        new_date = updated["date"]
        new_sk = self._build_sk(new_date, expense_id)

        if new_sk != existing["SK"]:
            # Delete old item and write new one
            self._table.delete_item(Key={"PK": existing["PK"], "SK": existing["SK"]})
            updated["SK"] = new_sk
            self._table.put_item(Item=updated)
        else:
            self._table.put_item(Item=updated)

        return updated

    def delete_expense(self, expense_id: str) -> bool:
        """Delete an expense (and its S3 receipt if present). Returns True on success."""
        existing = self.get_expense(expense_id)
        if not existing:
            return False

        # Remove from DynamoDB
        self._table.delete_item(Key={"PK": existing["PK"], "SK": existing["SK"]})

        # Remove receipt from S3 if present
        receipt_key = existing.get("receiptKey")
        if receipt_key:
            bucket = os.environ.get("BUCKET_NAME", "")
            if bucket:
                try:
                    self._s3.delete_object(Bucket=bucket, Key=receipt_key)
                except Exception:
                    pass  # Best-effort deletion

        return True
