from __future__ import annotations

import json
import logging
import re
from typing import Any

from .audit_logger import log_decision
from .config import get_settings
from .escalation import get_escalation_decision, get_unresolved_ticket_count
from .llm_provider import create_llm, invoke_tool_agent
from .ml_predictor import predict
from .rag import retrieve_policy_context
from . import tools as business_tools
from .schemas import AgentRequest, AgentResponse
from .web_tools import is_safe_public_query, search_web, search_wikipedia

logger = logging.getLogger("novacart.ai.agent")
_ORDER_NUMBER = re.compile(r"\border\s*#?\s*(\d{3,12})\b", re.I)
_PRODUCT_QUERY = re.compile(
    r"\b(product|recommend|show|find|looking for|under|below|budget|"
    r"available|stock|cozy|home|office|style)\b",
    re.I,
)
_STOCK_QUERY = re.compile(r"\b(stock|available|availability|in stock|out of stock)\b", re.I)
_POLICY_QUERY = re.compile(
    r"\b(return|refund|cancel|replacement|delivery policy|payment policy|"
    r"damaged|privacy policy)\b",
    re.I,
)
_POLICY_STATUS_QUERY = re.compile(r"\b(refund|payment)\s+(status|query)\b", re.I)
_ORDER_QUERY = re.compile(
    r"\b(track|tracking|order status|delivery status|shipment|refund status|payment status|"
    r"refund query|return (?:my |your |the )?(?:order|item|purchase)|"
    r"refund (?:my |the |for (?:my )?|on (?:my )?)?order|"
    r"cancel (?:my |your |the )?order)\b",
    re.I,
)
_CONFIRM_ACTION = re.compile(r"\b(submit|confirm|yes|go ahead|please proceed)\b", re.I)
_RETURN_REQUEST = re.compile(
    r"\b(return (?:my |your |the )?(?:order|item|purchase)|"
    r"i want to return|start (?:a )?return|request (?:a )?return)\b",
    re.I,
)
_REFUND_REQUEST = re.compile(
    r"\b(request (?:a )?refund|i want (?:a )?refund|refund my order|"
    r"get (?:a )?refund for (?:my )?order)\b",
    re.I,
)
_CANCEL_REQUEST = re.compile(
    r"\b(cancel (?:my |your |the )?order|i want to cancel|cancel this order)\b",
    re.I,
)
_CART_CONFIRM = re.compile(
    r"\b(confirm|yes|add it|add that|put it in my cart|add to my cart)\b",
    re.I,
)
_CART_ASK = re.compile(r"\b(add|put)\b.*\b(cart|basket)\b", re.I)
_TICKET_ASK = re.compile(r"\b(create|open|raise|submit)\b.*\b(ticket|case)\b", re.I)


def _is_policy_question(message: str) -> bool:
    return bool(_POLICY_QUERY.search(message)) and not bool(
        _POLICY_STATUS_QUERY.search(message)
    )


def _as_json(value: Any) -> str:
    return json.dumps(value, default=str)


def _make_langchain_tools(
    request: AgentRequest,
    tool_results: dict[str, Any],
) -> list[Any]:
    try:
        from langchain_core.tools import StructuredTool
    except ImportError as error:
        logger.warning("LangChain tools are unavailable: %s", error)
        return []

    built: list[Any] = []

    def register(name: str, description: str, function: Any) -> None:
        built.append(
            StructuredTool.from_function(
                func=function,
                name=name,
                description=description,
            )
        )

    def search_products(
        query: str = "",
        category: str | None = None,
        max_price: float | None = None,
        min_rating: float | None = None,
    ) -> str:
        result = business_tools.search_products(
            query=query,
            category=category,
            max_price=max_price,
            min_rating=min_rating,
        )
        tool_results["products"] = result
        return _as_json(result)

    def get_product_details(product_id: int) -> str:
        result = business_tools.get_product_details(product_id)
        tool_results["product_details"] = result
        return _as_json(result)

    def check_product_stock(product_id: int) -> str:
        result = business_tools.check_product_stock(product_id)
        tool_results["stock"] = result
        return _as_json(result)

    def search_company_policy(query: str) -> str:
        result = retrieve_policy_context(query)
        tool_results["policies"] = result
        return _as_json(result)

    def search_public_web(query: str) -> str:
        result = search_web(query)
        tool_results["public_web"] = result
        return _as_json(result)

    def search_public_wikipedia(query: str) -> str:
        result = search_wikipedia(query)
        tool_results["wikipedia"] = result
        return _as_json(result)

    register("search_products", "Search the verified NovaCart PostgreSQL catalog by text, category, maximum price, and minimum rating.", search_products)
    register("get_product_details", "Get verified details and recorded stock for one NovaCart product.", get_product_details)
    register("check_product_stock", "Check the stock quantity recorded for a NovaCart catalog product.", check_product_stock)
    register("search_company_policy", "Retrieve approved internal NovaCart policy chunks. Never use web search for company policy.", search_company_policy)
    if request.customer_id is not None:
        owner = request.customer_id

        def get_cart_details() -> str:
            result = business_tools.get_cart_details(owner, owner)
            tool_results["cart"] = result
            return _as_json(result)

        def get_order_details(order_id: int) -> str:
            result = business_tools.get_order_details(owner, owner, order_id)
            tool_results["order"] = result
            return _as_json(result)

        def get_tracking_details(order_id: int) -> str:
            result = business_tools.get_tracking_details(owner, owner, order_id)
            tool_results["tracking"] = result
            return _as_json(result)

        def get_payment_details(order_id: int) -> str:
            result = business_tools.get_payment_details(owner, owner, order_id)
            tool_results["payment"] = result
            return _as_json(result)

        def get_customer_history() -> str:
            result = business_tools.get_customer_history(owner, owner)
            tool_results["history"] = result
            return _as_json(result)

        def add_to_cart(product_id: int, quantity: int = 1) -> str:
            # A write is allowed only after the user has explicitly confirmed this exact product.
            if request.confirmed_product_id != product_id or not _CART_CONFIRM.search(request.message):
                product = business_tools.get_product_details(product_id)
                tool_results["pending_cart_item"] = product
                return _as_json({"confirmation_required": True, "product": product})
            result = business_tools.add_to_cart(owner, owner, product_id, quantity)
            tool_results["cart_update"] = result
            return _as_json(result)

        def create_support_ticket(
            complaint: str,
            category: str,
            priority: str = "medium",
        ) -> str:
            result = business_tools.create_support_ticket(
                owner,
                owner,
                complaint,
                category,
                priority,
                request.order_id,
            )
            tool_results["ticket"] = result
            return _as_json(result)

        register("get_cart_details", "Read the authenticated customer's own cart.", get_cart_details)
        register("get_order_details", "Read an order only if it belongs to the authenticated customer.", get_order_details)
        register("get_tracking_details", "Read delivery and tracking data only for the authenticated customer's own order.", get_tracking_details)
        register("get_payment_details", "Read payment/refund status only for the authenticated customer's own order.", get_payment_details)
        register("get_customer_history", "Read only the authenticated customer's own order history.", get_customer_history)
        if not tool_results.get("cart_update"):
            register("add_to_cart", "Add to the authenticated customer's cart only after explicit confirmation of the selected product.", add_to_cart)
        if (
            not tool_results.get("ticket")
            and _requested_order_action(request.message) is None
        ):
            register("create_support_ticket", "Create a support ticket for the authenticated customer.", create_support_ticket)
    if is_safe_public_query(request.message):
        register("search_public_web", "Use DuckDuckGo only for generic public technology/product questions, never NovaCart data.", search_public_web)
        register("search_wikipedia", "Use Wikipedia only for generic public technology/product questions, never NovaCart data.", search_public_wikipedia)
    return built


def _get_order_id(request: AgentRequest) -> int | None:
    if request.order_id:
        return request.order_id
    match = _ORDER_NUMBER.search(request.message)
    return int(match.group(1)) if match else None


def _requested_order_action(message: str) -> str | None:
    if _CANCEL_REQUEST.search(message):
        return "cancel_request"
    if _REFUND_REQUEST.search(message):
        return "refund_request"
    if _RETURN_REQUEST.search(message):
        return "return_request"
    return None


def _deterministic_tools(
    request: AgentRequest,
    intent: str,
    results: dict[str, Any],
    tools_used: list[str],
) -> None:
    message = request.message
    if _PRODUCT_QUERY.search(message):
        bounds = re.search(r"\b(?:under|below|within|up to|max(?:imum)?)\s*[₹$]?\s*([\d,]+)", message, re.I)
        rating = re.search(r"\b(?:at least|above|over)\s*(\d(?:\.\d)?)\s*stars?\b", message, re.I)
        categories = ("audio", "wearables", "workspace", "smart devices", "home")
        category = next((item for item in categories if item in message.lower()), None)
        query = re.sub(
            r"\b(show|find|product|products|recommend|recommendation|looking for|"
            r"available|availability|stock|in|out|of|is|the|a|an|please|under|"
            r"below|within|up to|max(?:imum)?)\b",
            " ",
            message,
            flags=re.I,
        )
        query = re.sub(r"[₹$]?\s*[\d,]+|\d(?:\.\d)?\s*stars?", " ", query)
        result = business_tools.search_products(
            query=query.strip(),
            category=category,
            max_price=float(bounds.group(1).replace(",", "")) if bounds else None,
            min_rating=float(rating.group(1)) if rating else None,
            in_stock=(
                True
                if re.search(r"\b(show|find|list)\b.*\b(products|items)\b.*\bin stock\b", message, re.I)
                else False
                if re.search(r"\b(show|find|list)\b.*\b(products|items)\b.*\b(out of stock|unavailable)\b", message, re.I)
                else None
            ),
        )
        if not result:
            result = business_tools.search_products(
                query="",
                category=category,
                max_price=float(bounds.group(1).replace(",", "")) if bounds else None,
                min_rating=float(rating.group(1)) if rating else None,
                in_stock=(
                    True
                    if re.search(r"\b(show|find|list)\b.*\b(products|items)\b.*\bin stock\b", message, re.I)
                    else False
                    if re.search(r"\b(show|find|list)\b.*\b(products|items)\b.*\b(out of stock|unavailable)\b", message, re.I)
                    else None
                ),
            )
        results["products"] = result
        tools_used.append("search_products")
        if _STOCK_QUERY.search(message) and len(result) == 1:
            stock = business_tools.check_product_stock(int(result[0]["id"]))
            results["stock"] = stock
            tools_used.append("check_product_stock")

    if (
        request.customer_id is not None
        and request.confirmed_product_id is None
        and _CART_ASK.search(message)
    ):
        product_query = re.sub(
            r"\b(add|put|to|in|my|the|cart|basket|please)\b",
            " ",
            message,
            flags=re.I,
        ).strip()
        matches = business_tools.search_products(query=product_query)
        if not matches and product_query:
            terms = product_query.split()
            matches = business_tools.search_products(query=terms[-1])
        if len(matches) == 1:
            results["pending_cart_item"] = business_tools.get_product_details(
                int(matches[0]["id"])
            )
            tools_used.append("get_product_details")
        elif len(matches) > 1:
            results["products"] = matches
            tools_used.append("search_products")

    order_action = request.confirmed_action or _requested_order_action(message)
    if request.customer_id is not None and (
        _ORDER_QUERY.search(message) or order_action
    ):
        order_id = _get_order_id(request)
        if order_id is None:
            history = business_tools.get_customer_history(
                request.customer_id, request.customer_id
            )
            tools_used.append("get_customer_history")
            if history:
                order_id = int(history[0]["id"])
                results["latest_order_selected"] = True
            else:
                results["order_lookup_failed"] = True
        if order_id is not None:
            results["order"] = business_tools.get_order_details(
                request.customer_id, request.customer_id, order_id
            )
            results["tracking"] = business_tools.get_tracking_details(
                request.customer_id, request.customer_id, order_id
            )
            results["payment"] = business_tools.get_payment_details(
                request.customer_id, request.customer_id, order_id
            )
            if results["order"] is None:
                results["order_lookup_failed"] = True
                if request.confirmed_action is not None:
                    results["confirmation_invalid"] = True
            tools_used.extend(("get_order_details", "get_tracking_details", "get_payment_details"))
            if results["order"] is not None:
                if order_action and request.confirmed_action is None:
                    results["pending_action"] = order_action
                elif request.confirmed_action is not None:
                    if (
                        request.confirmed_action != _requested_order_action(message)
                        or not _CONFIRM_ACTION.search(message)
                    ):
                        results["confirmation_invalid"] = True
                    else:
                        action_label = {
                            "return_request": "return",
                            "refund_request": "refund",
                            "cancel_request": "cancellation",
                        }[request.confirmed_action]
                        ticket_category = {
                            "return_request": "return_request",
                            "refund_request": "refund_delay",
                            "cancel_request": "cancel_order",
                        }[request.confirmed_action]
                        ticket = business_tools.create_support_ticket(
                            request.customer_id,
                            request.customer_id,
                            f"Customer confirmed a {action_label} request for order "
                            f"#{order_id}. Customer message: {message}",
                            ticket_category,
                            "medium",
                            order_id,
                        )
                        results["ticket"] = ticket
                        tools_used.append("create_support_ticket")
    elif _ORDER_QUERY.search(message) or order_action:
        results["authentication_required"] = True

    if _is_policy_question(message):
        policies = retrieve_policy_context(message)
        results["policies"] = policies
        tools_used.append("search_company_policy")

    if request.customer_id is not None and request.confirmed_product_id is not None:
        if _CART_CONFIRM.search(message):
            if request.confirmed_product_id <= 0:
                raise ValueError("Confirmed product id must be positive.")
            result = business_tools.add_to_cart(
                request.customer_id,
                request.customer_id,
                request.confirmed_product_id,
                request.quantity,
            )
            results["cart_update"] = result
            tools_used.append("add_to_cart")
        else:
            result = business_tools.get_product_details(request.confirmed_product_id)
            results["pending_cart_item"] = result
            tools_used.append("get_product_details")

    if request.customer_id is not None and _TICKET_ASK.search(message):
        ticket = business_tools.create_support_ticket(
            request.customer_id,
            request.customer_id,
            message,
            intent,
            "medium",
            _get_order_id(request),
        )
        results["ticket"] = ticket
        tools_used.append("create_support_ticket")


def _fallback_message(
    request: AgentRequest,
    results: dict[str, Any],
    escalation: dict[str, Any],
) -> str:
    if results.get("authentication_required"):
        return "Please sign in to securely view your order, delivery, and payment information."
    if results.get("order_id_required"):
        return "Please provide the order number shown in your account so I can check its status."
    if results.get("order_lookup_failed"):
        return "I could not find that order associated with your account."
    if results.get("record_conflict"):
        return "The order and payment records do not match, so I’m escalating this for human review."
    if results.get("confirmation_invalid"):
        return "I could not verify that confirmation. No request was submitted; please use the confirmation button for the order shown."
    if results.get("ticket"):
        ticket_id = results["ticket"]["id"]
        order_id = (results.get("order") or {}).get("id")
        order_text = f" for order #{order_id}" if order_id is not None else ""
        return (
            f"Your request{order_text} was submitted to support as ticket #{ticket_id}. "
            "The order has not been canceled and no refund has "
            "been issued."
        )
    if results.get("pending_action") and results.get("order"):
        order = results["order"]
        tracking = results.get("tracking") or {}
        action_label = {
            "return_request": "return",
            "refund_request": "refund",
            "cancel_request": "cancellation",
        }[results["pending_action"]]
        latest = "your latest " if results.get("latest_order_selected") else ""
        eligibility_note = (
            " I could not verify eligibility because no approved policy text was found."
            if _is_policy_question(request.message) and not results.get("policies")
            else " Support will confirm eligibility against the approved policy."
        )
        return (
            f"I found {latest}order #{order['id']} (status: {order['status']}; "
            f"shipment: {tracking.get('shipment_status') or 'not available'}). "
            f"Confirm below to submit a {action_label} request to support. "
            "Submitting a request does not itself cancel the order or issue a refund."
            f"{eligibility_note}"
        )
    if results.get("cart_update"):
        return f"{results['cart_update']['name']} was added to your cart. Continue to the secure checkout when you are ready."
    if results.get("pending_cart_item"):
        product = results["pending_cart_item"]
        if not product:
            return "I could not verify that product. Please choose a product from the catalog first."
        return f"Please confirm that you want to add {product['name']} for ₹{product['price']} to your cart."
    if results.get("order"):
        order = results["order"]
        if not order:
            return "I could not find that order on your account."
        tracking = results.get("tracking") or {}
        payment = results.get("payment") or {}
        latest = "Your latest " if results.get("latest_order_selected") else ""
        return (
            f"{latest}order #{order['id']} is {order['status']}. "
            f"Shipment: {tracking.get('shipment_status') or 'not available'}. "
            f"Tracking ID: {tracking.get('tracking_id') or 'not available'}. "
            f"Expected delivery: {tracking.get('expected_delivery') or 'not available'}. "
            f"Payment: {payment.get('status') or 'not available'}. "
            f"Refund: {payment.get('refund_status') or 'not available'}."
        )
    if results.get("policies"):
        policy = results["policies"][0]
        return f"According to our {policy['title']}, {policy['chunk_text']}"
    if _is_policy_question(request.message):
        return "I could not retrieve an approved policy document for this question, so I’m escalating it for review."
    if results.get("products"):
        if results.get("stock"):
            stock = results["stock"]
            if stock["verified"]:
                return f"{stock['name']} has {stock['quantity']} units recorded as available." if stock["available"] else f"{stock['name']} is recorded as out of stock."
            return f"I found {stock['name']} in the catalog, but its stock quantity has not been recorded, so I cannot verify availability."
        names = ", ".join(
            f"{item['name']} (₹{item['price']}, rating {item['rating']})"
            for item in results["products"][:4]
        )
        return f"Here are verified catalog matches: {names}."
    if escalation["shouldEscalate"]:
        return "I’m routing this issue to our support team for human review."
    return "I can help with product discovery, orders, returns, refunds, payments, or support tickets."


def _unresolved_count(customer_id: int | None) -> int:
    if customer_id is None:
        return 0
    return get_unresolved_ticket_count(customer_id)


def run_agent(request: AgentRequest) -> AgentResponse:
    predictions = predict(request.message)
    results: dict[str, Any] = {}
    tools_used: list[str] = []
    _deterministic_tools(request, predictions["intent"], results, tools_used)

    confidence = float(predictions["intentConfidence"])
    policy_found = not _is_policy_question(request.message) or bool(results.get("policies"))
    order = results.get("order")
    payment = results.get("payment")
    record_conflict = bool(
        order
        and payment
        and payment.get("amount") is not None
        and float(order["total"]) != float(payment["amount"])
    )
    if record_conflict:
        results["record_conflict"] = True
    settings = get_settings()
    refund_amount_match = (
        re.search(
            r"\brefund\b[^\d₹$]*[₹$]?\s*([\d,]+(?:\.\d{1,2})?)",
            request.message,
            re.I,
        )
        if predictions["intent"] == "refund_delay"
        else None
    )
    unresolved = _unresolved_count(request.customer_id)
    escalation = get_escalation_decision(
        request.message,
        predictions["intent"],
        confidence,
        policy_found=policy_found,
        record_conflict=record_conflict,
        unresolved_tickets=unresolved,
        refund_amount=(
            float(refund_amount_match.group(1).replace(",", ""))
            if refund_amount_match
            else None
        ),
        refund_limit=settings.refund_auto_limit,
        negative=predictions["sentiment"] == "negative",
        repeatedly_unresolved=bool(
            re.search(r"\b(still unresolved|again|already contacted)\b", request.message, re.I)
        ),
    )

    pending_action = results.get("pending_action")
    unconfirmed_action = (
        request.confirmed_action is None
        and _requested_order_action(request.message) is not None
    )
    if (
        unconfirmed_action
        and escalation["escalationReason"]
        in {
            "no relevant approved policy found",
            "classifier confidence below 0.70",
        }
    ):
        results["deferred_escalation"] = escalation["escalationReason"]
        escalation = {
            "shouldEscalate": False,
            "escalationReason": None,
            "assignedTeam": None,
        }

    ticket = results.get("ticket")
    if escalation["shouldEscalate"] and request.customer_id is not None and ticket is None:
        ticket = business_tools.create_support_ticket(
            request.customer_id,
            request.customer_id,
            request.message,
            predictions["intent"],
            predictions["priority"],
            _get_order_id(request),
        )
        results["ticket"] = ticket
        tools_used.append("create_support_ticket")
    if escalation["shouldEscalate"] and ticket is not None:
        business_tools.escalate_ticket(
            ticket["id"],
            escalation["escalationReason"] or "Escalation required",
            escalation["assignedTeam"] or "Customer Support Team",
            predictions["priority"],
            request.customer_id,
            request.customer_id,
        )
        tools_used.append("escalate_ticket")

    llm = create_llm(settings)
    context = {
        "verified_results": results,
        "internal_policy_chunks": results.get("policies", []),
    }
    account_order_response = any(
        results.get(key)
        for key in (
            "order",
            "pending_action",
            "ticket",
            "order_lookup_failed",
            "authentication_required",
        )
    )
    if account_order_response:
        llm_message, agent_tool_names = None, []
    else:
        langchain_tools = _make_langchain_tools(request, results)
        llm_message, agent_tool_names = invoke_tool_agent(
            llm,
            f"Use the available secure tools when needed. Verified facts: {_as_json(context)}\n"
            f"Customer: {request.message}",
            langchain_tools,
        )
    tools_used.extend(name for name in agent_tool_names if name not in tools_used)
    must_use_grounded_fallback = (
        (_is_policy_question(request.message) and not results.get("policies"))
        or bool(pending_action)
        or bool(results.get("ticket"))
        or bool(results.get("order"))
        or results.get("authentication_required")
        or results.get("order_id_required")
        or results.get("order_lookup_failed")
        or record_conflict
        or (bool(_PRODUCT_QUERY.search(request.message)) and not results.get("products"))
        or bool(results.get("pending_cart_item"))
        or bool(results.get("cart_update"))
    )
    message = (
        _fallback_message(request, results, escalation)
        if must_use_grounded_fallback
        else llm_message or _fallback_message(request, results, escalation)
    )

    order_row = results.get("tracking") or results.get("order")
    payment_row = results.get("payment") or {}
    if order_row and order_row.get("id") is not None:
        order_details = {
            "id": int(order_row["id"]),
            "status": str(order_row.get("status") or "unknown"),
            "total": float(results.get("order", {}).get("total") or 0),
            "payment_status": payment_row.get("status"),
            "refund_status": payment_row.get("refund_status"),
            "shipment_status": order_row.get("shipment_status"),
            "tracking_id": order_row.get("tracking_id"),
            "expected_delivery": str(order_row["expected_delivery"])
            if order_row.get("expected_delivery")
            else None,
        }
    else:
        order_details = None

    product_rows = results.get("products") or (
        [results["pending_cart_item"]] if results.get("pending_cart_item") else []
    )
    product_rows = [
        {
            "id": int(product["id"]),
            "name": str(product["name"]),
            "category": str(product.get("category") or ""),
            "price": float(product["price"]),
            "rating": float(product.get("rating") or 0),
            "image": str(product.get("image") or ""),
            "description": str(product.get("description") or ""),
            "stock_quantity": product.get("stock_quantity"),
            "reason": "",
        }
        for product in product_rows
    ]
    policy_reference = (
        results["policies"][0]["title"] if results.get("policies") else None
    )
    action_type = "answer"
    if results.get("products"):
        action_type = "product_search"
    if results.get("order") or results.get("tracking"):
        action_type = "order_tracking"
    if results.get("pending_cart_item") or results.get("cart_update"):
        action_type = "cart_update"
    if results.get("ticket"):
        action_type = "ticket_create"
    if escalation["shouldEscalate"]:
        action_type = "escalate"
    response = AgentResponse(
        intent=predictions["intent"],
        intentConfidence=confidence,
        priority=predictions["priority"],
        sentiment=predictions["sentiment"],
        toolsUsed=tools_used,
        policyReference=policy_reference,
        rootCause="order_payment_record_conflict" if record_conflict else None,
        recommendedAction=(
            "Review with the assigned support team."
            if escalation["shouldEscalate"]
            else "Continue to the normal secure checkout if making a purchase."
            if action_type == "cart_update"
            else ""
        ),
        actionType=action_type,
        products=product_rows,
        orderDetails=order_details,
        pendingAction=results.get("pending_action"),
        shouldEscalate=escalation["shouldEscalate"],
        escalationReason=escalation["escalationReason"],
        assignedTeam=escalation["assignedTeam"],
        ticketId=results.get("ticket", {}).get("id"),
        message=message,
    )
    log_decision(
        "agent_decision",
        {
            "intent": predictions["intent"],
            "intent_confidence": confidence,
            "priority": predictions["priority"],
            "sentiment": predictions["sentiment"],
            "tools_used": tools_used,
            "should_escalate": escalation["shouldEscalate"],
            "escalation_reason": escalation["escalationReason"],
        },
        customer_id=request.customer_id,
    )
    return response
