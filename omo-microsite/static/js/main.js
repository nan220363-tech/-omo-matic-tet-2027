'use strict';

// Responsive navigation
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');
menuToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
});
mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

// Drawing tools
const WIDTH = 600;
const HEIGHT = 700;
const base = document.getElementById('base-canvas');
const paint = document.getElementById('paint-canvas');
const baseCtx = base.getContext('2d');
const ctx = paint.getContext('2d', { willReadFrequently: true });
const garment = new Path2D();
let chosenColor = '#D92F40';
let brushSize = 12;
let tool = 'brush';
let drawing = false;
let lastPoint = null;
let history = [];

// The Path2D outline is reused as a clipping mask: strokes stay inside the dress.
garment.moveTo(264, 131);
garment.quadraticCurveTo(300, 147, 336, 131);
garment.lineTo(364, 147);
garment.quadraticCurveTo(413, 169, 435, 200);
garment.lineTo(500, 322);
garment.lineTo(452, 349);
garment.lineTo(392, 268);
garment.lineTo(419, 607);
garment.quadraticCurveTo(302, 630, 181, 607);
garment.lineTo(207, 268);
garment.lineTo(148, 348);
garment.lineTo(100, 322);
garment.lineTo(164, 200);
garment.quadraticCurveTo(190, 161, 236, 147);
garment.closePath();

function blossom(c, x, y, radius, petalColor, centerColor = '#D8A14C') {
  c.save();
  c.translate(x, y);
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5;
    c.beginPath();
    c.ellipse(Math.cos(a) * radius * .65, Math.sin(a) * radius * .65,
      radius * .61, radius * .48, a, 0, 2 * Math.PI);
    c.fillStyle = petalColor;
    c.fill();
  }
  c.beginPath(); c.arc(0, 0, radius * .26, 0, 2 * Math.PI);
  c.fillStyle = centerColor; c.fill();
  c.restore();
}

function drawTemplate() {
  const bg = baseCtx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, '#FFF9EE');
  bg.addColorStop(1, '#FBE9D9');
  baseCtx.fillStyle = bg;
  baseCtx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle spring motif and double frame around the drawing canvas.
  baseCtx.strokeStyle = '#F2D5BC'; baseCtx.lineWidth = 3;
  baseCtx.strokeRect(20, 20, 560, 660);
  baseCtx.strokeStyle = '#EDDCC7'; baseCtx.lineWidth = 1;
  baseCtx.strokeRect(28, 28, 544, 644);
  baseCtx.font = 'bold 19px Nunito, Arial, sans-serif';
  baseCtx.fillStyle = '#AD4B55';
  baseCtx.textAlign = 'center';
  baseCtx.fillText('VẼ TẾT TRAO XUÂN', 300, 65);
  baseCtx.font = '700 11px Nunito, Arial, sans-serif';
  baseCtx.fillStyle = '#A58B78';
  baseCtx.fillText('ÁO DÀI SÁNG TẠO • 2027', 300, 85);

  // Decorative floral branches positioned outside of the dress.
  baseCtx.beginPath();
  baseCtx.moveTo(30, 430);
  baseCtx.bezierCurveTo(65, 391, 70, 330, 132, 296);
  baseCtx.moveTo(56, 360);
  baseCtx.quadraticCurveTo(95, 346, 109, 316);
  baseCtx.strokeStyle = '#9B9E6B'; baseCtx.lineWidth = 4; baseCtx.stroke();
  blossom(baseCtx, 89, 348, 19, '#F3B6B3');
  blossom(baseCtx, 115, 306, 13, '#EBA09D');
  blossom(baseCtx, 49, 398, 15, '#F5C7BA');

  baseCtx.beginPath();
  baseCtx.moveTo(572, 475);
  baseCtx.bezierCurveTo(520, 423, 530, 373, 473, 342);
  baseCtx.moveTo(538, 434);
  baseCtx.quadraticCurveTo(504, 401, 479, 403);
  baseCtx.strokeStyle = '#9FA76A'; baseCtx.lineWidth = 4; baseCtx.stroke();
  blossom(baseCtx, 523, 419, 18, '#F7D28A');
  blossom(baseCtx, 489, 402, 15, '#F5CE85');
  blossom(baseCtx, 562, 472, 14, '#FFE0A1');

  baseCtx.font = '28px serif';
  baseCtx.fillStyle = '#E7B866';
  baseCtx.fillText('✧', 490, 170);
  baseCtx.fillText('✦', 107, 202);

  // Main dress body, white canvas for the user to color.
  baseCtx.save();
  baseCtx.shadowColor = 'rgba(142,51,52,.16)';
  baseCtx.shadowBlur = 27;
  baseCtx.shadowOffsetY = 12;
  baseCtx.fillStyle = '#FFFEF9';
  baseCtx.fill(garment);
  baseCtx.restore();
  baseCtx.strokeStyle = '#B5263B'; baseCtx.lineWidth = 8;
  baseCtx.lineJoin = 'round'; baseCtx.stroke(garment);

  // Collar, panel details and decorative seam lines.
  baseCtx.beginPath();
  baseCtx.moveTo(264, 131);
  baseCtx.quadraticCurveTo(278, 167, 300, 181);
  baseCtx.quadraticCurveTo(322, 167, 336, 131);
  baseCtx.strokeStyle = '#C33D4D'; baseCtx.lineWidth = 5; baseCtx.stroke();
  baseCtx.beginPath();
  baseCtx.moveTo(300, 182);
  baseCtx.quadraticCurveTo(285, 269, 298, 376);
  baseCtx.lineTo(298, 611);
  baseCtx.strokeStyle = '#F3C4B2'; baseCtx.lineWidth = 3; baseCtx.stroke();
  baseCtx.beginPath();
  baseCtx.moveTo(216, 260); baseCtx.lineTo(185, 605);
  baseCtx.moveTo(384, 260); baseCtx.lineTo(415, 605);
  baseCtx.strokeStyle = '#F6E3D4'; baseCtx.lineWidth = 2; baseCtx.stroke();

  // Bottom branding outside the dress: included in the downloaded PNG.
  baseCtx.font = '800 11px Nunito, Arial, sans-serif';
  baseCtx.fillStyle = '#B78973';
  baseCtx.fillText('Một nét vẽ nhỏ • Một mùa xuân thật lớn', 300, 660);
}

drawTemplate();

function pointFromEvent(event) {
  const r = paint.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (WIDTH / r.width),
    y: (event.clientY - r.top) * (HEIGHT / r.height)
  };
}

function applyStroke(from, to) {
  ctx.save();
  ctx.clip(garment);
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = chosenColor;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function saveHistory() {
  history.push(ctx.getImageData(0, 0, WIDTH, HEIGHT));
  if (history.length > 15) history.shift();
}
saveHistory();

paint.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  event.preventDefault();
  paint.setPointerCapture(event.pointerId);
  drawing = true;
  lastPoint = pointFromEvent(event);
  applyStroke(lastPoint, { x: lastPoint.x + .01, y: lastPoint.y + .01 });
});
paint.addEventListener('pointermove', (event) => {
  if (!drawing) return;
  event.preventDefault();
  const next = pointFromEvent(event);
  applyStroke(lastPoint, next);
  lastPoint = next;
});
function stopDrawing() {
  if (!drawing) return;
  drawing = false;
  lastPoint = null;
  saveHistory();
}
paint.addEventListener('pointerup', stopDrawing);
paint.addEventListener('pointercancel', stopDrawing);
paint.addEventListener('lostpointercapture', stopDrawing);

const brushBtn = document.getElementById('brush-btn');
const eraserBtn = document.getElementById('eraser-btn');
function setTool(nextTool) {
  tool = nextTool;
  brushBtn.classList.toggle('active', tool === 'brush');
  eraserBtn.classList.toggle('active', tool === 'eraser');
  brushBtn.setAttribute('aria-pressed', String(tool === 'brush'));
  eraserBtn.setAttribute('aria-pressed', String(tool === 'eraser'));
}
brushBtn.addEventListener('click', () => setTool('brush'));
eraserBtn.addEventListener('click', () => setTool('eraser'));
document.getElementById('undo-btn').addEventListener('click', () => {
  if (history.length < 2) return;
  history.pop();
  ctx.putImageData(history[history.length - 1], 0, 0);
});
document.getElementById('clear-btn').addEventListener('click', () => {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  history = [];
  saveHistory();
  showToast('Đã xóa nét vẽ. Bạn có thể bắt đầu lại!');
});
document.querySelectorAll('.swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    chosenColor = swatch.dataset.color;
    document.querySelectorAll('.swatch').forEach(s => {
      s.classList.remove('selected');
      s.setAttribute('aria-pressed', 'false');
    });
    swatch.classList.add('selected');
    swatch.setAttribute('aria-pressed', 'true');
    document.getElementById('custom-color').value = chosenColor;
    setTool('brush');
  });
});
document.getElementById('custom-color').addEventListener('input', event => {
  chosenColor = event.target.value;
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.remove('selected');
    s.setAttribute('aria-pressed', 'false');
  });
  setTool('brush');
});
document.getElementById('brush-size').addEventListener('input', event => {
  brushSize = Number(event.target.value);
  document.getElementById('brush-value').textContent = `${brushSize}px`;
});

// Merge the transparent paint layer and the dress template into one real PNG.
function mergedImageDataUrl() {
  const merged = document.createElement('canvas');
  merged.width = WIDTH;
  merged.height = HEIGHT;
  const outCtx = merged.getContext('2d');
  outCtx.drawImage(base, 0, 0);
  outCtx.drawImage(paint, 0, 0);
  return merged.toDataURL('image/png');
}
document.getElementById('download-btn').addEventListener('click', () => {
  const anchor = document.createElement('a');
  anchor.download = 'ao-dai-ve-tet-trao-xuan-2027.png';
  anchor.href = mergedImageDataUrl();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  showToast('Đã chuẩn bị ảnh PNG để tải về máy!');
});

// Gallery: textContent avoids interpreting submitted nicknames as HTML.
const gallery = document.getElementById('gallery-grid');
function emptyGallery(title, description) {
  gallery.replaceChildren();
  const box = document.createElement('div');
  box.className = 'gallery-empty';
  const icon = document.createElement('span');
  icon.className = 'gallery-empty-icon';
  icon.textContent = '✿';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const descriptionEl = document.createElement('p');
  descriptionEl.textContent = description;
  box.append(icon, heading, descriptionEl);
  gallery.appendChild(box);
}
async function loadGallery() {
  try {
    const res = await fetch('/api/artworks', { cache: 'no-store' });
    if (!res.ok) throw Error('Không thể tải thư viện');
    const data = await res.json();
    gallery.replaceChildren();
    if (!data.artworks.length) {
      emptyGallery('Bạn muốn là người đầu tiên?', 'Thư viện đang chờ tác phẩm đầu tiên. Hãy thử vẽ và gửi lời chúc của mình nhé!');
      return;
    }
    data.artworks.forEach(art => {
      const card = document.createElement('article');
      card.className = 'artwork-card';
      const img = document.createElement('img');
      img.src = art.image_url;
      img.alt = `Tranh áo dài Tết của ${art.nickname}`;
      img.loading = 'lazy';
      const info = document.createElement('div');
      info.className = 'artwork-info';
      const title = document.createElement('h3');
      title.textContent = art.nickname;
      info.appendChild(title);
      if (art.wish) {
        const wish = document.createElement('p');
        wish.textContent = `“${art.wish}”`;
        info.appendChild(wish);
      }
      const time = document.createElement('time');
      time.dateTime = art.created_at;
      time.textContent = new Date(art.created_at).toLocaleDateString('vi-VN');
      info.appendChild(time);
      card.append(img, info);
      gallery.appendChild(card);
    });
  } catch (error) {
    emptyGallery('Chưa tải được thư viện', 'Vui lòng kiểm tra kết nối rồi làm mới trang.');
  }
}
loadGallery();

const form = document.getElementById('artwork-form');
const message = document.getElementById('form-message');
const wishBox = document.getElementById('wish');
const submit = document.getElementById('submit-art');
wishBox.addEventListener('input', () => {
  document.getElementById('wish-counter').textContent = `${wishBox.value.length}/150`;
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  message.classList.remove('success');
  message.textContent = '';
  submit.disabled = true;
  submit.textContent = 'Đang gửi tranh...';
  try {
    const res = await fetch('/api/artworks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: document.getElementById('nickname').value.trim(),
        wish: wishBox.value.trim(),
        consent: document.getElementById('consent').checked,
        image: mergedImageDataUrl(),
      })
    });
    const data = await res.json();
    if (!res.ok) throw Error(data.error || 'Gửi tranh thất bại.');
    message.classList.add('success');
    message.textContent = 'Đã gửi tranh thành công! Tác phẩm xuất hiện trong thư viện bên dưới.';
    form.reset();
    document.getElementById('wish-counter').textContent = '0/150';
    await loadGallery();
    showToast('Cảm ơn bạn! Tác phẩm đã được thêm vào thư viện. ✿');
  } catch (error) {
    message.textContent = error.message || 'Không thể gửi tranh, vui lòng thử lại.';
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Gửi tác phẩm <span aria-hidden="true">↗</span>';
  }
});

let toastTimeout;
function showToast(content) {
  const toast = document.getElementById('toast');
  toast.textContent = content;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3500);
}
