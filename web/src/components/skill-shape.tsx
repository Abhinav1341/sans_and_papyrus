'use client';
// Parent Corner: the Captain's "skill shape", a radar chart of where each skill sits now (solid mint)
// against where they started for their age (dashed lilac). It shows positions only: no numbers and no
// scores, in keeping with the game's rule that children are never graded.
import { useState } from 'react';

export interface ShapeAxis { key: string; label: string; now: number; start: number; played: number; trend: 'more' | 'some' | 'steady' | 'harder' | 'new' }

// Validated with the dataviz palette checker on the card surface (#1d1745): lightness band, chroma,
// colour-blind separation and contrast all pass. The start shape is also dashed, so colour isn't the only cue.
const NOW = '#2fa585';
const START = '#8b78e8';
const SURFACE = '#1d1745';

const TREND: Record<ShapeAxis['trend'], string> = {
  more: 'grown a lot since they started',
  some: 'growing',
  steady: 'about where they started',
  harder: 'finding this a little harder lately',
  new: 'not practised yet',
};

/** Splits a label into short lines (about 9 characters) so the side spokes fit on a phone. */
function lines(label: string): string[] {
  if (label.length <= 8) return [label];
  const words = label.split(' ');
  let first = '';
  while (words.length && (!first || (first + ' ' + words[0]).length <= 9)) first = (first + ' ' + words.shift()).trim();
  return words.length ? [first, words.join(' ')] : [first];
}

export function headline(axes: ShapeAxis[]): string {
  const grown = axes.filter((a) => a.trend === 'more' || a.trend === 'some').sort((a, b) => b.now - a.now);
  if (grown.length >= 2) return `Growing most: ${grown[0].label.toLowerCase()} and ${grown[1].label.toLowerCase()}`;
  if (grown.length === 1) return `Growing most: ${grown[0].label.toLowerCase()}`;
  return axes.some((a) => a.played) ? 'Every skill is about where they started so far' : 'Not practised yet';
}

export function SkillShape({ axes, title, size = 340 }: { axes: ShapeAxis[]; title: string; size?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const n = axes.length;
  const W = 340, H = n === 3 ? 280 : 310, cx = W / 2, cy = n === 3 ? 158 : 165, R = n === 3 ? 100 : 102;
  const at = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + R * r * Math.cos(a), cy + R * r * Math.sin(a)] as const;
  };
  const poly = (r: (i: number) => number) => axes.map((_, i) => at(i, r(i)).map((v) => v.toFixed(1)).join(',')).join(' ');
  const summary = `${title}. ${axes.map((a) => `${a.label}: ${TREND[a.trend]}`).join('. ')}.`;
  const readout = active === null ? headline(axes) : `${axes[active].label}: ${TREND[axes[active].trend]}`;

  return (
    <figure className="shape">
      <figcaption className="shape-title">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: size }} role="img" aria-label={summary}>
        {/* Recessive grid: outer edge, quarter rings, spokes */}
        {[1, 0.75, 0.25].map((r) => <polygon key={r} points={poly(() => r)} fill="none" stroke="var(--line)" strokeWidth={r === 1 ? 1.5 : 1} />)}
        {axes.map((_, i) => { const [x, y] = at(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />; })}
        {/* Where they started (the middle ring), then where they are now */}
        <polygon points={poly(() => 0.5)} fill="none" stroke={START} strokeWidth={2} strokeDasharray="6 5" />
        <polygon points={poly((i) => axes[i].now)} fill={NOW} fillOpacity={0.28} stroke={NOW} strokeWidth={2} strokeLinejoin="round" />
        {axes.map((a, i) => {
          const [x, y] = at(i, a.now);
          const on = active === i;
          return (
            <g key={a.key} tabIndex={0} role="button" aria-label={`${a.label}: ${TREND[a.trend]}`} className="shape-pt"
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}>
              <circle cx={x} cy={y} r={18} fill="transparent" />
              <circle cx={x} cy={y} r={on ? 7 : 5} fill={a.played ? NOW : SURFACE} stroke={a.played ? SURFACE : NOW} strokeWidth={2} />
            </g>
          );
        })}
        {/* Spoke labels in text colours (never the series colour) */}
        {axes.map((a, i) => {
          const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          const [x, y] = at(i, 1.15);
          const anchor = Math.cos(ang) > 0.3 ? 'start' : Math.cos(ang) < -0.3 ? 'end' : 'middle';
          const ls = lines(a.label);
          const y0 = Math.sin(ang) > 0.3 ? y + 10 : Math.sin(ang) < -0.3 ? y - (ls.length - 1) * 17 - 2 : y - ((ls.length - 1) * 17) / 2 + 5;
          return (
            <text key={a.key} x={x} y={y0} textAnchor={anchor} className={`shape-label${a.played ? '' : ' new'}${active === i ? ' on' : ''}`}>
              {ls.map((l, k) => <tspan key={k} x={x} dy={k ? 17 : 0}>{l}</tspan>)}
            </text>
          );
        })}
      </svg>
      <p className="shape-readout" aria-live="polite">{readout}</p>
      <div className="shape-legend" aria-hidden="true">
        <span><i className="sw now" />Now</span>
        <span><i className="sw start" />When they started</span>
      </div>
      <details className="shape-list">
        <summary>See as a list</summary>
        <ul>{axes.map((a) => <li key={a.key}><strong>{a.label}</strong>: {TREND[a.trend]}</li>)}</ul>
      </details>
    </figure>
  );
}
