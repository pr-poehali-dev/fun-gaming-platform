import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import GameArena from '@/components/GameArena';

const AUTH_URL = 'https://functions.poehali.dev/7f4b5993-a669-431f-b9dc-99652d01ebc7';
const UPDATE_URL = 'https://functions.poehali.dev/a17b9c02-ead2-4f99-b2dd-04dd75b5c452';

const ALL_PLAYERS = [
  'egorik1000-7', 'Великий доллар', 'Крутой доллар', 'Друн',
  'Левое волосатое яйцо Арсения', 'Маканский доллар',
  'Конгвест манго Троллфейс Миха дылда', 'Вон та залупа Егора', 'Ч',
  'Пузатый доллар',
];

const XP_PER_LEVEL = 1000;

const GAMES = [
  { id: 'tag', name: 'Догонялки', icon: 'Footprints', color: 'from-pink-500 to-rose-500' },
  { id: 'hide', name: 'Прятки', icon: 'Eye', color: 'from-cyan-400 to-teal-500' },
  { id: 'race', name: 'Гонки', icon: 'Car', color: 'from-amber-400 to-orange-500' },
  { id: 'quiz', name: 'Викторина', icon: 'Brain', color: 'from-violet-500 to-fuchsia-500' },
];

interface Player {
  nickname: string;
  level: number;
  coins: number;
  xp: number;
  friends: string[];
}

export default function Index() {
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [view, setView] = useState<'profile' | 'games' | 'friends'>('profile');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const handleAuth = async () => {
    const name = nickname.trim();
    if (!name) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка входа');
      } else {
        setPlayer(data);
      }
    } catch {
      setError('Ошибка соединения. Попробуй ещё раз');
    } finally {
      setLoading(false);
    }
  };

  const callUpdate = async (action: string, extra?: Record<string, string>) => {
    if (!player) return null;
    try {
      const res = await fetch(UPDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: player.nickname, action, ...extra }),
      });
      if (!res.ok) return null;
      return await res.json() as Player;
    } catch {
      return null;
    }
  };

  const finishGame = async (win: boolean) => {
    if (!win) return;
    const updated = await callUpdate('win');
    if (updated) {
      setPlayer(updated);
      setReward('Победа! +10 ЖГ монет и +50 опыта');
      setTimeout(() => setReward(null), 2600);
    }
  };

  const toggleFriend = async (name: string) => {
    if (!player) return;
    const isFriend = player.friends.includes(name);
    const updated = await callUpdate(isFriend ? 'friend_remove' : 'friend_add', { friend: name });
    if (updated) setPlayer(updated);
    else {
      // Оптимистичное обновление если бэкенд недоступен
      setPlayer((p) => p ? {
        ...p,
        friends: isFriend ? p.friends.filter((f) => f !== name) : [...p.friends, name]
      } : p);
    }
  };

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 neon-border animate-pop-in bg-card/80 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mb-4 animate-coin">
              <span className="font-display text-4xl font-bold text-white">ЖГ</span>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-wide text-glow">ЖГ ПЛАТФОРМА</h1>
            <p className="text-muted-foreground mt-2">Играй. Прокачивайся. Доминируй.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-muted rounded-2xl">
            {(['register', 'login'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`py-2.5 rounded-xl font-semibold transition-all ${tab === t ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
              >
                {t === 'register' ? 'Регистрация' : 'Вход'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Никнейм</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="Введите ваш ник"
                className="h-12 bg-muted border-border text-base"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2 animate-float-up">
                <Icon name="TriangleAlert" size={16} /> {error}
              </p>
            )}
            <Button onClick={handleAuth} disabled={loading} className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90">
              {loading
                ? <><Icon name="Loader" size={18} className="mr-2 animate-spin" /> Загрузка...</>
                : <>{tab === 'register' ? 'Создать аккаунт' : 'Войти'} <Icon name="ArrowRight" size={18} className="ml-1" /></>
              }
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const xpPercent = (player.xp / XP_PER_LEVEL) * 100;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      {activeGame && (
        <GameArena
          game={activeGame}
          onFinish={finishGame}
          onClose={() => setActiveGame(null)}
        />
      )}
      {reward && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-pop-in">
          <div className="bg-card neon-border rounded-2xl px-6 py-3 font-semibold flex items-center gap-2">
            <Icon name="Sparkles" size={18} className="text-secondary" /> {reward}
          </div>
        </div>
      )}

      <header className="flex items-center justify-between mb-8 animate-float-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-white">ЖГ</div>
          <span className="font-display text-2xl font-bold tracking-wide">ПЛАТФОРМА</span>
        </div>
        <Button variant="ghost" onClick={() => setPlayer(null)} className="text-muted-foreground">
          <Icon name="LogOut" size={18} className="mr-1" /> Выйти
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-8 p-1.5 bg-card/60 backdrop-blur rounded-2xl">
        {([['profile', 'Профиль', 'User'], ['games', 'Игры', 'Gamepad2'], ['friends', 'Друзья', 'Users']] as const).map(([v, label, icon]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${view === v ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name={icon} size={18} /> <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {view === 'profile' && (
        <div className="space-y-6 animate-float-up">
          <Card className="p-8 neon-border bg-card/80 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-5xl font-display font-bold text-white shrink-0">
                {player.nickname[0].toUpperCase()}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-display text-3xl font-bold text-glow">{player.nickname}</h2>
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
                  <Icon name="Star" size={14} /> Игрок ЖГ
                </span>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Опыт</span>
                    <span className="font-semibold">{player.xp} / {XP_PER_LEVEL}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${xpPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Уровень', value: player.level, icon: 'Trophy', color: 'text-secondary' },
              { label: 'ЖГ Монеты', value: player.coins, icon: 'Coins', color: 'text-accent' },
              { label: 'Друзья', value: player.friends.length, icon: 'Heart', color: 'text-primary' },
            ].map((s) => (
              <Card key={s.label} className="p-5 text-center bg-card/80 backdrop-blur hover-scale">
                <Icon name={s.icon} size={28} className={`mx-auto mb-2 ${s.color}`} />
                <div className="font-display text-3xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view === 'games' && (
        <div className="grid sm:grid-cols-2 gap-4 animate-float-up">
          {GAMES.map((g) => (
            <Card key={g.id} className="p-6 bg-card/80 backdrop-blur hover-scale">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${g.color} flex items-center justify-center mb-4`}>
                <Icon name={g.icon} size={28} className="text-white" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-1">{g.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">Победа: +10 ЖГ и +50 опыта</p>
              <Button onClick={() => setActiveGame(g.name)} className="w-full font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Icon name="Play" size={16} className="mr-1" /> Играть
              </Button>
            </Card>
          ))}
        </div>
      )}

      {view === 'friends' && (
        <div className="space-y-3 animate-float-up">
          {ALL_PLAYERS.filter((n) => n !== player.nickname).map((name) => {
            const isFriend = player.friends.includes(name);
            return (
              <Card key={name} className="p-4 bg-card/80 backdrop-blur flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-white shrink-0">
                  {name[0].toUpperCase()}
                </div>
                <span className="flex-1 font-semibold truncate">{name}</span>
                <Button
                  onClick={() => toggleFriend(name)}
                  variant={isFriend ? 'secondary' : 'default'}
                  className={isFriend ? '' : 'bg-gradient-to-r from-primary to-accent hover:opacity-90'}
                >
                  <Icon name={isFriend ? 'Check' : 'UserPlus'} size={16} className="mr-1" />
                  {isFriend ? 'В друзьях' : 'Добавить'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
