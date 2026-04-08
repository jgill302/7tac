const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  },
  { threshold: 0.15 }
);

revealEls.forEach((el) => observer.observe(el));

const eventForm = document.getElementById('event-form');
const eventList = document.getElementById('event-list');

const eventSeed = [
  { date: '2026-05-16', location: 'East Austin Warehouse • Austin, TX' },
  { date: '2026-06-20', location: 'Riverside Lot Pop-Up • Austin, TX' },
  { date: '2026-07-18', location: 'South Congress Courtyard • Austin, TX' }
];

const formatDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const renderEvents = (events) => {
  eventList.innerHTML = '';
  events
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((event) => {
      const li = document.createElement('li');
      li.textContent = `${formatDate(event.date)} — ${event.location}`;
      eventList.appendChild(li);
    });
};

renderEvents(eventSeed);

eventForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const date = document.getElementById('event-date').value;
  const location = document.getElementById('event-location').value.trim();
  if (!date || !location) return;

  eventSeed.push({ date, location });
  renderEvents(eventSeed);
  eventForm.reset();
});

const fakeSubmit = (formId, statusId, message) => {
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = message;
    form.reset();
  });
};

fakeSubmit('vendor-form', 'vendor-status', 'Vendor application received. We will reach out soon.');
fakeSubmit('contact-form', 'contact-status', 'Message sent. Thank you for connecting with 7tac.');

const canvas = document.getElementById('graffiti-canvas');
const ctx = canvas.getContext('2d');
const colorInput = document.getElementById('paint-color');
const brushInput = document.getElementById('brush-size');
const clearBtn = document.getElementById('clear-canvas');
const downloadBtn = document.getElementById('download-canvas');

const drawTrainBase = () => {
  ctx.fillStyle = '#c8cfdb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#7a8190';
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

  ctx.fillStyle = '#515866';
  ctx.fillRect(40, 70, canvas.width - 80, 250);

  ctx.fillStyle = '#b56dff';
  ctx.fillRect(40, 70, canvas.width - 80, 26);

  ctx.fillStyle = '#1f2432';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(95 + i * 170, 120, 120, 95);
  }

  ctx.fillStyle = '#282e3e';
  ctx.fillRect(canvas.width / 2 - 45, 110, 90, 180);

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(170, canvas.height - 25, 32, 0, Math.PI * 2);
  ctx.arc(canvas.width - 170, canvas.height - 25, 32, 0, Math.PI * 2);
  ctx.fill();
};

drawTrainBase();

let drawing = false;
let lastX = 0;
let lastY = 0;

const getPoint = (event) => {
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches?.[0];
  const clientX = touch ? touch.clientX : event.clientX;
  const clientY = touch ? touch.clientY : event.clientY;
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height
  };
};

const start = (event) => {
  drawing = true;
  const p = getPoint(event);
  [lastX, lastY] = [p.x, p.y];
};

const move = (event) => {
  if (!drawing) return;
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

const end = () => {
  drawing = false;
};

canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', move);
window.addEventListener('mouseup', end);

canvas.addEventListener('touchstart', start, { passive: false });
canvas.addEventListener('touchmove', move, { passive: false });
canvas.addEventListener('touchend', end);

clearBtn.addEventListener('click', () => {
  drawTrainBase();
});

downloadBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportCtx = exportCanvas.getContext('2d');

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
