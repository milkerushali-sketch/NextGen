import json
import logging
from typing import Any

logger = logging.getLogger("novacart.ai")


def log_decision(event: str, payload: dict[str, Any]) -> None:
    logger.info("%s %s", event, json.dumps(payload, default=str))

