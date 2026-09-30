"""Synthesised sound design for the launch video, cued to the Remotion frame timeline (60fps)."""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 885 / 60 + 0.25
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(7)
F = lambda frame: frame / 60


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, hi):
    return sosfilt(butter(2, hi, btype='low', fs=SR, output='sos'), x)


def hp(x, lo):
    return sosfilt(butter(2, lo, btype='high', fs=SR, output='sos'), x)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


def pencil(dur, speed=9.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 2500, 7500)
    strokes = 0.55 + 0.45 * np.abs(np.sin(np.pi * speed * t + 2 * np.sin(3.1 * t)))
    fade = np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.06)
    return x * strokes * fade * 0.35


def whoosh(dur, lo=300, hi=3000, peak=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    shape = shape ** (0.5 / peak)
    # sweep: blend a low band into a high band across the gesture
    a, b = bp(x, lo, lo * 3), bp(x, hi / 3, hi)
    mix = np.clip(t / dur, 0, 1)
    return (a * (1 - mix) + b * mix) * shape * 0.5


def thud(freq=70, dur=0.35, click=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1 + 1.8 * np.exp(-t / 0.025))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, dur / 4)
    tick = hp(rng.standard_normal(n), 2000) * env(n, 0.0005, 0.008) * click
    return body + tick


def snip():
    n = int(0.09 * SR)
    x = bp(rng.standard_normal(n), 3000, 11000) * env(n, 0.0005, 0.012)
    ring = np.sin(2 * np.pi * 5200 * np.arange(n) / SR) * env(n, 0.0005, 0.02) * 0.25
    return (x + ring) * 0.7


def clack():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    metal = sum(np.sin(2 * np.pi * f * t) * env(n, 0.0005, d) for f, d in [(2100, 0.05), (3400, 0.03), (5100, 0.02)])
    body = np.zeros(n)
    th = thud(180, 0.12, 0.6)
    body[:len(th)] = th
    return metal * 0.35 + body * 0.6


def ding(freq=1318.5):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * freq * k * t) * env(n, 0.002, 0.5 / k) / k for k in (1, 2.01, 3.03)) * 0.18


def paper(dur=0.18):
    n = int(dur * SR)
    return bp(rng.standard_normal(n), 800, 5000) * env(n, 0.004, dur / 3) * 0.6


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    for k in range(8):  # stepped sweep of a band-pass
        s, e = k * n // 8, (k + 1) * n // 8
        lo = 300 * 2 ** (k * 0.55)
        out[s:e] = bp(x, lo, lo * 2.2)[s:e]
    return out * (t / dur) ** 2 * 0.45


# ---------- music bed: 120bpm pulse that starts when the name stamps in ----------
BPM, beat = 120, 0.5
start, stop = F(100), F(796)


def kick():
    return thud(52, 0.45, 0.15) * 0.9


def hat():
    n = int(0.05 * SR)
    return hp(rng.standard_normal(n), 7000) * env(n, 0.0005, 0.012) * 0.22


def bass(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)
    return lp(x, 400) * env(n, 0.01, dur * 0.7) * 0.22


def pad(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.3 * t) * 0.4) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t) for f in freqs)
    fade = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8)
    return lp(x, 1800) * fade * 0.035


progression = [(65.41, [261.6, 329.6, 392.0]), (55.0, [220.0, 261.6, 329.6]), (43.65, [174.6, 220.0, 261.6]), (49.0, [196.0, 246.9, 293.7])]  # C Am F G
t, i = start, 0
while t < stop - 0.01:
    b = i % 8
    add(kick(), t, 0.8 if b % 2 == 0 else 0.55)
    add(hat(), t + beat / 2, 1, 0.3)
    if b == 0:
        root, chord = progression[(i // 8) % 4]
        add(bass(root, beat * 8), t)
        add(pad(chord, beat * 8 + 0.4), t, 1.0)
    t += beat
    i += 1
add(riser(F(100) - F(40)), F(40), 0.7)  # into the name stamp
add(riser(F(796) - F(740)), F(740), 0.6)  # into the end card

# ---------- cues ----------
add(pencil(F(70) - F(16), 8), F(16), 1.0, 0.1)
add(pencil(F(84) - F(66), 5), F(66), 0.8, 0.2)
add(whoosh(0.45, 200, 5000, 0.9), F(86), 0.9)
for k in range(7):
    add(thud(95 + k * 6, 0.22, 0.5), F(100 + 4 * k), 0.55, -0.5 + k / 6)
add(ding(), F(130), 1, 0.4)
add(whoosh(0.8, 150, 2000, 0.5), F(152), 0.7)
add(pencil(F(240) - F(196), 10), F(196), 0.8)
for k in range(6):
    add(whoosh(0.32, 400, 4000, 0.8), F(260 + 28 * k) - 0.04, 0.55, 0.3)
add(thud(120, 0.15, 0.8), F(312), 0.5, 0.6)
add(thud(120, 0.12, 0.8), F(324), 0.35, 0.4)
add(paper(0.3), F(312), 0.4, 0.5)
add(whoosh(0.9, 250, 3500, 0.6), F(346), 0.6, -0.4)
add(whoosh(0.5, 200, 2500), F(405), 0.7, 0.7)
add(thud(80, 0.3, 0.3), F(448), 0.8)
add(paper(0.2), F(448), 0.5)
for k in range(3):
    add(whoosh(0.35, 500, 5000, 0.9), F(452 + 5 * k), 0.5, -0.6 + 0.6 * k)
add(clack(), F(527), 0.9, 0.05)
for k in range(12):
    add(snip(), F(600) + k * 0.075, 0.55, -0.9 + k * 0.16)
add(paper(0.5), F(640), 0.6)
add(whoosh(0.7, 200, 3000, 0.7), F(644), 0.7)
add(whoosh(0.5, 300, 3000), F(712), 0.6)
add(pencil(F(786) - F(742), 11), F(742), 0.8)
add(whoosh(0.5, 3000, 300), F(800), 0.6)
add(thud(45, 1.2, 0.2), F(816), 1.0)  # end card impact
for k in range(7):
    add(thud(110 + k * 8, 0.18, 0.5), F(816 + 3 * k), 0.45, -0.5 + k / 6)
add(ding(1567.98), F(840), 1.1, 0.3)
add(paper(0.25), F(852), 0.6, 0.6)
add(pencil(F(876) - F(858), 6), F(858), 0.7)
add(pad([261.6, 329.6, 392.0, 523.3], DUR - F(816)), F(816), 1.4)

mix = np.stack([L, R], axis=1)
fade = np.minimum(1, (DUR - np.arange(N) / SR) / 0.35)[:, None]
mix = np.tanh(mix * 1.6) * fade
mix /= np.max(np.abs(mix)) / 0.89
wavfile.write('out/sfx.wav', SR, (mix * 32767).astype(np.int16))
print('wrote out/sfx.wav', round(DUR, 2), 's')
