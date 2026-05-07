import { createAudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";

const SAMPLE_RATE = 24_000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

export class StreamingAudioPlayer {
  private chunks: Uint8Array[] = [];
  private bytesTotal = 0;

  append(chunk: Uint8Array): void {
    this.chunks.push(chunk);
    this.bytesTotal += chunk.byteLength;
  }

  async finishAndPlay(): Promise<void> {
    if (this.bytesTotal === 0) return;

    const pcm = concat(this.chunks, this.bytesTotal);
    const wav = wrapAsWav(pcm);
    const path = `${Paths.cache.uri}sam-reply-${Date.now()}.wav`;
    const file = new File(path);
    file.create();
    file.write(wav);

    const player = createAudioPlayer(path);
    player.play();

    return new Promise((resolve) => {
      const sub = player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) {
          sub.remove();
          player.release();
          resolve();
        }
      });
    });
  }

  reset(): void {
    this.chunks = [];
    this.bytesTotal = 0;
  }
}

function concat(parts: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.byteLength;
  }
  return out;
}

function wrapAsWav(pcm: Uint8Array): Uint8Array {
  const byteRate = (SAMPLE_RATE * CHANNELS * BITS_PER_SAMPLE) / 8;
  const blockAlign = (CHANNELS * BITS_PER_SAMPLE) / 8;
  const dataSize = pcm.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, CHANNELS, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const out = new Uint8Array(buffer);
  out.set(pcm, 44);
  return out;
}

function writeString(view: DataView, offset: number, s: string): void {
  for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
}
