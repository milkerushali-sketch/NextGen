from typing import Any

from .database import get_connection


def get_order(order_id: str, user_email: str) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(
            """SELECT id, status, created_at, total
               FROM orders
               WHERE id::text = %s AND user_email = %s""",
            (order_id, user_email),
        ).fetchone()
    if row is None:
        return None
    return dict(row) if hasattr(row, "keys") else {
        "id": row[0], "status": row[1], "created_at": row[2], "total": row[3]
    }
