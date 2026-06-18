import json
import os
import random
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

# Награды и их веса (чем больше награда — тем меньше шанс)
# Шансы подняты — средние призы встречаются чаще
REWARDS = [
    (10,   2000),
    (20,   1800),
    (30,   1500),
    (40,   1200),
    (50,   1000),
    (60,    850),
    (70,    700),
    (80,    580),
    (90,    460),
    (100,   380),
    (200,   220),
    (300,   140),
    (400,    90),
    (500,    65),
    (600,    45),
    (700,    32),
    (800,    22),
    (900,    14),
    (1000,   10),
    (2000,    5),
    (3000,    3),
    (4000,    2),
    (5000,    2),
]

CASE_COST = 100

def roll_reward() -> int:
    prizes = [r[0] for r in REWARDS]
    weights = [r[1] for r in REWARDS]
    return random.choices(prizes, weights=weights, k=1)[0]

def handler(event: dict, context) -> dict:
    """Открытие кейса: списывает 100 ЖГ монет и начисляет случайную награду."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    nickname = (body.get('nickname') or '').strip()

    if not nickname:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Никнейм обязателен'})}

    escaped = nickname.replace("'", "''")
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(f"SELECT coins FROM players WHERE nickname = '{escaped}'")
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Игрок не найден'})}

    coins = row[0]
    if coins < CASE_COST:
        cur.close(); conn.close()
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': f'Недостаточно монет. Нужно {CASE_COST} ЖГ'})}

    prize = roll_reward()
    new_coins = coins - CASE_COST + prize

    cur.execute(f"UPDATE players SET coins = {new_coins} WHERE nickname = '{escaped}'")
    conn.commit()
    cur.execute(f"SELECT nickname, coins, xp, level, friends FROM players WHERE nickname = '{escaped}'")
    r = cur.fetchone()
    cur.close(); conn.close()

    player = {'nickname': r[0], 'coins': r[1], 'xp': r[2], 'level': r[3], 'friends': list(r[4]) if r[4] else []}
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'prize': prize, 'player': player})}