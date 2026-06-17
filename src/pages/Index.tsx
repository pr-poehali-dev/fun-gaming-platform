import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const COINS_300 = 'Пузатый доллар';
const ALLOWED_USERS = [
  'egorik1000-7', 'Великий доллар', 'Крутой доллар', 'Друн',
  'Левое волосатое яйцо Арсения', 'Маканский доллар',
  'Конгвест манго Троллфейс Миха дылда', 'Вон та залупа Егора', 'Ч',
  COINS_300,
];

const XP_PER_LEVEL = 1000;

interface Player {
  nickname: string;
  level: number;
  coins: number;
  xp: number;
  friends: string[];
}

const GAMES = [
  { id: 'tag', name: 'Догонялки', icon: 'Footprints', color: 'from-pink-500 to-rose-500' },
  { id: 'hide', name: 'Прятки', icon: 'Eye', color: 'from-cyan-400 to-teal-500' },
  { id: 'race', name: 'Гонки', icon: 'Car', color: 'from-amber-400 to-orange-500' },
  { id: 'quiz', name: 'Викторина', icon: 'Brain', color: 'from-violet-500 to-fuchsia-500' },
];

const ALL_PLAYERS = [...ALLOWED_USERS];

export default function Index() {
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [player, setPlayer] = useState<Player | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [view, setView] = useState<'profile' | 'games' | 'friends'>('profile');

  const handleAuth = () => {
    const name = nickname.trim();
    if (!ALLOWED_USERS.includes(name)) {
      setError('Такой аккаунт не найден в системе ЖГ');
      return;
    }
    setError('');
    setPlayer({
      nickname: name,
      level: 1,
      coins: name === COINS_300 ? 200 : 100,
      xp: 0,
      friends: [],
    });
  };

  const playGame = (gameName: string) => {
    const win = Math.random() > 0.5;
    setPlayer((p) => {
      if (!p) return p;
      if (!win) return p;
      let xp = p.xp + 50;
      let level = p.level;
      let coins = p.coins + 10;
      while (xp >= XP_PER_LEVEL) {
        xp -= XP_PER_LEVEL;
        level += 1;
        coins += 25;
      }
      return { ...p, xp, level, coins };
    });
    setReward(win ? `Победа в «${gameName}»! +10 ЖГ +50 опыта` : `Поражение в «${gameName}». В этот раз без награды`);
    setTimeout(() => setReward(null), 2600);
  };

  const toggleFriend = (name: string) => {
    setPlayer((p) => {
      if (!p) return p;
      const has = p.friends.includes(name);
      return { ...p, friends: has ? p.friends.filter((f) => f !== name) : [...p.friends, name] };
    });
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
              />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2 animate-float-up">
                <Icon name="TriangleAlert" size={16} /> {error}
              </p>
            )}
            <Button onClick={handleAuth} className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90">
              {tab === 'register' ? 'Создать аккаунт' : 'Войти'}
              <Icon name="ArrowRight" size={18} className="ml-1" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const xpPercent = (player.xp / XP_PER_LEVEL) * 100;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
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
              <Button onClick={() => playGame(g.name)} className="w-full font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90">
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
