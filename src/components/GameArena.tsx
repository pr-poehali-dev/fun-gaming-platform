import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface GameArenaProps {
  game: string;
  onFinish: (win: boolean) => void;
  onClose: () => void;
}

type Phase = 'intro' | 'playing' | 'win' | 'lose';

export default function GameArena({ game, onFinish, onClose }: GameArenaProps) {
  if (game === 'Догонялки') return <TagGame onFinish={onFinish} onClose={onClose} />;
  if (game === 'Прятки') return <HideGame onFinish={onFinish} onClose={onClose} />;
  if (game === 'Гонки') return <RaceGame onFinish={onFinish} onClose={onClose} />;
  return <ReactionGame onFinish={onFinish} onClose={onClose} title={game} />;
}

function Shell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-pop-in">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-3xl font-bold text-glow">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={24} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Result({ phase, onClose }: { phase: Phase; onClose: () => void }) {
  if (phase !== 'win' && phase !== 'lose') return null;
  const win = phase === 'win';
  return (
    <div className="mt-4 p-6 rounded-2xl bg-card neon-border text-center animate-pop-in">
      <Icon name={win ? 'Trophy' : 'Frown'} size={48} className={`mx-auto mb-2 ${win ? 'text-secondary' : 'text-muted-foreground'}`} />
      <p className="font-display text-2xl font-bold">{win ? 'Победа!' : 'Поражение'}</p>
      <p className="text-muted-foreground mt-1">{win ? '+10 ЖГ монет и +50 опыта' : 'Без награды. Попробуй ещё раз!'}</p>
      <Button onClick={onClose} className="mt-4 font-bold bg-gradient-to-r from-primary to-accent">
        Вернуться к играм
      </Button>
    </div>
  );
}

function TagGame({ onFinish, onClose }: { onFinish: (w: boolean) => void; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [caught, setCaught] = useState(0);
  const [time, setTime] = useState(15);
  const areaRef = useRef<HTMLDivElement>(null);
  const GOAL = 8;

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'playing' && time <= 0) {
      const win = caught >= GOAL;
      setPhase(win ? 'win' : 'lose');
      onFinish(win);
    }
  }, [time, phase, caught, onFinish]);

  const flee = useCallback(() => {
    setPos({ x: 8 + Math.random() * 84, y: 8 + Math.random() * 84 });
  }, []);

  const catchIt = () => {
    const next = caught + 1;
    setCaught(next);
    if (next >= GOAL) {
      setPhase('win');
      onFinish(true);
      return;
    }
    flee();
  };

  return (
    <Shell title="Догонялки" onClose={onClose}>
      {phase === 'intro' && (
        <Intro
          desc="Наведи и кликни по убегающему шарику 8 раз за 15 секунд. Он удирает от курсора!"
          onStart={() => { setPhase('playing'); flee(); }}
        />
      )}
      {phase === 'playing' && (
        <>
          <Hud left={`Поймано: ${caught}/${GOAL}`} right={`⏱ ${time}с`} />
          <div ref={areaRef} className="relative h-80 rounded-2xl bg-muted/50 overflow-hidden border border-border"
            onMouseMove={(e) => {
              const r = areaRef.current!.getBoundingClientRect();
              const mx = ((e.clientX - r.left) / r.width) * 100;
              const my = ((e.clientY - r.top) / r.height) * 100;
              if (Math.hypot(mx - pos.x, my - pos.y) < 14) flee();
            }}>
            <button
              onClick={catchIt}
              className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg transition-all duration-150 hover:scale-110"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <Icon name="Footprints" size={20} className="text-white mx-auto" />
            </button>
          </div>
        </>
      )}
      <Result phase={phase} onClose={onClose} />
    </Shell>
  );
}

function HideGame({ onFinish, onClose }: { onFinish: (w: boolean) => void; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [target, setTarget] = useState(0);
  const [tries, setTries] = useState(3);
  const COUNT = 12;

  const start = () => {
    setTarget(Math.floor(Math.random() * COUNT));
    setTries(3);
    setPhase('playing');
  };

  const pick = (i: number) => {
    if (i === target) {
      setPhase('win');
      onFinish(true);
    } else {
      const left = tries - 1;
      setTries(left);
      if (left <= 0) {
        setPhase('lose');
        onFinish(false);
      } else {
        setTarget(Math.floor(Math.random() * COUNT));
      }
    }
  };

  return (
    <Shell title="Прятки" onClose={onClose}>
      {phase === 'intro' && (
        <Intro
          desc="Игрок спрятался в одной из коробок. Угадай где! У тебя 3 попытки — после промаха он перепрячется."
          onStart={start}
        />
      )}
      {phase === 'playing' && (
        <>
          <Hud left={`Попыток: ${tries}`} right="Найди игрока!" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: COUNT }).map((_, i) => (
              <button
                key={i}
                onClick={() => pick(i)}
                className="aspect-square rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-border hover:scale-105 hover:from-cyan-400/40 hover:to-teal-500/40 transition-all flex items-center justify-center"
              >
                <Icon name="Box" size={32} className="text-accent" />
              </button>
            ))}
          </div>
        </>
      )}
      <Result phase={phase} onClose={onClose} />
    </Shell>
  );
}

function RaceGame({ onFinish, onClose }: { onFinish: (w: boolean) => void; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [progress, setProgress] = useState(0);
  const [enemy, setEnemy] = useState(0);
  const enemyRef = useRef<ReturnType<typeof setInterval>>();

  const start = () => {
    setProgress(0);
    setEnemy(0);
    setPhase('playing');
    enemyRef.current = setInterval(() => {
      setEnemy((e) => {
        const n = e + 1.3;
        if (n >= 100) {
          clearInterval(enemyRef.current);
          setPhase('lose');
          onFinish(false);
        }
        return n;
      });
    }, 100);
  };

  const tick = () => {
    if (phase !== 'playing') return;
    setProgress((p) => {
      const n = p + 4;
      if (n >= 100) {
        clearInterval(enemyRef.current);
        setPhase('win');
        onFinish(true);
      }
      return Math.min(n, 100);
    });
  };

  useEffect(() => () => clearInterval(enemyRef.current), []);

  return (
    <Shell title="Гонки" onClose={onClose}>
      {phase === 'intro' && (
        <Intro desc="Кликай по машине как можно быстрее, чтобы обогнать соперника и первым добраться до финиша!" onStart={start} />
      )}
      {phase === 'playing' && (
        <div className="space-y-6">
          <Track icon="Car" progress={progress} color="from-amber-400 to-orange-500" label="Ты" />
          <Track icon="Bot" progress={enemy} color="from-slate-400 to-slate-600" label="Соперник" />
          <Button onClick={tick} className="w-full h-20 text-2xl font-display font-bold bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 active:scale-95">
            <Icon name="Zap" size={28} className="mr-2" /> ГАЗ!
          </Button>
        </div>
      )}
      <Result phase={phase} onClose={onClose} />
    </Shell>
  );
}

function Track({ icon, progress, color, label }: { icon: string; progress: number; color: string; label: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="relative h-12 rounded-2xl bg-muted/50 border border-border overflow-hidden">
        <div className={`absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center transition-all duration-100`} style={{ left: `calc(${progress}% - ${progress * 0.36}px)` }}>
          <Icon name={icon} size={18} className="text-white" />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-2xl">🏁</div>
      </div>
    </div>
  );
}

function ReactionGame({ onFinish, onClose, title }: { onFinish: (w: boolean) => void; onClose: () => void; title: string }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState('Жди зелёный сигнал...');
  const startTime = useRef(0);

  const start = () => {
    setPhase('playing');
    setReady(false);
    setHint('Жди зелёный сигнал...');
    setTimeout(() => {
      setReady(true);
      setHint('ЖМИ!');
      startTime.current = Date.now();
    }, 1200 + Math.random() * 2500);
  };

  const click = () => {
    if (!ready) {
      setPhase('lose');
      onFinish(false);
      return;
    }
    const win = Date.now() - startTime.current < 500;
    setPhase(win ? 'win' : 'lose');
    onFinish(win);
  };

  return (
    <Shell title={title} onClose={onClose}>
      {phase === 'intro' && (
        <Intro desc="Тест на реакцию! Дождись, пока поле станет зелёным, и кликни как можно быстрее. Рано нажмёшь — проигрыш." onStart={start} />
      )}
      {phase === 'playing' && (
        <button
          onClick={click}
          className={`w-full h-80 rounded-2xl font-display text-4xl font-bold transition-colors ${ready ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white' : 'bg-muted/50 border border-border text-muted-foreground'}`}
        >
          {hint}
        </button>
      )}
      <Result phase={phase} onClose={onClose} />
    </Shell>
  );
}

function Intro({ desc, onStart }: { desc: string; onStart: () => void }) {
  return (
    <div className="p-8 rounded-2xl bg-card neon-border text-center">
      <p className="text-lg text-muted-foreground mb-6">{desc}</p>
      <Button onClick={onStart} className="h-12 px-8 text-lg font-bold bg-gradient-to-r from-primary to-accent">
        <Icon name="Play" size={20} className="mr-2" /> Начать игру
      </Button>
    </div>
  );
}

function Hud({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between mb-3 font-display text-xl font-bold">
      <span className="text-accent">{left}</span>
      <span className="text-secondary">{right}</span>
    </div>
  );
}
