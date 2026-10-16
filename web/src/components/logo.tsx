'use client';
import { logoPlanetSVG } from '@/art/planets';
import { fizzSVG } from '@/art/portrait';
import { Svg } from './ui';

export function Logo({ tag = 'An anime adventure across the stars' }: { tag?: string }) {
  return (
    <div className="logo">
      <div className="logo-art">
        <Svg html={logoPlanetSVG()} className="planet-art" />
        <Svg html={fizzSVG('excited', 'logofz')} className="logo-fizz" />
      </div>
      <h1 className="logo-title">Party<span className="galaxy">Galaxy</span></h1>
      {tag ? <p className="logo-tag">{tag}</p> : null}
    </div>
  );
}
