def retrieve_policy_context(message: str) -> str:
    """Return the policy context used by the agent.

    This keeps policy text centralized until the pgvector policy table is provisioned.
    """
    return (
        "Returns require an order number and unused items where possible. "
        "Refund timing depends on the payment provider. Never request credentials."
    )

