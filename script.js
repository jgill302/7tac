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
const nextUp = document.getElementById('next-up');
const blogPostsContainer = document.getElementById('blog-posts');

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
  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach((event) => {
      const li = document.createElement('li');
      li.textContent = `${formatDate(event.date)} — ${event.location}`;
      eventList.appendChild(li);
    });

  const upcoming = sorted.find((event) => new Date(event.date) >= new Date());
  if (upcoming) {
    nextUp.textContent = `Next up: ${formatDate(upcoming.date)} at ${upcoming.location}`;
  } else if (sorted[0]) {
    nextUp.textContent = `Recent event: ${formatDate(sorted[0].date)} at ${sorted[0].location}`;
  }
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

const blogPosts = [
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

const renderBlogPosts = () => {
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
