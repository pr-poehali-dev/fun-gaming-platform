import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import GameArena from '@/components/GameArena';

const AUTH_URL = 'https://functions.poehali.dev/7f4b5993-a669-431f-b9dc-99652d01ebc7';
const UPDATE_URL = 'https://functions.poehali.dev/a17b9c02-ead2-4f99-b2dd-04dd75b5c452';
const LEADERBOARD_URL = 'https://functions.poehali.dev/23528d07-5bb3-4b03-bf11-e8103c712d8d';
const CASE_URL = 'https://functions.poehali.dev/9901fa99-2638-403c-a77f-ab3211c97097';

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

interface Leader {
  nickname: string;
  coins: number;
  level: number;
  xp: number;
}

type View = 'profile' | 'games' | 'friends' | 'rating' | 'cases';

const MEDAL = ['🥇', '🥈', '🥉'];

// Все возможные призы с весами (те же что на бэке, для отображения)
const CASE_PRIZES = [
  { amount: 10,   weight: 3000, tier: 0 },
  { amount: 20,   weight: 2500, tier: 0 },
  { amount: 30,   weight: 2000, tier: 0 },
  { amount: 40,   weight: 1500, tier: 0 },
  { amount: 50,   weight: 1200, tier: 1 },
  { amount: 60,   weight: 1000, tier: 1 },
  { amount: 70,   weight:  800, tier: 1 },
  { amount: 80,   weight:  600, tier: 1 },
  { amount: 90,   weight:  500, tier: 1 },
  { amount: 100,  weight:  400, tier: 1 },
  { amount: 200,  weight:  200, tier: 2 },
  { amount: 300,  weight:  100, tier: 2 },
  { amount: 400,  weight:   60, tier: 2 },
  { amount: 500,  weight:   40, tier: 2 },
  { amount: 600,  weight:   25, tier: 3 },
  { amount: 700,  weight:   18, tier: 3 },
  { amount: 800,  weight:   12, tier: 3 },
  { amount: 900,  weight:    8, tier: 3 },
  { amount: 1000, weight:    6, tier: 3 },
  { amount: 2000, weight:    3, tier: 4 },
  { amount: 3000, weight:    2, tier: 4 },
  { amount: 4000, weight:    1, tier: 4 },
  { amount: 5000, weight:    1, tier: 4 },
];

const TIER_COLORS = [
  'from-slate-400 to-slate-500',     // 0 — обычный
  'from-blue-400 to-cyan-500',       // 1 — редкий
  'from-violet-500 to-fuchsia-500',  // 2 — эпический
  'from-amber-400 to-orange-500',    // 3 — легендарный
  'from-rose-500 to-pink-400',       // 4 — мифический
];

const TIER_LABELS = ['Обычный', 'Редкий', 'Эпический', 'Легендарный', 'Мифический'];

const NAV: [View, string, string][] = [
  ['profile', 'Профиль', 'User'],
  ['games', 'Игры', 'Gamepad2'],
  ['cases', 'Кейсы', 'Package'],
  ['friends', 'Друзья', 'Users'],
  ['rating', 'Рейтинг', 'Trophy'],
];

export default function Index() {
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [view, setView] = useState<View>('profile');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [caseOpening, setCaseOpening] = useState(false);
  const [caseResult, setCaseResult] = useState<{prize: number; spinning: boolean} | null>(null);
  const [spinItems, setSpinItems] = useState<typeof CASE_PRIZES>([]);

  const fetchLeaders = async () => {
    setLoadingLeaders(true);
    try {
      const res = await fetch(LEADERBOARD_URL);
      const data = await res.json();
      setLeaders(data);
    } catch { /* тихо */ } finally {
      setLoadingLeaders(false);
    }
  };

  useEffect(() => {
    if (view === 'rating') fetchLeaders();
  }, [view]);

  const openCase = async () => {
    if (!player || caseOpening) return;
    setCaseOpening(true);
    setCaseResult(null);

    try {
      // Сначала получаем реальный приз с сервера
      const res = await fetch(CASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: player.nickname }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReward(data.error || 'Ошибка открытия кейса');
        setTimeout(() => setReward(null), 3000);
        setCaseOpening(false);
        return;
      }

      const prize: number = data.prize;
      const prizeItem = CASE_PRIZES.find(p => p.amount === prize) ?? CASE_PRIZES[0];

      // Строим ленту: 38 случайных + реальный приз на позиции 35 (будет по центру)
      const STOP_INDEX = 35;
      const strip = Array.from({ length: 40 }, (_, i) => {
        if (i === STOP_INDEX) return prizeItem;
        return CASE_PRIZES[Math.floor(Math.random() * CASE_PRIZES.length)];
      });
      setSpinItems(strip);

      // Запускаем анимацию
      setCaseResult({ prize: 0, spinning: true });

      // Показываем результат после завершения анимации
      setTimeout(() => {
        setCaseResult({ prize, spinning: false });
        setPlayer(data.player);
        setCaseOpening(false);
      }, 3200);
    } catch {
      setCaseResult(null);
      setCaseOpening(false);
    }
  };

  const handleAuth = async () => {
    const name = nickname.trim();
    const pass = password.trim();
    if (!name || !pass) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: name, password: pass, action: tab }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Ошибка');
      else setPlayer(data);
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
    } catch { return null; }
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
    else setPlayer((p) => p ? {
      ...p,
      friends: isFriend ? p.friends.filter((f) => f !== name) : [...p.friends, name],
    } : p);
  };

  /* ── Экран авторизации ── */
  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm p-6 sm:p-8 neon-border animate-pop-in bg-card/80 backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mb-3 animate-coin">
              <span className="font-display text-3xl sm:text-4xl font-bold text-white">ЖГ</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-glow">ЖГ ПЛАТФОРМА</h1>
            <p className="text-muted-foreground mt-1 text-sm">Играй. Прокачивайся. Доминируй.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-muted rounded-2xl">
            {(['register', 'login'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setPassword(''); }}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
              >
                {t === 'register' ? 'Регистрация' : 'Вход'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Никнейм</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Введите ваш ник"
                className="h-11 bg-muted border-border text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Пароль</label>
              <div className="relative">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={tab === 'register' ? 'Придумайте пароль (мин. 4 символа)' : 'Введите пароль'}
                  className="h-11 bg-muted border-border text-sm pr-11"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
                </button>
              </div>
            </div>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5 animate-float-up">
                <Icon name="TriangleAlert" size={14} /> {error}
              </p>
            )}
            <Button onClick={handleAuth} disabled={loading || !nickname.trim() || !password.trim()} className="w-full h-11 font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50">
              {loading
                ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" /> Загрузка...</>
                : <>{tab === 'register' ? 'Создать аккаунт' : 'Войти'} <Icon name="ArrowRight" size={16} className="ml-1" /></>}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const xpPercent = (player.xp / XP_PER_LEVEL) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {activeGame && (
        <GameArena game={activeGame} onFinish={finishGame} onClose={() => setActiveGame(null)} />
      )}

      {reward && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-pop-in w-max max-w-[90vw]">
          <div className="bg-card neon-border rounded-2xl px-4 py-2.5 font-semibold flex items-center gap-2 text-sm">
            <Icon name="Sparkles" size={16} className="text-secondary shrink-0" /> {reward}
          </div>
        </div>
      )}

      {/* Шапка */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-white text-sm">ЖГ</div>
          <span className="font-display text-base font-bold tracking-wide hidden sm:block">ПЛАТФОРМА</span>
        </div>

        {/* Десктопная навигация */}
        <nav className="hidden sm:flex items-center gap-1 p-1 bg-card/60 rounded-2xl flex-1 justify-center max-w-md">
          {NAV.map(([v, label, icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all flex-1 justify-center ${view === v ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon name={icon} size={15} /> {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-card rounded-xl border border-border">
            <Icon name="Coins" size={13} className="text-accent" />
            <span className="font-bold text-sm">{player.coins}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setPlayer(null)} className="text-muted-foreground w-8 h-8">
            <Icon name="LogOut" size={15} />
          </Button>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full pb-24 sm:pb-8">

        {/* ─── Профиль ─── */}
        {view === 'profile' && (
          <div className="space-y-4 animate-float-up">
            <Card className="p-4 sm:p-6 neon-border bg-card/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center font-display font-bold text-white text-2xl sm:text-3xl shrink-0">
                  {player.nickname[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-lg sm:text-2xl font-bold text-glow truncate">{player.nickname}</h2>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                    <Icon name="Star" size={11} /> Игрок ЖГ
                  </span>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Опыт до ур. {player.level + 1}</span>
                      <span className="font-semibold">{player.xp} / {XP_PER_LEVEL}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${xpPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Уровень', value: player.level, icon: 'Trophy', color: 'text-secondary' },
                { label: 'ЖГ Монеты', value: player.coins, icon: 'Coins', color: 'text-accent' },
                { label: 'Друзья', value: player.friends.length, icon: 'Heart', color: 'text-primary' },
              ].map((s) => (
                <Card key={s.label} className="p-3 sm:p-5 text-center bg-card/80 backdrop-blur hover-scale">
                  <Icon name={s.icon} size={20} className={`mx-auto mb-1.5 ${s.color}`} />
                  <div className="font-display text-2xl sm:text-3xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ─── Игры ─── */}
        {view === 'games' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-float-up">
            {GAMES.map((g) => (
              <Card key={g.id} className="p-4 bg-card/80 backdrop-blur hover-scale flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 sm:mb-4 rounded-2xl bg-gradient-to-br ${g.color} flex items-center justify-center shrink-0`}>
                  <Icon name={g.icon} size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg sm:text-xl font-bold">{g.name}</h3>
                  <p className="text-xs text-muted-foreground">Победа: +10 ЖГ и +50 опыта</p>
                </div>
                <Button onClick={() => setActiveGame(g.name)} size="sm" className="shrink-0 font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Icon name="Play" size={13} className="mr-1" /> Играть
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* ─── Друзья ─── */}
        {view === 'friends' && (
          <div className="space-y-2 animate-float-up">
            {ALL_PLAYERS.filter((n) => n !== player.nickname).map((name) => {
              const isFriend = player.friends.includes(name);
              return (
                <Card key={name} className="p-3 sm:p-4 bg-card/80 backdrop-blur flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-white text-sm shrink-0">
                    {name[0].toUpperCase()}
                  </div>
                  <span className="flex-1 font-semibold text-sm truncate">{name}</span>
                  <Button
                    size="sm"
                    onClick={() => toggleFriend(name)}
                    variant={isFriend ? 'secondary' : 'default'}
                    className={`shrink-0 text-xs ${isFriend ? '' : 'bg-gradient-to-r from-primary to-accent hover:opacity-90'}`}
                  >
                    <Icon name={isFriend ? 'Check' : 'UserPlus'} size={12} className="mr-1" />
                    {isFriend ? 'В друзьях' : 'Добавить'}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {/* ─── Кейсы ─── */}
        {view === 'cases' && (
          <div className="animate-float-up space-y-5">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold mb-1">ЖГ Кейс</h2>
              <p className="text-sm text-muted-foreground">Стоимость: <span className="text-accent font-bold">100 ЖГ монет</span></p>
            </div>

            {/* Барабан */}
            <Card className="p-4 bg-card/80 backdrop-blur neon-border overflow-hidden">
              <div className="relative h-20 overflow-hidden">
                {/* Центральный маркер */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none" />
                <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-3 h-3 bg-primary rotate-45 z-10" />
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-3 h-3 bg-primary rotate-45 z-10" />

                {caseResult?.spinning && (
                  <div
                    className="flex items-center gap-2 absolute left-0 top-1/2 -translate-y-1/2"
                    style={{ animation: 'caseRoll 3.0s cubic-bezier(0.12,0.8,0.25,1.0) forwards' }}
                  >
                    {spinItems.map((p, i) => (
                      <div
                        key={i}
                        className={`shrink-0 w-20 h-16 rounded-xl bg-gradient-to-br ${TIER_COLORS[p.tier]} flex flex-col items-center justify-center`}
                      >
                        <Icon name="Coins" size={16} className="text-white/80 mb-0.5" />
                        <span className="font-display font-bold text-white text-sm">{p.amount}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!caseResult && !caseOpening && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                    {CASE_PRIZES.slice(0, 5).map((p, i) => (
                      <div key={i} className={`shrink-0 w-20 h-16 rounded-xl bg-gradient-to-br ${TIER_COLORS[p.tier]} flex flex-col items-center justify-center opacity-60`}>
                        <Icon name="Coins" size={16} className="text-white/80 mb-0.5" />
                        <span className="font-display font-bold text-white text-sm">{p.amount}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Результат */}
                {caseResult && !caseResult.spinning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center animate-pop-in">
                    {(() => {
                      const won = CASE_PRIZES.find(p => p.amount === caseResult.prize) ?? CASE_PRIZES[0];
                      return (
                        <div className={`w-full h-full rounded-xl bg-gradient-to-br ${TIER_COLORS[won.tier]} flex flex-col items-center justify-center gap-1`}>
                          <Icon name="Coins" size={20} className="text-white/80" />
                          <span className="font-display font-bold text-white text-2xl">{caseResult.prize} ЖГ</span>
                          <span className="text-white/70 text-xs">{TIER_LABELS[won.tier]}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </Card>

            {/* Кнопка открыть */}
            <Button
              onClick={openCase}
              disabled={caseOpening || player.coins < 100}
              className="w-full h-12 font-bold text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50"
            >
              {caseOpening
                ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" /> Открываем...</>
                : player.coins < 100
                  ? <><Icon name="Lock" size={16} className="mr-2" /> Нужно 100 монет</>
                  : <><Icon name="Package" size={16} className="mr-2" /> Открыть кейс за 100 ЖГ</>}
            </Button>

            {caseResult && !caseResult.spinning && (
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  {caseResult.prize >= 1000 ? '🔥 НЕВЕРОЯТНО!' : caseResult.prize >= 300 ? '⚡ Отличный выигрыш!' : caseResult.prize >= 100 ? '👍 Неплохо!' : 'Повезёт в следующий раз!'}
                </p>
                <Button variant="ghost" size="sm" onClick={() => setCaseResult(null)} className="mt-1 text-xs text-muted-foreground">
                  Закрыть
                </Button>
              </div>
            )}

            {/* Таблица призов */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Возможные призы</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CASE_PRIZES.map((p) => {
                  const totalWeight = CASE_PRIZES.reduce((s, x) => s + x.weight, 0);
                  const pct = ((p.weight / totalWeight) * 100).toFixed(1);
                  return (
                    <div key={p.amount} className={`rounded-xl p-2.5 bg-gradient-to-br ${TIER_COLORS[p.tier]} flex items-center gap-2`}>
                      <Icon name="Coins" size={14} className="text-white/80 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-display font-bold text-white text-sm">{p.amount} ЖГ</p>
                        <p className="text-white/60 text-[10px]">{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Рейтинг ─── */}
        {view === 'rating' && (
          <div className="animate-float-up space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-bold">Таблица лидеров</h2>
              <Button variant="ghost" size="sm" onClick={fetchLeaders} disabled={loadingLeaders} className="text-muted-foreground text-xs">
                <Icon name="RefreshCw" size={13} className={`mr-1 ${loadingLeaders ? 'animate-spin' : ''}`} /> Обновить
              </Button>
            </div>

            {loadingLeaders && leaders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Loader" size={30} className="mx-auto animate-spin mb-3" />
                <p className="text-sm">Загружаем рейтинг...</p>
              </div>
            )}

            {!loadingLeaders && leaders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Trophy" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Пока нет игроков в рейтинге.<br />Войди и сыграй первым!</p>
              </div>
            )}

            {leaders.map((l, i) => {
              const isMe = l.nickname === player.nickname;
              return (
                <Card
                  key={l.nickname}
                  className={`p-3 sm:p-4 backdrop-blur flex items-center gap-3 transition-all ${isMe ? 'neon-border bg-primary/10' : 'bg-card/80'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0 ${i < 3 ? 'bg-gradient-to-br from-primary to-accent text-white' : 'bg-muted text-muted-foreground'}`}>
                    {i < 3 ? MEDAL[i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isMe ? 'text-primary' : ''}`}>
                      {l.nickname} {isMe && <span className="text-xs text-muted-foreground font-normal">(ты)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">Уровень {l.level} · {l.xp} опыта</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Icon name="Coins" size={13} className="text-accent" />
                    <span className="font-display font-bold text-lg">{l.coins}</span>
                    <span className="text-xs text-muted-foreground">ЖГ</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Нижняя навигация — только мобиль */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border">
        <div className="grid grid-cols-4 gap-0 py-1 px-2 pb-2">
          {NAV.map(([v, label, icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all ${view === v ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon name={icon} size={21} />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}