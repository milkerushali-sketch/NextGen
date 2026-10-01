from collections.abc import Iterator
from contextlib import contextmanager

from psycopg import Connection, connect
from psycopg.rows import dict_row

from .config import get_settings


@contextmanager
def get_connection() -> Iterator[Connection]:
    connection = connect(
        get_settings().database_url.get_secret_value(),
        row_factory=dict_row,
        connect_timeout=5,
    )
    try:
        yield connection
    finally:
        connection.close()

