from __future__ import annotations

from typing import Any

from .database import get_connection


class OwnershipError(PermissionError):
    pass


def _authorize_customer(customer_id: int | None, authenticated_customer_id: int | None) -> int:
    if customer_id is None or authenticated_customer_id is None:
        raise OwnershipError("Sign in to access customer data.")
    if customer_id != authenticated_customer_id:
        raise OwnershipError("Customer data access is not authorized.")
    return authenticated_customer_id


def search_products(
    query: str = "",
    category: str | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    in_stock: bool | None = None,
    limit: int = 8,
) -> list[dict[str, Any]]:
    conditions = ["(name ILIKE %s OR category ILIKE %s OR description ILIKE %s OR array_to_string(tags, ' ') ILIKE %s)"]
    terms = [f"%{query.strip()}%"] * 4
    if category:
        conditions.append("category ILIKE %s")
        terms.append(f"%{category.strip()}%")
    if max_price is not None:
        conditions.append("price <= %s")
        terms.append(max_price)
    if min_rating is not None:
        conditions.append("rating >= %s")
        terms.append(min_rating)
    if in_stock is True:
        conditions.append("stock_quantity > 0")
    elif in_stock is False:
        conditions.append("stock_quantity = 0")
    terms.append(max(1, min(limit, 20)))
    sql = f"""
        SELECT id, name, category, price, rating, image, description,
               stock_quantity, tags
        FROM products
        WHERE {' AND '.join(conditions)}
        ORDER BY rating DESC, reviews DESC
        LIMIT %s
    """
    with get_connection() as connection:
        rows = connection.execute(sql, terms).fetchall()
    return [dict(row) for row in rows]


def get_product_details(product_id: int) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(
            """SELECT id, name, category, price, rating, image, description,
                      stock_quantity, tags
               FROM products WHERE id = %s""",
            (product_id,),
        ).fetchone()
    return dict(row) if row else None


def check_product_stock(product_id: int) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, name, stock_quantity FROM products WHERE id = %s",
            (product_id,),
        ).fetchone()
    if row is None:
        return None
    stock = row["stock_quantity"]
    return {
        "id": row["id"],
        "name": row["name"],
        "quantity": stock,
        "verified": stock is not None,
        "available": stock > 0 if stock is not None else None,
    }


def get_cart_details(
    customer_id: int | None, authenticated_customer_id: int | None
) -> list[dict[str, Any]]:
    owner = _authorize_customer(customer_id, authenticated_customer_id)
    with get_connection() as connection:
        rows = connection.execute(
            """SELECT p.id, p.name, p.category, p.price, p.image,
                      ci.quantity, p.stock_quantity
               FROM carts c
               JOIN cart_items ci ON ci.cart_id = c.id
               JOIN products p ON p.id = ci.product_id
               WHERE c.customer_id = %s ORDER BY ci.created_at""",
            (owner,),
        ).fetchall()
    return [dict(row) for row in rows]


def add_to_cart(
    customer_id: int | None,
    authenticated_customer_id: int | None,
    product_id: int,
    quantity: int = 1,
) -> dict[str, Any]:
    owner = _authorize_customer(customer_id, authenticated_customer_id)
    if not 1 <= quantity <= 20:
        raise ValueError("Quantity must be between 1 and 20.")
    with get_connection() as connection:
        with connection.transaction():
            product = connection.execute(
                "SELECT id, name, stock_quantity FROM products WHERE id = %s FOR UPDATE",
                (product_id,),
            ).fetchone()
            if product is None:
                raise ValueError("That product is no longer available.")
            cart = connection.execute(
                """INSERT INTO carts (customer_id) VALUES (%s)
                   ON CONFLICT (customer_id) DO UPDATE SET updated_at = NOW()
                   RETURNING id""",
                (owner,),
            ).fetchone()
            existing = connection.execute(
                """SELECT quantity FROM cart_items
                   WHERE cart_id = %s AND product_id = %s FOR UPDATE""",
                (cart["id"], product_id),
            ).fetchone()
            next_quantity = int(existing["quantity"]) + quantity if existing else quantity
            if next_quantity > 20:
                raise ValueError("A cart item cannot exceed 20 units.")
            if (
                product["stock_quantity"] is not None
                and next_quantity > product["stock_quantity"]
            ):
                raise ValueError("There is not enough recorded stock for that quantity.")
            item = connection.execute(
                """INSERT INTO cart_items (cart_id, product_id, quantity)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (cart_id, product_id)
                   DO UPDATE SET quantity = EXCLUDED.quantity,
                                 updated_at = NOW()
                   RETURNING quantity""",
                (cart["id"], product_id, next_quantity),
            ).fetchone()
    return {
        "product_id": product_id,
        "name": product["name"],
        "quantity": item["quantity"],
        "stock_verified": product["stock_quantity"] is not None,
    }


def get_order_details(
    customer_id: int | None,
    authenticated_customer_id: int | None,
    order_id: int,
) -> dict[str, Any] | None:
    owner = _authorize_customer(customer_id, authenticated_customer_id)
    with get_connection() as connection:
        row = connection.execute(
            """SELECT id, status, total, created_at
               FROM orders WHERE customer_id = %s AND id = %s""",
            (owner, order_id),
        ).fetchone()
    return dict(row) if row else None


def get_tracking_details(
    customer_id: int | None,
    authenticated_customer_id: int | None,
    order_id: int,
) -> dict[str, Any] | None:
    owner = _authorize_customer(customer_id, authenticated_customer_id)
    with get_connection() as connection:
        row = connection.execute(
            """SELECT o.id, o.status, d.status AS shipment_status,
                      d.tracking_id, d.expected_delivery, d.carrier
               FROM orders o
               LEFT JOIN deliveries d ON d.order_id = o.id
               WHERE o.customer_id = %s AND o.id = %s""",
            (owner, order_id),
        ).fetchone()
    return dict(row) if row else None


def get_payment_details(
    customer_id: int | None,
    authenticated_customer_id: int | None,
    order_id: int,
) -> dict[str, Any] | None:
    owner = _authorize_customer(customer_id, authenticated_customer_id)
    with get_connection() as connection:
        row = connection.execute(
            """SELECT o.id AS order_id, p.status, p.refund_status,
                      p.amount, p.updated_at
               FROM orders o
               LEFT JOIN payments p ON p.order_id = o.id
               WHERE o.customer_id = %s AND o.id = %s""",
            (owner, order_id),
        ).fetchone()
    return dict(row) if row else None


def get_customer_history(
    customer_id: int | None, authenticated_customer_id: int | None
) -> list[dict[str, Any]]:
    owner = _authorize_customer(customer_id, authenticated_customer_id)
    with get_connection() as connection:
        rows = connection.execute(
            """SELECT id, status, total, created_at
               FROM orders WHERE customer_id = %s
               ORDER BY created_at DESC LIMIT 20""",
            (owner,),
        ).fetchall()
    return [dict(row) for row in rows]


def create_support_ticket(
    customer_id: int | None,
    authenticated_customer_id: int | None,
    complaint: str,
    category: str,
    priority: str,
    order_id: int | None = None,
) -> dict[str, Any]:
    owner = _authorize_customer(customer_id, authenticated_customer_id)
    with get_connection() as connection:
        with connection.transaction():
            customer = connection.execute(
                "SELECT email FROM users WHERE id = %s", (owner,)
            ).fetchone()
            if customer is None:
                raise OwnershipError("Authenticated customer no longer exists.")
            if order_id is not None and not connection.execute(
                "SELECT 1 FROM orders WHERE customer_id = %s AND id = %s",
                (owner, order_id),
            ).fetchone():
                raise OwnershipError("The order is not associated with this account.")
            ticket = connection.execute(
                """INSERT INTO support_tickets
                       (customer_id, user_email, subject, description, category, priority, order_id)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                   RETURNING id, subject, status, priority, created_at""",
                (owner, customer["email"], category[:200], complaint, category, priority, order_id),
            ).fetchone()
            connection.execute(
                """INSERT INTO ticket_messages (ticket_id, sender_type, message)
                   VALUES (%s, 'customer', %s)""",
                (ticket["id"], complaint),
            )
    return dict(ticket)


def escalate_ticket(
    ticket_id: int,
    reason: str,
    assigned_team: str,
    priority: str,
    customer_id: int | None,
    authenticated_customer_id: int | None,
) -> dict[str, Any]:
    owner = _authorize_customer(customer_id, authenticated_customer_id)
    with get_connection() as connection:
        with connection.transaction():
            ticket = connection.execute(
                """UPDATE support_tickets SET status = 'escalated', updated_at = NOW()
                   WHERE id = %s AND customer_id = %s RETURNING id""",
                (ticket_id, owner),
            ).fetchone()
            if ticket is None:
                raise OwnershipError("Ticket is not associated with this account.")
            escalation = connection.execute(
                """INSERT INTO escalations
                       (ticket_id, customer_id, reason, assigned_team, priority)
                   VALUES (%s, %s, %s, %s, %s)
                   RETURNING id, assigned_team, priority, status""",
                (ticket_id, owner, reason, assigned_team, priority),
            ).fetchone()
    return dict(escalation)
