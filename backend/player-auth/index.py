import json
import os
import hashlib
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

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    """Регистрация и вход игрока с паролем."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    nickname = (body.get('nickname') or '').strip()
    password = (body.get('password') or '').strip()
    action = body.get('action', 'login')  # 'register' или 'login'

    if not nickname:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Никнейм обязателен'})}

    if not password:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль обязателен'})}

    if len(password) < 4:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль должен быть минимум 4 символа'})}

    if nickname not in ALLOWED_USERS:
        return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Такой аккаунт не найден в системе ЖГ'})}

    start_coins = 200 if nickname == COINS_300 else 100
    pw_hash = hash_password(password)
    escaped = nickname.replace("'", "''")

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SELECT nickname, coins, xp, level, friends, password_hash FROM players WHERE nickname = '{escaped}'")
    row = cur.fetchone()

    if action == 'register':
        if row:
            cur.close(); conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Аккаунт уже зарегистрирован. Войди с паролем'})}
        cur.execute(f"""
            INSERT INTO players (nickname, coins, xp, level, friends, password_hash)
            VALUES ('{escaped}', {start_coins}, 0, 1, ARRAY[]::TEXT[], '{pw_hash}')
        """)
        conn.commit()
        cur.execute(f"SELECT nickname, coins, xp, level, friends FROM players WHERE nickname = '{escaped}'")
        row2 = cur.fetchone()
        cur.close(); conn.close()
        player = {'nickname': row2[0], 'coins': row2[1], 'xp': row2[2], 'level': row2[3], 'friends': list(row2[4]) if row2[4] else []}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(player)}

    else:  # login
        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Аккаунт не зарегистрирован. Сначала зарегистрируйся'})}
        stored_hash = row[5]
        if stored_hash == '':
            # Старый аккаунт без пароля — устанавливаем пароль
            cur.execute(f"UPDATE players SET password_hash = '{pw_hash}' WHERE nickname = '{escaped}'")
            conn.commit()
        elif stored_hash != pw_hash:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный пароль'})}
        cur.close(); conn.close()
        player = {'nickname': row[0], 'coins': row[1], 'xp': row[2], 'level': row[3], 'friends': list(row[4]) if row[4] else []}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(player)}
