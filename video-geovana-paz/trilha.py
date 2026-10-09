"""Trilha original do vídeo (sintetizada, sem direitos de terceiros).

Piano suave em arpejo + pad + baixo, com acordes que mudam junto com os
cortes de cena do index.html, "whoosh" leve nas transições e um brilho na
chamada final. Gera trilha.wav (48 kHz, estéreo) ao lado deste arquivo.

    python3 trilha.py
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 24.5
N = int(SR * DUR)
rng = np.random.default_rng(7)

# Cortes de cena (iguais ao roteiro do index.html) e o acorde de cada cena.
CUTS = [0.0, 3.1, 7.3, 11.6, 16.0, 20.3, DUR]
CHORDS = [  # notas MIDI: baixo + vozes
    (38, [62, 66, 69, 73, 76]),  # Dmaj9
    (35, [59, 62, 66, 69, 73]),  # Bm9
    (31, [59, 62, 66, 67, 71]),  # Gmaj7
    (33, [57, 61, 64, 69, 71]),  # Aadd9
    (31, [55, 62, 66, 69, 74]),  # Gmaj7(9)
    (38, [62, 66, 69, 73, 78]),  # Dmaj9 (resolução)
]
BPM = 84
EIGHTH = 60 / BPM / 2


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(n):
    return np.arange(n) / SR


def add(buf, start, sig, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * l
    buf[1, i:i + len(sig)] += sig * r


def piano(m, length=2.6, vel=1.0):
    t = t_axis(int(length * SR))
    f = hz(m)
    out = np.zeros_like(t)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)  # leve inarmonicidade
        if fk > 12000:
            break
        decay = 1.4 + 1.1 * k + f / 400
        out += np.sin(2 * np.pi * fk * t) * np.exp(-t * decay) / k ** 1.6
    attack = np.minimum(1, t / 0.006)
    return out * attack * vel


def pad(notes, length):
    t = t_axis(int(length * SR))
    out = np.zeros_like(t)
    for m in notes:
        for cents in (-7, 0, 7):
            f = hz(m) * 2 ** (cents / 1200)
            ph = rng.uniform(0, 2 * np.pi)
            for k, a in ((1, 1.0), (2, 0.35), (3, 0.12)):
                out += a * np.sin(2 * np.pi * f * k * t + ph * k)
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.23 * t)
    env = np.minimum(1, t / 1.3) * np.minimum(1, (length - t) / 1.4)
    return out * lfo * np.clip(env, 0, 1) / (len(notes) * 3)


def bass(m, length):
    t = t_axis(int(length * SR))
    f = hz(m)
    out = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    env = np.minimum(1, t / 0.25) * np.exp(-t * 0.25) * np.clip((length - t) / 0.8, 0, 1)
    return out * env


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):  # 1 polo, suficiente para ruído curto
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def whoosh(length=1.1, peak=0.65):
    n = int(length * SR)
    t = t_axis(n)
    noise = rng.standard_normal(n)
    hp = noise - lowpass(noise, 300)
    body = lowpass(hp, 2600)
    env = np.where(t < length * peak, (t / (length * peak)) ** 2.2,
                   np.exp(-(t - length * peak) * 9))
    return body * env


def reverb(x, secs=2.4):
    n = int(secs * SR)
    t = t_axis(n)
    out = np.zeros((2, x.shape[1] + n - 1))
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 3.2 / secs * 2.3)
        ir[: int(0.012 * SR)] = 0  # pré-delay
        ir /= np.sqrt(np.sum(ir ** 2))
        L = 1 << int(np.ceil(np.log2(x.shape[1] + n)))
        out[ch] = np.fft.irfft(np.fft.rfft(x[ch], L) * np.fft.rfft(ir, L), L)[: x.shape[1] + n - 1]
    return out[:, : x.shape[1]]


dry = np.zeros((2, N))
pads = np.zeros((2, N))

for i, (root, notes) in enumerate(CHORDS):
    a, b = CUTS[i], CUTS[i + 1]
    # pad e baixo com sobreposição para trocar de acorde suavemente
    add(pads, max(0, a - 0.5), pad(notes, (b - a) + 1.6) * 0.5)
    add(dry, a, bass(root + 12, (b - a) + 0.6) * 0.11)
    # arpejo de piano: sobe e desce pelas vozes do acorde
    order = [0, 2, 4, 1, 3, 2, 4, 1]
    k = 0
    tt = a + (0.15 if i else 0.35)
    end = b - 0.05 if i < len(CHORDS) - 1 else DUR - 2.4
    while tt < end:
        m = notes[order[k % len(order)]]
        vel = 0.9 if k % 4 == 0 else 0.62
        add(dry, tt, piano(m, vel=vel) * 0.16, pan=-0.35 if k % 2 else 0.35)
        k += 1
        tt += EIGHTH
    # nota de destaque uma oitava acima no início de cada cena
    add(dry, a + 0.02, piano(notes[-1] + 12, length=3.5, vel=0.7) * 0.11, pan=0.1)

# acorde final sustentado
for j, m in enumerate([50] + CHORDS[-1][1]):
    add(dry, DUR - 2.4 + j * 0.06, piano(m, length=2.4, vel=0.8) * 0.13, pan=-0.3 + j * 0.12)

fx = np.zeros((2, N))
for c in CUTS[1:-1]:  # whoosh chegando em cada transição
    w = whoosh()
    add(fx, c - 0.72, w * 0.05, pan=-0.2)
    add(fx, c - 0.70, w * 0.05, pan=0.2)

# "sub" macio na revelação do nome e na chamada final
for at in (0.25, 20.35):
    t = t_axis(int(1.6 * SR))
    boom = np.sin(2 * np.pi * (62 + 40 * np.exp(-t * 6)) * t) * np.exp(-t * 2.6) * np.minimum(1, t / 0.01)
    add(fx, at, boom * 0.12)

# brilho quando o botão do WhatsApp aparece
for j, m in enumerate([86, 90, 93, 97]):
    add(dry, 22.0 + j * 0.07, piano(m, length=1.8, vel=0.5) * 0.07, pan=-0.4 + j * 0.27)

mix = dry + pads * 0.9
wet = reverb(mix + fx * 0.6)
out = mix * 0.72 + wet * 0.55 + fx

# corta o subgrave (< ~45 Hz), que só ocupa espaço em caixas de celular
spec = np.fft.rfft(out, axis=1)
freqs = np.fft.rfftfreq(N, 1 / SR)
spec *= np.clip((freqs - 30) / 30, 0, 1)
out = np.fft.irfft(spec, N, axis=1)

# fade-in curto e fade-out no fim
t = t_axis(N)
out *= np.minimum(1, t / 0.08) * np.clip((DUR - t) / 1.6, 0, 1) ** 1.5

# normaliza e satura suavemente
out /= np.max(np.abs(out)) + 1e-9
out = np.tanh(out * 1.2) / np.tanh(1.2) * 0.89

pcm = (out.T * 32767).astype(np.int16)
dest = Path(__file__).with_name('trilha.wav')
with wave.open(str(dest), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('ok ->', dest)
