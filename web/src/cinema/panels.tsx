'use client';
// Manga split panels: two or three slanted frames, each a close-up reaction on an anime background.
import { CREW, captainLook, type CrewId, type Look } from '@/art/looks';
import { faceSVG, fizzFaceSVG, portraitSVG, type FizzExpr } from '@/art/portrait';
import type { Expr } from '@/art/face';
import { Svg } from '@/components/ui';
import type { Panel } from './types';

const BG: Record<string, string> = { rays: '#ffd36e', sparkle: '#ffb7dc', gloom: '#3b3f8a', dots: '#8fc8ff', speed: '#7B61FF', hearts: '#ffb7dc', shock: '#c9b6ff', flat: '#ffd1e8' };

/**
 * A face with a giant lollipop held right at the mouth, the tongue on the candy (the face art is widened
 * to the right to make room for it). The candy is glossy and melting.
 */
function lickingFace(look: Parameters<typeof portraitSVG>[0], expr: Expr, candy: string, uid: string): string {
  const lolli = `<path d="M150 178 L200 236" stroke="#2a1838" stroke-width="12" stroke-linecap="round"/><path d="M150 178 L200 236" stroke="#fff8ee" stroke-width="7" stroke-linecap="round"/>`
    + `<defs><clipPath id="${uid}"><circle cx="134" cy="150" r="36"/></clipPath></defs>`
    + `<circle cx="134" cy="150" r="36" fill="${candy}" stroke="#2a1838" stroke-width="4"/>`
    + `<g clip-path="url(#${uid})">${[0, 60, 120, 180, 240, 300].map((d) => `<path d="M134 150 L${(134 + Math.cos((d * Math.PI) / 180) * 40).toFixed(1)} ${(150 + Math.sin((d * Math.PI) / 180) * 40).toFixed(1)} A40 40 0 0 1 ${(134 + Math.cos(((d + 30) * Math.PI) / 180) * 40).toFixed(1)} ${(150 + Math.sin(((d + 30) * Math.PI) / 180) * 40).toFixed(1)} Z" fill="#fff" opacity=".75"/>`).join('')}</g>`
    + `<circle cx="134" cy="150" r="36" fill="none" stroke="#2a1838" stroke-width="4"/>`
    + `<path d="M116 130 Q128 120 144 124" stroke="#fff" stroke-width="5" fill="none" opacity=".8" stroke-linecap="round"/>`
    + `<path d="M150 182 q2 14 -2 22" stroke="${candy}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  return portraitSVG(look, expr, '30 22 190 170').replace('</svg>', `${lolli}</svg>`);
}

export function Panels({ panels, hero }: { panels: Panel[]; hero: Look }) {
  const n = Math.min(5, panels.length);
  return (
    <div className={`panels n${n}`} aria-hidden="true">
      {panels.slice(0, 5).map((p, i) => {
        const look = p.who === 'you' ? captainLook(hero) : p.who === 'fizz' ? null : CREW[p.who as CrewId];
        const art = !look ? fizzFaceSVG((['happy', 'excited', 'shock', 'sad', 'smug', 'sing', 'wink'].includes(p.expr) ? p.expr : 'happy') as FizzExpr, `pnl${i}`)
          : p.lolli ? lickingFace(look, p.expr as Expr, p.lolli, `pnl-l${i}`) : faceSVG(look, p.expr as Expr);
        return (
          <div key={i} className={`panel p${i} bg-${p.bg || 'flat'}`} style={{ background: p.color || BG[p.bg || 'flat'], animationDelay: `${i * 0.12}s` }}>
            <div className="pattern" />
            <Svg html={art} className={`pface${p.lolli ? ' lolli' : ''}`} />
          </div>
        );
      })}
    </div>
  );
}
