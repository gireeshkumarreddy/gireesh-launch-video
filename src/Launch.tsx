import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/fonts';

loadFont({ family: 'Studio', url: staticFile('assets/sans.woff'), weight: '400' });
loadFont({ family: 'Studio', url: staticFile('assets/sans-bold.woff'), weight: '700' });
loadFont({ family: 'Bookman', url: staticFile('assets/serif-italic.woff'), weight: '700', style: 'italic' });
loadFont({ family: 'Hand', url: staticFile('assets/hand.woff') });

export const DURATION = 885; // 14.75s @ 60fps

const C = { green: '#164e38', deep: '#103b2d', cream: '#f6f1de', pink: '#e8a4bb', yellow: '#f3d36e', ink: '#20271f', shadow: '#0b3326' };
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
const easeIn = Easing.bezier(0.55, 0, 1, 0.45);
const ip = (f: number, a: number, b: number, x: number, y: number, e: (t: number) => number = ease) =>
  interpolate(f, [a, b], [x, y], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });

// Captured pages (1781px wide full-page screenshots, 1.25x of a 1440x900 viewport)
const NATIVE_W = 1781;
const VIEW_RATIO = 1125 / NATIVE_W;
const PAGE = {
  index: { src: 'shots/index.png', h: 9786, url: '/' },
  work: { src: 'shots/work.png', h: 3564, url: '/work' },
  about: { src: 'shots/about.png', h: 4229, url: '/about' },
  forme: { src: 'shots/forme.png', h: 5429, url: '/projects/forme' },
  sonar: { src: 'shots/sonar.png', h: 5355, url: '/projects/sonar' },
  daylight: { src: 'shots/daylight.png', h: 5451, url: '/projects/daylight' },
};
type PageKey = keyof typeof PAGE;
const barH = (w: number) => Math.max(14, w * 0.028);
const maxScroll = (p: PageKey, w: number, h: number) => Math.max(0, PAGE[p].h - (h - barH(w)) / (w / NATIVE_W));

// ---------- shared pieces ----------

const gridImage =
  'linear-gradient(rgba(232,215,141,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(232,215,141,.09) 1px,transparent 1px),linear-gradient(rgba(222,218,139,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(222,218,139,.2) 1px,transparent 1px)';
const matStyle = (frame: number): React.CSSProperties => {
  const drift = frame * 0.15;
  return {
    backgroundColor: C.green,
    backgroundImage: gridImage,
    backgroundSize: '16px 16px,16px 16px,80px 80px,80px 80px',
    backgroundPosition: `${drift}px ${drift * 0.5}px`,
  };
};

const Browser: React.FC<{ page: PageKey; w: number; h: number; scroll?: number; chrome?: number; style?: React.CSSProperties }> = ({ page, w, h, scroll = 0, chrome = 1, style }) => {
  const k = w / NATIVE_W;
  const bar = barH(w) * chrome;
  const dot = bar * 0.32;
  return (
    <div
      style={{
        position: 'absolute', width: w, height: h, overflow: 'hidden', background: C.green,
        borderRadius: 6 + 12 * chrome * Math.min(1, w / 800),
        boxShadow: `0 ${40 * chrome}px ${90 * chrome}px rgba(3,18,12,${0.55 * chrome}), 0 0 0 ${1.5 * chrome}px rgba(246,241,222,.22)`,
        ...style,
      }}
    >
      <Img src={staticFile(PAGE[page].src)} style={{ position: 'absolute', left: 0, top: bar, width: '100%', transform: `translateY(${-scroll * k}px)` }} />
      {chrome > 0 && (
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: bar, background: C.deep, display: 'flex', alignItems: 'center', paddingLeft: bar * 0.55, gap: dot * 0.7, opacity: chrome, borderBottom: '1px solid rgba(246,241,222,.12)' }}>
          {[C.pink, C.yellow, 'rgba(246,241,222,.5)'].map((c) => (
            <div key={c} style={{ width: dot, height: dot, borderRadius: dot, background: c }} />
          ))}
          {w > 400 && (
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', height: bar * 0.58, padding: `0 ${bar * 0.8}px`, borderRadius: bar, background: 'rgba(246,241,222,.08)', color: 'rgba(246,241,222,.75)', fontFamily: 'Studio', fontSize: bar * 0.34, letterSpacing: '.08em', display: 'flex', alignItems: 'center' }}>
              gireesh {PAGE[page].url}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Pencil tip sits at (9.6%, 83.5%) of the cut-out, so tip coordinates can be targeted directly.
const TIP = [0.096, 0.835];
const Pencil: React.FC<{ x: number; y: number; size?: number; rot?: number; opacity?: number }> = ({ x, y, size = 260, rot = 0, opacity = 1 }) => (
  <Img
    src={staticFile('assets/pencil.webp')}
    style={{
      position: 'absolute', width: size, height: size, left: x - size * TIP[0], top: y - size * TIP[1], opacity,
      transformOrigin: `${TIP[0] * 100}% ${TIP[1] * 100}%`, transform: `rotate(${rot}deg)`,
      filter: 'drop-shadow(-16px 26px 14px rgba(0,0,0,.38))',
    }}
  />
);

const Prop: React.FC<{ name: string; x: number; y: number; size: number; rot?: number; opacity?: number; scale?: number }> = ({ name, x, y, size, rot = 0, opacity = 1, scale = 1 }) => (
  <Img
    src={staticFile(`assets/${name}.webp`)}
    style={{ position: 'absolute', width: size, height: size, left: x - size / 2, top: y - size / 2, opacity, transform: `rotate(${rot}deg) scale(${scale})`, filter: 'drop-shadow(-14px 24px 16px rgba(0,0,0,.4))' }}
  />
);

const Eyebrow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: 'Studio', fontWeight: 700, fontSize: 18, letterSpacing: '.14em', color: C.cream, textTransform: 'uppercase', ...style }}>{children}</div>
);

const Em: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontFamily: 'Bookman', fontStyle: 'italic', fontWeight: 700, fontSize: '.91em', letterSpacing: '-.05em' }}>{children}</span>
);

// Stamped wordmark: letters drop onto the mat one at a time.
const Wordmark: React.FC<{ f: number; size: number; stagger?: number }> = ({ f, size, stagger = 4 }) => {
  const { fps } = useVideoConfig();
  const starIn = spring({ frame: f - 7 * stagger - 2, fps, config: { damping: 9, stiffness: 120 } });
  return (
    <div style={{ position: 'relative', display: 'flex', fontFamily: 'Bookman', fontStyle: 'italic', fontWeight: 700, fontSize: size, lineHeight: 1.1, color: C.cream, letterSpacing: '-.07em', transform: 'rotate(-4deg)' }}>
      {'Gireesh'.split('').map((ch, i) => {
        const lf = f - i * stagger;
        const s = spring({ frame: lf, fps, config: { damping: 11, stiffness: 170, mass: 0.7 } });
        return (
          <span key={i} style={{ display: 'inline-block', opacity: ip(lf, 0, 4, 0, 1, Easing.linear), textShadow: `0 ${size * 0.04}px 0 ${C.shadow}`, transform: `translateY(${(1 - s) * -size * 0.45}px) scale(${interpolate(s, [0, 1], [2.3, 1])}) rotate(${(1 - s) * (i % 2 ? 16 : -16)}deg)` }}>
            {ch}
          </span>
        );
      })}
      <span style={{ position: 'absolute', right: -size * 0.22, top: -size * 0.2, fontFamily: 'Arial', fontStyle: 'normal', fontWeight: 400, fontSize: size * 0.42, color: C.pink, opacity: Math.min(1, starIn * 2), transform: `scale(${starIn}) rotate(${(1 - starIn) * -220 + f * 1.2}deg)` }}>✳</span>
    </div>
  );
};

const Tag: React.FC<{ children: React.ReactNode; o: number; rot?: number; size?: number }> = ({ children, o, rot = -2.5, size = 22 }) => (
  <div style={{ display: 'inline-block', background: C.pink, color: C.ink, fontFamily: 'Studio', fontWeight: 700, fontSize: size, letterSpacing: '.06em', textTransform: 'uppercase', padding: `${size * 0.6}px ${size * 0.9}px`, boxShadow: `0 ${size * 0.25}px 0 ${C.shadow}`, opacity: o, transform: `rotate(${rot}deg) translateY(${(1 - o) * 30}px) scaleX(${0.6 + 0.4 * o})`, whiteSpace: 'nowrap' }}>
    {children}
  </div>
);

// ---------- scene 1: "what if…" ----------

const Opening: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 112) return null;
  const write = ip(f, 16, 70, 0, 1, Easing.inOut(Easing.quad));
  const underline = ip(f, 66, 84, 0, 1, Easing.inOut(Easing.cubic));
  const rush = ip(f, 88, 112, 1, 9, easeIn);
  const penIn = ip(f, 0, 18, 1, 0, ease);
  const penOut = ip(f, 82, 100, 0, 1, easeIn);
  const penX = ip(f, 66, 84, 0, 1, Easing.inOut(Easing.cubic)); // rides the underline back to the right
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `scale(${rush})`, opacity: ip(f, 98, 112, 1, 0, Easing.linear), filter: `blur(${ip(f, 94, 112, 0, 14)}px)` }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Eyebrow style={{ opacity: ip(f, 22, 42, 0, 1), letterSpacing: `${ip(f, 22, 50, 0.5, 0.22)}em`, marginBottom: 10, fontSize: 22 }}>Every good idea starts with a</Eyebrow>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'Hand', fontSize: 250, lineHeight: 1.15, color: C.cream, whiteSpace: 'nowrap', clipPath: `inset(-30% ${(1 - write) * 100}% -30% 0)`, padding: '0 20px' }}>what if…</div>
          <div style={{ position: 'absolute', right: 20, bottom: 6, height: 10, borderRadius: 10, background: C.yellow, width: `calc(${underline} * (100% - 40px))`, transform: 'rotate(-0.8deg)' }} />
          <div style={{ position: 'absolute', left: `${(f < 66 ? write : 1 - penX * 0.94) * 100}%`, top: f < 66 ? `${58 + Math.sin(f * 0.9) * 9}%` : `calc(100% - 4px)`, transform: `translate(${penIn * 700 + penOut * 900}px, ${penIn * 500 + penOut * 600}px)` }}>
            <Pencil x={0} y={0} size={300} rot={Math.sin(f * 0.45) * 4} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scenes 2 + 3: the name becomes the site, then the homepage tour ----------

const STOPS = [0, 1180, 3480, 4840, 6440, 7790, PAGE.index.h - 1125];
const SECTIONS = [
  ['00', 'Welcome to my little corner of the internet'],
  ['01', 'The good stuff'],
  ['02', 'How a good idea grows'],
  ['03', 'Behind the pixels'],
  ['04', 'What I bring to the table'],
  ['05', 'Serious about play'],
  ['06', 'Something good starts with a hello'],
];
const SCROLL_START = 160, SEG = 28, MOVE = 18;
const homeScroll = (l: number) => {
  for (let i = 0; i < 6; i++) {
    const t0 = SCROLL_START + i * SEG;
    if (l < t0) return STOPS[i];
    if (l < t0 + MOVE) return interpolate(l, [t0, t0 + MOVE], [STOPS[i], STOPS[i + 1]], { easing: easeIO });
  }
  return STOPS[6];
};

const Home: React.FC = () => {
  const frame = useCurrentFrame();
  const l = frame - 100;
  if (l < 0 || l > 352) return null;

  // camera: huge (title fills screen) -> framed browser -> shifted left for the tour -> tucked into the folder
  const K = 1.85;
  const zoom = ip(l, 52, 102, K, 1, easeIO);
  const toTour = ip(l, 138, 160, 0, 1, easeIO);
  const exit = ip(l, 326, 350, 0, 1, easeIn);
  const wA = 1440, wB = 1325;
  const w = interpolate(toTour, [0, 1], [wA, wB]);
  const h = w * VIEW_RATIO + barH(w);
  let cx = interpolate(toTour, [0, 1], [960, 80 + wB / 2]);
  let cy = 540 + 22 * zoom;
  const punch = ip(l, 262, 272, 1, 1.06) * ip(l, 280, 290, 1, 1 / 1.06);
  let scale = zoom * punch;
  cx = interpolate(exit, [0, 1], [cx, 960]);
  cy = interpolate(exit, [0, 1], [cy, 700]);
  scale = interpolate(exit, [0, 1], [scale, 0.26]);
  const chrome = ip(l, 82, 104, 0, 1);
  const shotIn = ip(l, 46, 62, 0, 1, Easing.linear);
  const scroll = homeScroll(l);

  // pencil traces the frame outline (state A rectangle, 12px outside)
  const pad = 12;
  const rx0 = 960 - wA / 2 - pad, ry0 = 540 + 22 - (wA * VIEW_RATIO + barH(wA)) / 2 - pad;
  const rw = wA + pad * 2, rh = wA * VIEW_RATIO + barH(wA) + pad * 2;
  const per = 2 * (rw + rh);
  const trace = ip(l, 96, 140, 0, 1, Easing.inOut(Easing.quad));
  const d = trace * per;
  const tip = d < rw ? [rx0 + d, ry0] : d < rw + rh ? [rx0 + rw, ry0 + d - rw] : d < 2 * rw + rh ? [rx0 + rw - (d - rw - rh), ry0 + rh] : [rx0, ry0 + rh - (d - 2 * rw - rh)];
  const penVis = ip(l, 90, 98, 0, 1) * ip(l, 140, 150, 1, 0);
  const lineVis = ip(l, 140, 152, 1, 0);

  // right column: ruler + section counter
  const colO = ip(l, 146, 166, 0, 1) * ip(l, 318, 332, 1, 0);
  let idx = 0;
  for (let i = 1; i <= 6; i++) if (l >= SCROLL_START + (i - 1) * SEG + MOVE / 2) idx = i;
  const tChange = idx === 0 ? 146 : SCROLL_START + (idx - 1) * SEG + MOVE / 2;
  const q = ip(l, tChange, tChange + 12, 0, 1);
  const progress = scroll / STOPS[6];

  // messy paper ball rolls through "A little messy." (section 02)
  const pb = l - 200;
  const paperX = ip(pb, 0, 14, 1560, 1300, Easing.linear) + ip(pb, 14, 44, 0, -1700, Easing.in(Easing.quad));
  const paperY = pb < 12 ? ip(pb, 0, 12, -120, 900, Easing.in(Easing.quad)) : pb < 24 ? 900 - Math.sin(((pb - 12) / 12) * Math.PI) * 150 : 900 - Math.abs(Math.sin(((pb - 24) / 10) * Math.PI)) * 40 * ip(pb, 24, 44, 1, 0);

  // glasses sweep across "Small detail energy." (section 04)
  const gl = ip(l, 246, 300, 0, 1, Easing.inOut(Easing.sin));

  return (
    <AbsoluteFill>
      {/* the frame */}
      <div style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${scale})`, width: w, height: h, opacity: ip(l, 344, 350, 1, 0, Easing.linear) }}>
        <div style={{ opacity: shotIn }}>
          <Browser page="index" w={w} h={h} scroll={scroll} chrome={chrome} />
        </div>
      </div>

      {/* big stamped wordmark that dissolves into the site's real hero */}
      {l < 66 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: ip(l, 50, 64, 1, 0, Easing.linear) }}>
          <div style={{ position: 'absolute', left: 960 - 8 * zoom, top: 540 - 52 * zoom, transform: `translate(-50%,-50%) scale(${zoom / 1.78})` }}>
            <Wordmark f={l} size={424} />
          </div>
          <div style={{ position: 'absolute', left: 960, top: 540 + 97 * zoom, transform: `translate(-50%,-50%) scale(${zoom / 1.78})` }}>
            <Tag o={ip(l, 28, 42, 0, 1)} size={25}>UI/UX Designer & Creative Thinker</Tag>
          </div>
        </AbsoluteFill>
      )}

      {/* sketched outline */}
      {l > 90 && lineVis > 0 && (
        <svg style={{ position: 'absolute', inset: 0, opacity: lineVis }} width={1920} height={1080}>
          <rect x={rx0} y={ry0} width={rw} height={rh} rx={22} fill="none" stroke={C.cream} strokeWidth={3} strokeDasharray={`${d} ${per}`} strokeLinecap="round" opacity={0.85} />
        </svg>
      )}
      {penVis > 0 && <Pencil x={tip[0]} y={tip[1]} size={240} rot={-8 + Math.sin(l * 0.5) * 3} opacity={penVis} />}

      {/* ruler + section counter */}
      {colO > 0 && (
        <div style={{ position: 'absolute', left: 1450, top: 0, width: 440, height: 1080, opacity: colO, transform: `translateX(${(1 - colO) * 60}px)` }}>
          <Eyebrow style={{ position: 'absolute', top: 108, left: 60, fontSize: 15, opacity: 0.7 }}>Scroll to look around</Eyebrow>
          <svg style={{ position: 'absolute', left: 0, top: 150 }} width={50} height={780}>
            <line x1={2} y1={0} x2={2} y2={760} stroke={C.cream} strokeOpacity={0.35} strokeWidth={2} />
            {Array.from({ length: 39 }).map((_, i) => (
              <line key={i} x1={2} y1={i * 20} x2={i % 5 === 0 ? 30 : 14} y2={i * 20} stroke={C.cream} strokeOpacity={i % 5 === 0 ? 0.7 : 0.35} strokeWidth={2} />
            ))}
            <g transform={`translate(0 ${progress * 760})`}>
              <line x1={0} y1={0} x2={46} y2={0} stroke={C.pink} strokeWidth={4} />
              <circle cx={46} cy={0} r={7} fill={C.pink} />
            </g>
          </svg>
          {[idx, idx - 1].map((i, n) =>
            i < 0 ? null : (
              <div key={`${i}-${n}`} style={{ position: 'absolute', left: 70, top: 300, width: 350, opacity: n === 0 ? q : 1 - q, transform: `translateY(${n === 0 ? (1 - q) * 70 : -q * 70}px)` }}>
                <div style={{ fontFamily: 'Bookman', fontStyle: 'italic', fontWeight: 700, fontSize: 190, lineHeight: 1, color: C.cream, textShadow: `0 8px 0 ${C.shadow}` }}>{SECTIONS[i][0]}</div>
                <div style={{ width: 60, height: 3, background: C.pink, margin: '26px 0 22px' }} />
                <Eyebrow style={{ fontSize: 22, lineHeight: 1.45 }}>{SECTIONS[i][1]}</Eyebrow>
              </div>
            ),
          )}
          <Eyebrow style={{ position: 'absolute', bottom: 120, left: 60, fontSize: 15, opacity: 0.7 }}>Portfolio / 2026</Eyebrow>
        </div>
      )}

      {pb > 0 && pb < 46 && <Prop name="paper" x={paperX} y={paperY} size={200} rot={pb * -14} />}
      {gl > 0 && gl < 1 && <Prop name="glasses" x={interpolate(gl, [0, 1], [-250, 2150])} y={interpolate(gl, [0, 1], [980, 180]) - Math.sin(gl * Math.PI) * 180} size={440} rot={interpolate(gl, [0, 1], [-24, 18])} />}
    </AbsoluteFill>
  );
};

// ---------- scene 4: the folder releases the case studies ----------

const PROJECTS: { key: PageKey; name: string; tags: string; x: number; rot: number }[] = [
  { key: 'forme', name: 'FORME', tags: 'E-commerce · Art direction', x: 420, rot: -6 },
  { key: 'sonar', name: 'SONAR', tags: 'Digital experience · Motion', x: 960, rot: 1.5 },
  { key: 'daylight', name: 'Daylight', tags: 'Product design · Design system', x: 1500, rot: 6.5 },
];
const CARD_W = 480, CARD_H = 600, CARD_Y = 505;

const ProjectsLayer: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const g = frame;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 44, width: '100%', textAlign: 'center', opacity: ip(g, 478, 496, 0, 1), transform: `translateY(${ip(g, 478, 496, 30, 0)}px)` }}>
        <div style={{ fontFamily: 'Studio', fontSize: 64, letterSpacing: '-.05em', color: C.cream, lineHeight: 1 }}>
          Some things I’ve <Em>put my heart into.</Em>
        </div>
      </div>
      {PROJECTS.map((p, i) => {
        const s = spring({ frame: g - 452 - i * 5, fps, config: { damping: 14, stiffness: 110, mass: 0.9 } });
        const x = interpolate(s, [0, 1], [960, p.x]);
        const y = interpolate(s, [0, 1], [720, CARD_Y]);
        const sc = interpolate(s, [0, 1], [0.25, 1]);
        const scroll = ip(g, 486 + i * 4, 596, 0, 1500, easeIO);
        const lab = ip(g, 488 + i * 5, 506 + i * 5, 0, 1);
        return (
          <div key={p.key} style={{ position: 'absolute', left: x, top: y, width: CARD_W, height: CARD_H, transform: `translate(-50%,-50%) scale(${sc}) rotate(${interpolate(s, [0, 1], [-p.rot * 3, p.rot])}deg)` }}>
            <div style={{ position: 'absolute', inset: -14, background: C.cream, boxShadow: '0 30px 60px rgba(3,18,12,.5)' }} />
            <Browser page={p.key} w={CARD_W} h={CARD_H - 10} scroll={scroll} style={{ borderRadius: 4, boxShadow: 'none' }} />
            <div style={{ position: 'absolute', top: CARD_H + 26, left: 0, width: CARD_W, display: 'flex', alignItems: 'baseline', gap: 16, opacity: lab, transform: `translateY(${(1 - lab) * 20}px)` }}>
              <span style={{ fontFamily: 'Bookman', fontStyle: 'italic', fontWeight: 700, fontSize: 44, color: C.pink }}>0{i + 1}</span>
              <span style={{ fontFamily: 'Studio', fontWeight: 700, fontSize: 34, color: C.cream, letterSpacing: '-.02em' }}>{p.name}</span>
              <Eyebrow style={{ fontSize: 14, opacity: 0.75, marginLeft: 'auto' }}>{p.tags}</Eyebrow>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Projects: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < 405 || frame > 700) return null;
  // folder slides in during the last homepage stop; the homepage drops into it; the case studies burst out
  const fIn = spring({ frame: frame - 405, fps, config: { damping: 15, stiffness: 90 } });
  const bump = frame > 446 ? Math.sin(ip(frame, 446, 460, 0, Math.PI, Easing.linear)) * 0.07 : 0;
  const fOut = ip(frame, 466, 500, 0, 1, easeIn);
  const clip = spring({ frame: frame - 520, fps, config: { damping: 10, stiffness: 140 } });

  // scissors cut: halves carry their own mat so the next scene is hidden until the cut opens
  const split = ip(frame, 644, 690, 0, 620, Easing.inOut(Easing.cubic));
  const content = (
    <>
      <ProjectsLayer frame={frame} />
      {frame > 515 && <Prop name="clip" x={1010} y={interpolate(clip, [0, 1], [-260, CARD_Y - CARD_H / 2 - 34])} size={150} rot={interpolate(clip, [0, 1], [-60, 8])} />}
    </>
  );
  const half = (top: boolean) => (
    <AbsoluteFill style={{ filter: `drop-shadow(0 ${top ? 30 : -30}px 30px rgba(0,0,0,.5))` }}>
      <AbsoluteFill style={{ clipPath: top ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)', transform: `translateY(${top ? -split : split}px) rotate(${(top ? -1 : 1) * split * 0.004}deg)` }}>
        <AbsoluteFill style={matStyle(frame)} />
        {content}
      </AbsoluteFill>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {frame > 600 ? (
        <>
          {half(true)}
          {half(false)}
        </>
      ) : (
        content
      )}
      {fOut < 1 && <Prop name="folder" x={interpolate(fIn, [0, 1], [2300, 960])} y={700 + fOut * 800} size={580} rot={interpolate(fIn, [0, 1], [40, -3]) + fOut * 25} scale={1 + bump} />}
    </AbsoluteFill>
  );
};

// ---------- scene 5: scissors ----------

const Scissors: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 598 || frame > 660) return null;
  const x = ip(frame, 600, 652, -260, 2200, Easing.inOut(Easing.sin));
  const snip = Math.sin(frame * 1.5) * 8;
  return (
    <AbsoluteFill>
      <svg style={{ position: 'absolute', inset: 0 }} width={1920} height={1080}>
        <line x1={0} y1={540} x2={Math.max(0, x)} y2={540} stroke={C.cream} strokeWidth={3} strokeDasharray="14 12" opacity={ip(frame, 640, 650, 0.9, 0)} />
      </svg>
      <Prop name="scissors" x={x + 70} y={540} size={300} rot={42 + snip} />
    </AbsoluteFill>
  );
};

// ---------- scenes 5b + 6: work & about, then all six pages on one thread ----------

const TILES: PageKey[] = ['index', 'work', 'about', 'forme', 'sonar', 'daylight'];
const TILE_NAMES = ['Home', 'Work', 'About', 'FORME', 'SONAR', 'Daylight'];
const TW = 262, TH = 700, TY = 585;
const tileX = (i: number) => 960 + (i - 2.5) * 292;
const threadY = (x: number) => 178 + Math.sin(((x - 90) / 1740) * Math.PI * 5) * 16;
const THREAD = Array.from({ length: 121 }, (_, i) => { const x = 90 + (i / 120) * 1740; return [x, threadY(x)]; });
const THREAD_LEN = THREAD.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - THREAD[i - 1][0], p[1] - THREAD[i - 1][1]) : 0), 0);

const Pages: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = frame;
  if (g < 640 || g > 830) return null;
  const morph = ip(g, 710, 740, 0, 1, easeIO);
  const tilt = ip(g, 716, 768, 0, 1, easeIO);
  const draw = ip(g, 742, 786, 0, 1, Easing.inOut(Easing.quad));
  const n = Math.round(draw * 120);
  const tipP = THREAD[n];
  const headO = ip(g, 750, 768, 0, 1) * ip(g, 800, 812, 1, 0);
  const threadO = ip(g, 798, 812, 1, 0);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ perspective: 2200 }}>
        <AbsoluteFill style={{ transform: `rotateX(${tilt * 12}deg) rotateZ(${tilt * -2}deg) scale(${1 - tilt * 0.04})`, transformOrigin: '50% 60%' }}>
          {TILES.map((p, i) => {
            const isPair = i === 1 || i === 2;
            let x = tileX(i), y = TY, w = TW, h = TH, rot = 0, o = 1;
            const tileScroll = ip(g, 738 + i * 3, 812, 0, maxScroll(p, TW, TH), easeIO);
            let scroll = tileScroll;
            if (isPair) {
              const ax = i === 1 ? 510 : 1410;
              const aScroll = ip(g, 652, 712, 0, maxScroll(p, 840, 880), easeIO);
              x = interpolate(morph, [0, 1], [ax, tileX(i)]);
              y = interpolate(morph, [0, 1], [540, TY]);
              w = interpolate(morph, [0, 1], [840, TW]);
              h = interpolate(morph, [0, 1], [880, TH]);
              scroll = g < 740 ? interpolate(morph, [0, 1], [aScroll, 0]) : tileScroll;
            } else {
              const s = spring({ frame: g - 714 - Math.abs(i - 2.5) * 4, fps, config: { damping: 15, stiffness: 100 } });
              y = interpolate(s, [0, 1], [TY + 900, TY]);
              rot = (1 - s) * (i < 3 ? -18 : 18);
              o = g < 714 ? 0 : 1;
            }
            const drop = ip(g, 800 + i * 3, 824 + i * 3, 0, 1, easeIn);
            y += drop * 1000;
            rot += drop * (i % 2 ? 10 : -10);
            const tagO = isPair ? ip(g, 656, 672, 0, 1) * ip(g, 706, 716, 1, 0) : 0;
            const labO = ip(g, 748 + i * 4, 762 + i * 4, 0, 1) * threadO;
            return (
              <React.Fragment key={p}>
                <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${rot}deg)`, opacity: o }}>
                  <Browser page={p} w={w} h={h} scroll={scroll} />
                  {tagO > 0 && (
                    <div style={{ position: 'absolute', left: -24, top: -26 }}>
                      <Tag o={tagO} size={24}>{i === 1 ? '/work — A few good what ifs' : '/about — Curiosity first'}</Tag>
                    </div>
                  )}
                </div>
                {labO > 0 && (
                  <>
                    <div style={{ position: 'absolute', left: tileX(i) - 9, top: threadY(tileX(i)) - 9, width: 18, height: 18, borderRadius: 9, background: C.pink, opacity: labO, transform: `scale(${labO})` }} />
                    <Eyebrow style={{ position: 'absolute', left: tileX(i) - 150, width: 300, textAlign: 'center', top: 118, fontSize: 17, opacity: labO }}>{TILE_NAMES[i]}</Eyebrow>
                  </>
                )}
              </React.Fragment>
            );
          })}
          {draw > 0 && (
            <svg style={{ position: 'absolute', inset: 0, opacity: threadO }} width={1920} height={1080}>
              <polyline points={THREAD.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.cream} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={`${draw * THREAD_LEN} ${THREAD_LEN}`} />
            </svg>
          )}
          {draw > 0 && threadO > 0 && <Pencil x={tipP[0]} y={tipP[1]} size={230} rot={Math.sin(g * 0.5) * 4} opacity={ip(g, 742, 748, 0, 1) * ip(g, 786, 798, 1, 0)} />}
        </AbsoluteFill>
      </AbsoluteFill>
      <div style={{ position: 'absolute', bottom: 34, width: '100%', textAlign: 'center', opacity: headO, transform: `translateY(${(1 - headO) * 24}px)`, fontFamily: 'Studio', fontSize: 58, letterSpacing: '-.05em', color: C.cream }}>
        Six pages. <Em>One thread.</Em>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene 7: end card ----------

const End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = frame - 800;
  if (e < 0) return null;
  const tagO = ip(e, 40, 54, 0, 1);
  const line1 = ip(e, 46, 60, 0, 1);
  const line2 = ip(e, 50, 64, 0, 1);
  const under = ip(e, 58, 76, 0, 1, Easing.inOut(Easing.cubic));
  const note = spring({ frame: e - 52, fps, config: { damping: 12, stiffness: 120 } });
  const penO = ip(e, 54, 58, 0, 1) * ip(e, 76, 84, 1, 0);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 170 }}>
        <Eyebrow style={{ opacity: ip(e, 30, 44, 0, 1), letterSpacing: `${ip(e, 30, 56, 0.5, 0.2)}em`, fontSize: 20 }}>Welcome to my little corner of the internet</Eyebrow>
        <div style={{ marginTop: 10, transform: 'translateX(-20px)' }}>
          <Wordmark f={e - 16} size={250} stagger={3} />
        </div>
        <div style={{ marginTop: 8 }}>
          <Tag o={tagO} size={24}>UI/UX Designer & Creative Thinker</Tag>
        </div>
        <div style={{ marginTop: 40, fontFamily: 'Studio', fontSize: 56, lineHeight: 1.12, letterSpacing: '-.045em', color: C.cream, textAlign: 'center' }}>
          <div style={{ opacity: line1, transform: `translateY(${(1 - line1) * 24}px)` }}>
            I turn <Em>“what if”</Em> into
          </div>
          <div style={{ position: 'relative', display: 'inline-block', opacity: line2, transform: `translateY(${(1 - line2) * 24}px)` }}>
            things people love to use.
            <div style={{ position: 'absolute', left: 0, bottom: -12, height: 7, borderRadius: 7, background: C.yellow, width: `${under * 100}%`, transform: 'rotate(-0.6deg)' }} />
            {penO > 0 && (
              <div style={{ position: 'absolute', left: `${under * 100}%`, top: '100%' }}>
                <Pencil x={0} y={4} size={200} opacity={penO} rot={Math.sin(e * 0.6) * 4} />
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 1560, top: 820, width: 300, height: 250, background: C.yellow, color: C.ink, padding: '34px 30px', boxShadow: '0 24px 40px rgba(3,18,12,.45)', transform: `translate(-50%,-50%) translateY(${(1 - note) * 500}px) rotate(${interpolate(note, [0, 1], [30, 6])}deg)` }}>
        <div style={{ position: 'absolute', top: -18, left: 95, width: 110, height: 36, background: 'rgba(246,241,222,.55)', transform: 'rotate(-4deg)' }} />
        <div style={{ fontFamily: 'Studio', fontWeight: 700, fontSize: 15, letterSpacing: '.12em' }}>A NOTE TO SELF</div>
        <div style={{ fontFamily: 'Hand', fontSize: 80, lineHeight: 1, marginTop: 18 }}>Now live.</div>
        <div style={{ fontFamily: 'Studio', fontWeight: 700, fontSize: 15, letterSpacing: '.12em', marginTop: 22 }}>PORTFOLIO / 2026</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- composition ----------

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay', opacity: 0.22 }}>
      <svg width={1920} height={1080}>
        <filter id="n">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(random(`g${Math.floor(frame / 2)}`) * 1000)} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Launch: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = ip(frame, 0, 56, 0, 160, Easing.out(Easing.cubic));
  const fadeIn = ip(frame, 0, 10, 0, 1, Easing.linear);
  return (
    <AbsoluteFill style={{ background: '#07140f' }}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <AbsoluteFill style={{ background: C.green, maskImage: `radial-gradient(circle at 50% 50%, #000 ${reveal * 0.55}%, transparent ${reveal * 0.55 + 18}%)`, WebkitMaskImage: `radial-gradient(circle at 50% 50%, #000 ${reveal * 0.55}%, transparent ${reveal * 0.55 + 18}%)` }} />
        <AbsoluteFill style={{ ...matStyle(frame), backgroundColor: 'transparent', maskImage: `radial-gradient(circle at 50% 50%, #000 ${reveal * 0.5}%, transparent ${reveal * 0.5 + 6}%)`, WebkitMaskImage: `radial-gradient(circle at 50% 50%, #000 ${reveal * 0.5}%, transparent ${reveal * 0.5 + 6}%)` }} />
        <Opening />
        <Home />
        <Pages />
        <Projects />
        <Scissors />
        <End />
      </AbsoluteFill>
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 260px rgba(4,22,16,.75)', pointerEvents: 'none' }} />
      <Grain />
    </AbsoluteFill>
  );
};
