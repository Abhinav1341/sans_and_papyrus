'use client';
// Manga split panels: two or three slanted frames, each a close-up reaction on an anime background.
import { CREW, captainLook, type CrewId, type Look } from '@/art/looks';
import { faceSVG, fizzFaceSVG, type FizzExpr } from '@/art/portrait';
import type { Expr } from '@/art/face';
import { Svg } from '@/components/ui';
import type { Panel } from './types';

const BG: Record<string, string> = { rays: '#ffd36e', sparkle: '#ffb7dc', gloom: '#3b3f8a', dots: '#8fc8ff', speed: '#7B61FF', hearts: '#ffb7dc', shock: '#c9b6ff', flat: '#ffd1e8' };

export function Panels({ panels, hero }: { panels: Panel[]; hero: Look }) {
  const n = Math.min(3, panels.length);
  return (
    <div className={`panels n${n}`} aria-hidden="true">
      {panels.slice(0, 3).map((p, i) => {
        const art = p.who === 'fizz' ? fizzFaceSVG((['happy', 'excited', 'shock', 'sad', 'smug', 'sing', 'wink'].includes(p.expr) ? p.expr : 'happy') as FizzExpr, `pnl${i}`)
          : p.who === 'you' ? faceSVG(captainLook(hero), p.expr as Expr) : faceSVG(CREW[p.who as CrewId], p.expr as Expr);
        return (
          <div key={i} className={`panel p${i} bg-${p.bg || 'flat'}`} style={{ background: p.color || BG[p.bg || 'flat'], animationDelay: `${i * 0.12}s` }}>
            <div className="pattern" />
            <Svg html={art} className="pface" />
          </div>
        );
      })}
    </div>
  );
}
