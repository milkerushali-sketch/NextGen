from collections.abc import Iterator
from contextlib import contextmanager

from psycopg import Connection, connect

from .config import get_settings


@contextmanager
def get_connection() -> Iterator[Connection]:
    connection = connect(get_settings().database_url)
    try:
        yield connection
    finally:
        connection.close()
