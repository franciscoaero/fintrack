import os
import boto3

_table = None


def get_table():
    """Return the DynamoDB Table resource (singleton)."""
    global _table
    if _table is None:
        region = os.environ.get("AWS_REGION_NAME", "sa-east-1")
        table_name = os.environ.get("TABLE_NAME", "fintrack-expenses")
        dynamodb = boto3.resource("dynamodb", region_name=region)
        _table = dynamodb.Table(table_name)
    return _table
