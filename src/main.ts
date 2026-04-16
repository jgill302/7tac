const revealEls = document.querySelectorAll<HTMLElement>('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).classList.add('in-view');
      }
    });
  },
  { threshold: 0.15 }
);

revealEls.forEach((el) => observer.observe(el));

const eventForm = document.getElementById('event-form') as HTMLFormElement | null;
const eventList = document.getElementById('event-list') as HTMLUListElement | null;
const nextUp = document.getElementById('next-up') as HTMLParagraphElement | null;
const blogPostsContainer = document.getElementById('blog-posts') as HTMLDivElement | null;

interface EventItem {
  date: string;
  location: string;
}

const eventSeed: EventItem[] = [
  { date: '2026-05-16', location: 'East Austin Warehouse • Austin, TX' },
  { date: '2026-06-20', location: 'Riverside Lot Pop-Up • Austin, TX' },
  { date: '2026-07-18', location: 'South Congress Courtyard • Austin, TX' }
];

const formatDate = (value: string): string =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const renderEvents = (events: EventItem[]): void => {
  if (!eventList || !nextUp) return;

  eventList.innerHTML = '';
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sorted.forEach((event) => {
    const li = document.createElement('li');
    li.textContent = `${formatDate(event.date)} — ${event.location}`;
    eventList.appendChild(li);
  });

  const today = new Date();
  const upcoming = sorted.find((event) => new Date(`${event.date}T00:00:00`) >= today);
  if (upcoming) {
    nextUp.textContent = `Next up: ${formatDate(upcoming.date)} at ${upcoming.location}`;
  } else if (sorted[0]) {
    nextUp.textContent = `Recent event: ${formatDate(sorted[0].date)} at ${sorted[0].location}`;
  }
};

renderEvents(eventSeed);

if (eventForm) {
  eventForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const dateInput = document.getElementById('event-date') as HTMLInputElement | null;
    const locationInput = document.getElementById('event-location') as HTMLInputElement | null;
    const date = dateInput?.value;
    const location = locationInput?.value.trim();
    if (!date || !location) return;

    eventSeed.push({ date, location });
    renderEvents(eventSeed);
    eventForm.reset();
  });
}

const fakeSubmit = (formId: string, statusId: string, message: string): void => {
  const form = document.getElementById(formId) as HTMLFormElement | null;
  const status = document.getElementById(statusId) as HTMLParagraphElement | null;
  if (!form || !status) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = message;
    form.reset();
  });
};

fakeSubmit('vendor-form', 'vendor-status', 'Vendor application received. We will reach out soon.');
fakeSubmit('contact-form', 'contact-status', 'Message sent. Thank you for connecting with 7tac.');

interface BlogPost {
  title: string;
  body: string;
  cta: string;
}

const blogPosts: BlogPost[] = [
  {
    title: 'Why Nightmarket ATX is Becoming Austin’s Third Place',
    body: 'We are building a recurring place to gather beyond work and home—where artists, dancers, and neighbors can pull up consistently and feel ownership.',
    cta: 'Join the next date'
  },
  {
    title: 'The Sound We Protect: Triphop, House, DnB, Underground',
    body: 'Our nights are curated for discovery and depth, from left-field triphop textures to deep house and dnb pressure. Come hear what algorithms miss.',
    cta: 'Hear it live'
  },
  {
    title: 'Physical Media is Back: Zines, Tapes, and Vinyl in the Market',
    body: 'Nightmarket ATX gives space to vendors carrying physical culture: rare records, DIY print, and tactile artifacts that keep scenes rooted in reality.',
    cta: 'Apply as a vendor'
  }
];

const renderBlogPosts = (): void => {
  if (!blogPostsContainer) return;

  blogPostsContainer.innerHTML = '';
  blogPosts.forEach((post) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.body}</p>
      <a class="btn ghost" href="#nightmarket">${post.cta}</a>
    `;
    blogPostsContainer.appendChild(article);
  });
};

renderBlogPosts();

const canvas = document.getElementById('graffiti-canvas') as HTMLCanvasElement | null;
const colorInput = document.getElementById('paint-color') as HTMLInputElement | null;
const brushInput = document.getElementById('brush-size') as HTMLInputElement | null;
const clearBtn = document.getElementById('clear-canvas') as HTMLButtonElement | null;
const downloadBtn = document.getElementById('download-canvas') as HTMLButtonElement | null;

if (!canvas) {
  throw new Error('Graffiti canvas not found.');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('2D context unavailable.');
}

const drawTrainBase = (): void => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#f1f3f7');
  bg.addColorStop(1, '#d8dde7');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(40, 46, 62, 0.2)';
  ctx.beginPath();
  ctx.ellipse(480, 350, 340, 42, -0.08, 0, Math.PI * 2);
  ctx.fill();

  const track = (x: number, y: number, w: number, h: number): void => {
    ctx.fillStyle = '#7f8898';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#606879';
    ctx.fillRect(x + 12, y + 10, w - 24, h - 20);
    ctx.fillStyle = '#4f5665';
    ctx.fillRect(x + 26, y + h - 16, w - 52, 8);
  };

  track(245, 286, 170, 56);
  track(655, 260, 165, 54);

  const leftFace: [number, number][] = [
    [76, 116],
    [176, 84],
    [223, 132],
    [129, 168]
  ];

  const roof: [number, number][] = [
    [176, 84],
    [806, 54],
    [906, 110],
    [223, 132]
  ];

  const side: [number, number][] = [
    [223, 132],
    [906, 110],
    [886, 242],
    [204, 282]
  ];

  ctx.fillStyle = '#d5dae3';
  ctx.beginPath();
  leftFace.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();

  const roofGrad = ctx.createLinearGradient(160, 90, 820, 130);
  roofGrad.addColorStop(0, '#eef1f6');
  roofGrad.addColorStop(1, '#cfd6e0');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  roof.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();

  const sideGrad = ctx.createLinearGradient(220, 130, 890, 250);
  sideGrad.addColorStop(0, '#e5e9f0');
  sideGrad.addColorStop(0.5, '#d6dce6');
  sideGrad.addColorStop(1, '#c2c9d4');
  ctx.fillStyle = sideGrad;
  ctx.beginPath();
  side.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#b5bdc9';
  ctx.lineWidth = 2;
  for (let i = 0; i < 15; i += 1) {
    const y = 90 + i * 2.8;
    ctx.beginPath();
    ctx.moveTo(190 + i * 1.5, y);
    ctx.lineTo(875 + i * 1.1, y + 20);
    ctx.stroke();
  }

  ctx.strokeStyle = '#a8afba';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(215, 212);
  ctx.lineTo(892, 188);
  ctx.stroke();

  const drawDoor = (x: number, y: number, w: number, h: number, skew = -20): void => {
    ctx.fillStyle = '#cdd4de';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + skew * 0.02);
    ctx.lineTo(x + w - 8, y + h);
    ctx.lineTo(x - 8, y + h - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a4acb8';
    ctx.stroke();
  };

  drawDoor(670, 136, 46, 112);
  drawDoor(720, 134, 46, 112);

  const win = (x: number, y: number, w: number, h: number): void => {
    const wg = ctx.createLinearGradient(x, y, x, y + h);
    wg.addColorStop(0, '#7f8a9c');
    wg.addColorStop(1, '#3d4554');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
  };

  win(683, 149, 16, 62);
  win(733, 146, 16, 62);
  win(136, 121, 34, 42);
  win(185, 136, 29, 33);
  win(86, 124, 30, 36);

  ctx.fillStyle = '#b56dff';
  ctx.beginPath();
  ctx.arc(316, 200, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Audiowide, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('7', 316, 201);

  ctx.strokeStyle = '#9da5b1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  leftFace.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineTo(204, 282);
  ctx.lineTo(886, 242);
  ctx.lineTo(906, 110);
  ctx.lineTo(806, 54);
  ctx.lineTo(176, 84);
  ctx.closePath();
  ctx.stroke();
};

drawTrainBase();

let drawing = false;
let lastX = 0;
let lastY = 0;

const getPoint = (event: MouseEvent | TouchEvent): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  const touch = 'touches' in event ? event.touches[0] : undefined;
  const clientX = touch ? touch.clientX : (event as MouseEvent).clientX;
  const clientY = touch ? touch.clientY : (event as MouseEvent).clientY;
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height
  };
};

const start = (event: MouseEvent | TouchEvent): void => {
  drawing = true;
  const p = getPoint(event);
  [lastX, lastY] = [p.x, p.y];
};

const move = (event: MouseEvent | TouchEvent): void => {
  if (!drawing || !colorInput || !brushInput) return;
  event.preventDefault();
  const p = getPoint(event);

  ctx.strokeStyle = colorInput.value;
  ctx.lineWidth = Number(brushInput.value);
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  [lastX, lastY] = [p.x, p.y];
};

const end = (): void => {
  drawing = false;
};

canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', move);
window.addEventListener('mouseup', end);

canvas.addEventListener('touchstart', start, { passive: false });
canvas.addEventListener('touchmove', move, { passive: false });
canvas.addEventListener('touchend', end);

clearBtn?.addEventListener('click', () => {
  drawTrainBase();
});

downloadBtn?.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportCtx = exportCanvas.getContext('2d');
  if (!exportCtx) return;

  exportCtx.drawImage(canvas, 0, 0);
  exportCtx.font = 'bold 38px Inter, sans-serif';
  exportCtx.fillStyle = 'rgba(181, 109, 255, 0.86)';
  exportCtx.textAlign = 'right';
  exportCtx.fillText('7tac • based in the essence', canvas.width - 24, canvas.height - 24);

  const link = document.createElement('a');
  link.download = '7tac-graffiti-train.png';
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
});
