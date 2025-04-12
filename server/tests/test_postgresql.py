from app.data.sql_client import SQLClient
import pytest

@pytest.fixture(scope='module')
def sql_client() -> SQLClient:
    return SQLClient()


def test_searc(sql_client: SQLClient):
    text1 = 'addres'
    
    sql_client.search_word(text1)