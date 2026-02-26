'use client';

import React, { useMemo } from 'react';
import {
  Star,
  Moon,
  Fish,
  Turtle,
  Shell,
  Anchor,
  Sailboat,
  CloudSun,
  type LucideIcon,
} from 'lucide-react';

const BG_ICONS: { icon: LucideIcon; color: string }[] = [
  { icon: Fish, color: 'text-sky-200/60' },
  { icon: Fish, color: 'text-cyan-200/60' },
  { icon: Fish, color: 'text-blue-200/60' },
  { icon: Fish, color: 'text-teal-200/60' },
  { icon: Fish, color: 'text-indigo-200/60' },

  { icon: Turtle, color: 'text-teal-200/60' },
  { icon: Turtle, color: 'text-emerald-200/60' },
  { icon: Turtle, color: 'text-green-200/60' },
  { icon: Turtle, color: 'text-lime-200/60' },

  { icon: Star, color: 'text-amber-200/60' },
  { icon: Star, color: 'text-slate-300/60' },
  { icon: Star, color: 'text-orange-200/60' },

  { icon: Moon, color: 'text-indigo-200/60' },
  { icon: Moon, color: 'text-purple-200/60' },
  { icon: Moon, color: 'text-violet-200/60' },

  { icon: Shell, color: 'text-pink-200/60' },
  { icon: Shell, color: 'text-rose-200/60' },
  { icon: Shell, color: 'text-fuchsia-200/60' },

  { icon: Anchor, color: 'text-slate-300/60' },
  { icon: Anchor, color: 'text-gray-300/60' },

  { icon: Sailboat, color: 'text-blue-200/60' },
  { icon: Sailboat, color: 'text-sky-200/60' },
  { icon: Sailboat, color: 'text-indigo-200/60' },

  { icon: CloudSun, color: 'text-orange-200/60' },
  { icon: CloudSun, color: 'text-amber-200/60' },

  { icon: Fish, color: 'text-emerald-200/60' },
  { icon: Turtle, color: 'text-cyan-200/60' },
  { icon: Star, color: 'text-violet-200/60' },
  { icon: Shell, color: 'text-rose-200/60' },
  { icon: Moon, color: 'text-blue-200/60' },
  { icon: Anchor, color: 'text-indigo-200/60' },
  { icon: Sailboat, color: 'text-teal-200/60' },
  { icon: Fish, color: 'text-violet-200/60' },
];

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const ScatteredIcons: React.FC = () => {
  const items = useMemo(() => {
    const COLS = 10;
    const ROWS = 10;
    const cellW = 100 / COLS;
    const cellH = 100 / ROWS;
    const totalCells = COLS * ROWS;

    return Array.from({ length: totalCells }, (_, i) => {
      const entry = BG_ICONS[i % BG_ICONS.length];
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      const jitterX = (seededRandom(i * 7 + 1) - 0.5) * cellW * 0.6;
      const jitterY = (seededRandom(i * 11 + 2) - 0.5) * cellH * 0.6;
      const left = col * cellW + cellW / 2 + jitterX;
      const top = row * cellH + cellH / 2 + jitterY;

      const size = 18 + seededRandom(i * 5 + 3) * 22;
      const rotate = (seededRandom(i * 13 + 4) * 2 - 1) * 15;
      const opacity = 0.35 + seededRandom(i * 17 + 5) * 0.35;

      return { ...entry, top, left, size, rotate, opacity };
    });
  }, []);

  return (
    <>
      {items.map((item, i) => {
        const IconComp = item.icon;
        return (
          <IconComp
            key={i}
            size={item.size}
            className={`absolute pointer-events-none select-none ${item.color}`}
            style={{
              top: `${item.top}%`,
              left: `${item.left}%`,
              transform: `rotate(${item.rotate}deg)`,
              opacity: item.opacity,
            }}
          />
        );
      })}
    </>
  );
};

export default ScatteredIcons;
