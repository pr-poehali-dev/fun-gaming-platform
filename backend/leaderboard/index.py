import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def handler(event: dict, context) -> dict:
    """Получение таблицы лидеров по монетам и уровню."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute("""
        SELECT nickname, coins, level, xp
        FROM players
        ORDER BY coins DESC, level DESC, xp DESC
        LIMIT 50
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    leaders = [
        {'nickname': r[0], 'coins': r[1], 'level': r[2], 'xp': r[3]}
        for r in rows
    ]
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(leaders)}
