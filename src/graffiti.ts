export {};
const canvas = document.getElementById("graffiti-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const colorInput = document.getElementById("paint-color") as HTMLInputElement;
const brushInput = document.getElementById("brush-size") as HTMLInputElement;
const soundButton = document.getElementById("spray-sound") as HTMLButtonElement;
const carriage = new Image();
carriage.src = new URL("../train.svg", import.meta.url).href;
await carriage.decode();

// Match the SVG carriage body, excluding the platform, rails and coupling.
const trainMask = new Path2D();
trainMask.roundRect(28.24, 129.1, 915.72, 151.7, 9);
const onTrain = (p: Point) => ctx.isPointInPath(trainMask, p.x, p.y);
type Point = { x: number; y: number };
type Drip = {
  x: number;
  y: number;
  length: number;
  target: number;
  width: number;
  color: string;
};
let drips: Drip[] = [];
let basePixels: ImageData;
let pointer: number | null = null;
let point: Point = { x: 0, y: 0 };
let lastPoint: Point | null = null;
let frame = 0,
  lastTime = 0,
  dwell = 0,
  dripBudget = 0;
let soundEnabled = true;
let audio: AudioContext | undefined;
let hissGain: GainNode | undefined;
let hissing = false;

function initSound() {
  if (!soundEnabled) return;
  try {
    if (!audio) {
      audio = new AudioContext();
      const noise = audio.createBuffer(
        1,
        audio.sampleRate * 2,
        audio.sampleRate,
      );
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const source = audio.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      const filter = audio.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 3600;
      filter.Q.value = 0.7;
      hissGain = audio.createGain();
      hissGain.gain.value = 0;
      source.connect(filter).connect(hissGain).connect(audio.destination);
      source.start();
    }
    void audio.resume().catch(() => {});
  } catch {
    soundEnabled = false;
    soundButton.textContent = "Sound unavailable";
    soundButton.disabled = true;
  }
}
function setHiss(active: boolean) {
  const next = active && soundEnabled;
  if (next === hissing) return;
  hissing = next;
  if (audio && hissGain) {
    hissGain.gain.cancelScheduledValues(audio.currentTime);
    hissGain.gain.setTargetAtTime(next ? 0.15 : 0, audio.currentTime, 0.025);
  }
}
function drawTrainBase() {
  ctx.reset();
  ctx.fillStyle = "#d4d3cc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#b8bab4";
  ctx.lineWidth = 1;
  for (let y = 0; y < canvas.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#b1b3b0";
  ctx.fillRect(0, 285, canvas.width, 135);
  ctx.fillStyle = "#646d6d";
  ctx.fillRect(0, 298, canvas.width, 12);
  ctx.fillRect(0, 325, canvas.width, 7);
  ctx.fillStyle = "#343f40";
  for (let x = 25; x < canvas.width; x += 95) ctx.fillRect(x, 300, 13, 65);
  ctx.drawImage(carriage, 22, 125, 936, 164);
  ctx.fillStyle = "#56585f";
  ctx.font = "12px monospace";
  ctx.fillText("7TAC / QUEENS PLATFORM / OPEN CANVAS", 24, 35);
  canvas.dataset.ready = "true";
}
function spray(p: Point, amount: number) {
  const radius = Number(brushInput.value) * 2 + 3;
  ctx.fillStyle = colorInput.value;
  for (let i = 0; i < amount; i++) {
    // More pigment at the center, irregular fine droplets at the feathered edge.
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.pow(Math.random(), 0.75) * radius;
    const size = 0.35 + Math.random() * 0.8;
    ctx.globalAlpha =
      (0.12 + Math.random() * 0.32) * (1 - (distance / radius) * 0.65);
    ctx.beginPath();
    ctx.arc(
      p.x + Math.cos(angle) * distance,
      p.y + Math.sin(angle) * distance,
      size,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function tick(time: number) {
  frame = 0;
  const dt = Math.min(40, lastTime ? time - lastTime : 16);
  lastTime = time;
  const painting = pointer !== null && onTrain(point);
  setHiss(painting);
  ctx.save();
  ctx.clip(trainMask);
  if (painting) {
    const distance = lastPoint
      ? Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y)
      : 0;
    const steps = Math.max(1, Math.ceil(distance / 4));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      spray(
        lastPoint
          ? {
              x: lastPoint.x + (point.x - lastPoint.x) * t,
              y: lastPoint.y + (point.y - lastPoint.y) * t,
            }
          : point,
        Math.max(10, Math.round((55 * dt) / 16 / steps)),
      );
    }
    dwell = distance < 5 ? dwell + dt : Math.max(0, dwell - dt * 2);
    dripBudget += dt;
    if (dwell > 180 && dripBudget > 150) {
      drips.push({
        x: point.x + (Math.random() - 0.5) * Number(brushInput.value),
        y: point.y + 3,
        length: 0,
        target: 5 + Math.random() * 14,
        width: 0.6 + Math.random() * 0.8,
        color: colorInput.value,
      });
      dripBudget = 0;
    }
    lastPoint = { ...point };
  } else {
    lastPoint = null;
    dwell = 0;
  }
  drips = drips.filter((drip) => {
    const previous = drip.length;
    drip.length = Math.min(drip.target, previous + dt * 0.018);
    ctx.strokeStyle = drip.color;
    ctx.lineWidth = drip.width;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(drip.x, drip.y + previous);
    ctx.lineTo(drip.x, drip.y + drip.length);
    ctx.stroke();
    return drip.length < drip.target;
  });
  ctx.restore();
  if (pointer !== null || drips.length) frame = requestAnimationFrame(tick);
  else lastTime = 0;
}
function getPoint(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}
function end() {
  const old = pointer;
  pointer = null;
  lastPoint = null;
  dwell = 0;
  dripBudget = 0;
  setHiss(false);
  if (old !== null && canvas.hasPointerCapture(old))
    canvas.releasePointerCapture(old);
}
canvas.addEventListener("pointerdown", (event) => {
  if (pointer !== null || !event.isPrimary || event.button !== 0) return;
  point = getPoint(event);
  if (!onTrain(point)) return;
  event.preventDefault();
  pointer = event.pointerId;
  canvas.setPointerCapture(pointer);
  initSound();
  lastPoint = null;
  dwell = 0;
  if (!frame) frame = requestAnimationFrame(tick);
});
canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== pointer) return;
  point = getPoint(event);
  if (!onTrain(point)) {
    setHiss(false);
    lastPoint = null;
  }
});
canvas.addEventListener("pointerup", end);
canvas.addEventListener("pointercancel", end);
canvas.addEventListener("lostpointercapture", end);
window.addEventListener("blur", end);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) end();
});
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  setHiss(false);
  soundButton.setAttribute("aria-pressed", String(!soundEnabled));
  soundButton.textContent = soundEnabled
    ? "Mute spray sound"
    : "Enable spray sound";
});
document.getElementById("clear-canvas")!.addEventListener("click", () => {
  end();
  cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  drips = [];
  ctx.reset();
  ctx.putImageData(basePixels, 0, 0);
});
document
  .getElementById("download-canvas")!
  .addEventListener("click", async () => {
    end();
    const output = document.createElement("canvas");
    output.width = canvas.width;
    output.height = canvas.height;
    const exportCtx = output.getContext("2d")!;
    exportCtx.drawImage(canvas, 0, 0);
    // Load the digital face explicitly; keep a compact monospace fallback offline.
    await document.fonts.load('600 13px "Chakra Petch"').catch(() => {});
    exportCtx.font = '600 13px "Chakra Petch", monospace';
    exportCtx.fillStyle = "rgba(53,56,65,.78)";
    exportCtx.textAlign = "right";
    exportCtx.fillText(
      "7TAC / BASED IN THE ESSENCE",
      canvas.width - 22,
      canvas.height - 20,
    );
    const link = document.createElement("a");
    link.download = "7tac-graffiti-train.png";
    link.href = output.toDataURL("image/png");
    link.click();
  });
drawTrainBase();
basePixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
