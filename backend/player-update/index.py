import json
import os
import psycopg2

XP_PER_LEVEL = 1000
COINS_PER_LEVEL = 25

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def handler(event: dict, context) -> dict:
    """Обновление монет, опыта и уровня игрока после победы в игре."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    nickname = (body.get('nickname') or '').strip()
    action = body.get('action', '')

    if not nickname:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Никнейм обязателен'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    escaped = nickname.replace("'", "''")

    cur.execute(f"SELECT coins, xp, level FROM players WHERE nickname = '{escaped}'")
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Игрок не найден'})}

    coins, xp, level = row

    if action == 'win':
        coins += 10
        xp += 50
        while xp >= XP_PER_LEVEL:
            xp -= XP_PER_LEVEL
            level += 1
            coins += COINS_PER_LEVEL

    elif action == 'friend_add':
        friend = (body.get('friend') or '').strip().replace("'", "''")
        if friend:
            cur.execute(f"UPDATE players SET friends = array_append(friends, '{friend}') WHERE nickname = '{escaped}' AND NOT ('{friend}' = ANY(friends))")
            conn.commit()
            cur.execute(f"SELECT nickname, coins, xp, level, friends FROM players WHERE nickname = '{escaped}'")
        r = cur.fetchone()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'nickname': r[0], 'coins': r[1], 'xp': r[2], 'level': r[3], 'friends': list(r[4]) if r[4] else []})}

    elif action == 'friend_remove':
        friend = (body.get('friend') or '').strip().replace("'", "''")
        if friend:
            cur.execute(f"UPDATE players SET friends = array_remove(friends, '{friend}') WHERE nickname = '{escaped}'")
            conn.commit()
            cur.execute(f"SELECT nickname, coins, xp, level, friends FROM players WHERE nickname = '{escaped}'")
        r = cur.fetchone()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'nickname': r[0], 'coins': r[1], 'xp': r[2], 'level': r[3], 'friends': list(r[4]) if r[4] else []})}

    cur.execute(f"UPDATE players SET coins = {coins}, xp = {xp}, level = {level} WHERE nickname = '{escaped}'")
    conn.commit()
    cur.execute(f"SELECT nickname, coins, xp, level, friends FROM players WHERE nickname = '{escaped}'")
    row2 = cur.fetchone()
    cur.close()
    conn.close()

    player = {
        'nickname': row2[0],
        'coins': row2[1],
        'xp': row2[2],
        'level': row2[3],
        'friends': list(row2[4]) if row2[4] else [],
    }
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(player)}
