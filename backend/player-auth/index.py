import json
import os
import psycopg2

COINS_300 = 'Пузатый доллар'
ALLOWED_USERS = [
    'egorik1000-7', 'Великий доллар', 'Крутой доллар', 'Друн',
    'Левое волосатое яйцо Арсения', 'Маканский доллар',
    'Конгвест манго Троллфейс Миха дылда', 'Вон та залупа Егора', 'Ч',
    COINS_300,
]

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def handler(event: dict, context) -> dict:
    """Авторизация игрока и получение/создание профиля."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    nickname = (body.get('nickname') or '').strip()

    if not nickname:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Никнейм обязателен'})}

    if nickname not in ALLOWED_USERS:
        return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Такой аккаунт не найден в системе ЖГ'})}

    start_coins = 200 if nickname == COINS_300 else 100

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    escaped = nickname.replace("'", "''")
    cur.execute(f"""
        INSERT INTO players (nickname, coins, xp, level, friends)
        VALUES ('{escaped}', {start_coins}, 0, 1, ARRAY[]::TEXT[])
        ON CONFLICT (nickname) DO NOTHING
    """)
    conn.commit()

    cur.execute(f"SELECT nickname, coins, xp, level, friends FROM players WHERE nickname = '{escaped}'")
    row = cur.fetchone()
    cur.close()
    conn.close()

    player = {
        'nickname': row[0],
        'coins': row[1],
        'xp': row[2],
        'level': row[3],
        'friends': list(row[4]) if row[4] else [],
    }
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(player)}
