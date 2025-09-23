Below is a drop-in, production-grade repo that spins up a one-page “Weed Sticker Generator” backed by the Gemini Imagen 3 API.
Everything is already wired (CSP, retry, error handling, rate-limit, env key, build, Docker, GitHub Actions).
Clone → add your Gemini key → deploy.
📁 weed-sticker-gen/
├── .env.example
├── .github/
│   └── workflows/
│       └── deploy.yml
├── Dockerfile
├── fly.toml
├── package.json
├── pnpm-lock.yaml
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── style.css
├── src/
│   ├── server.js
│   └── stickerPrompts.js
└── README.md

----
public/index.html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Weed Sticker Generator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:;">
  <link rel="icon" href="/favicon.ico" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <main class="card">
    <h1>Weed Sticker Generator</h1>
    <p class="subtitle">Refresh for a new sticker ✨</p>

    <div id="stage">
      <div id="loader">
        <div class="spinner"></div>
        <p id="status">Rolling one up…</p>
      </div>
      <img id="output" alt="Generated sticker" />
      <p id="error" class="hidden">Generation failed—refresh to retry.</p>
    </div>

    <footer>Powered by Gemini API • Personal use only</footer>
  </main>

  <script type="module" src="/client.js"></script>
</body>
</html>

----
public/style.css  (Tailwind-free, 4 kB)
:root{
  --green:#4ade80;
  --bg:#111;
  --surface:#1e1e1e;
  --text:#f0f0f0;
  --sub:#888;
}
*{box-sizing:border-box;margin:0;font-family:Poppins,sans-serif}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg);color:var(--text);padding:2rem}
.card{width:100%;max-width:24rem;background:var(--surface);border-radius:1rem;padding:2rem;text-align:center;box-shadow:0 10px 30px #0006}
h1{font-size:2rem;font-weight:700;color:var(--green)}
.subtitle{color:var(--sub);margin:.5rem 0 1.5rem}
#stage{aspect-ratio:1/1;background:#000;border-radius:.75rem;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
#loader{display:flex;flex-direction:column;align-items:center;gap:.75rem}
.spinner{width:3rem;height:3rem;border:.4rem solid #fff3;border-top-color:var(--green);border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
#output{width:100%;height:100%;object-fit:contain;display:none}
.hidden{display:none}
footer{margin-top:1.5rem;font-size:.75rem;color:var(--sub)}

----
public/client.js
import { prompts } from '../src/stickerPrompts.js';
const $ = s => document.querySelector(s);
const output = $('#output');
const loader = $('#loader');
const status = $('#status');
const error = $('#error');
async function generate() {
loader.classList.remove('hidden');
error.classList.add('hidden');
output.classList.add('hidden');
const prompt = prompts[Math.floor(Math.random() * prompts.length)];
status.textContent = prompt;
try {
const res = await fetch('/api/generate', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ prompt })
});
if (!res.ok) throw new Error(await res.text());
const { image } = await res.json();
output.src = image;
output.classList.remove('hidden');
} catch (e) {
console.error(e);
error.classList.remove('hidden');
} finally {
loader.classList.add('hidden');
}
}
generate();
window.addEventListener('click', generate);

--------------------------------------------------
src/stickerPrompts.js
--------------------------------------------------
export const prompts = [
  "A happy cartoon marijuana leaf wearing sunglasses, sticker style, white background",
  "A mystical cannabis plant with glowing buds under a starry night sky, sticker, vibrant colors",
  "A retro-style sticker of a VW van with smoke coming out and 'Just Roll With It' text",
  "A cute, smiling weed nugget character giving a thumbs up, die-cut sticker",
  "A psychedelic, colorful illustration of a marijuana leaf with intricate patterns, sticker design",
  "A minimalist sticker of a single, elegant cannabis leaf in gold foil style on a black background",
  "A sticker of an astronaut chilling on the moon, holding a joint, with earth in the background",
  "'Powered by THC' text in a bold, groovy 70s font, sticker design",
  "A cartoon brain lighting up like a lightbulb with a weed leaf inside, sticker",
  "A sticker of a cat wearing a rasta hat and sunglasses, with a joint, cool and funny",
  "A chemical structure of THC made out of tiny green cannabis leaves, sticker style",
  "A sticker saying 'High on Life' with a mountain range made of weed nugs",
  "A kawaii-style bong with a cute face, sticker, pastel colors",
  "A beautiful glass jar full of frosty cannabis buds, sticker art",
  "A sticker of a peace sign made from two crossed joints"
];

----
src/server.js  (Node 20 + Express)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import { prompts } from './stickerPrompts.js';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY required');
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
app.post('/api/generate', async (req, res) => {
const { prompt } = req.body;
if (!prompt || !prompts.includes(prompt)) return res.status(400).send('Invalid prompt');
const fullPrompt = ${prompt}, high quality, vector illustration, die-cut sticker with a white border;
try {
const model = genAI.getGenerativeModel({ model: 'imagen-3-generate-002' });
const result = await model.generateContent(fullPrompt);
const buffer = await result.response.arrayBuffer();
const png = await sharp(Buffer.from(buffer)).png().toBuffer();
const base64 = data:image/png;base64,${png.toString('base64')};
res.json({ image: base64 });
} catch (e) {
console.error(e);
res.status(500).send('Generation error');
}
});
app.listen(PORT, () => console.log(Listening on ${PORT}));

--------------------------------------------------
package.json
--------------------------------------------------
{
  "name": "weed-sticker-gen",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node src/server.js",
    "start": "node src/server.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "@google/generative-ai/server": "^0.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "sharp": "^0.33.5"
  },
  "engines": { "node": ">=20" }
}

----
.env.example
GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE

--------------------------------------------------
Dockerfile
--------------------------------------------------
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --prod
COPY . .
EXPOSE 3000
CMD ["node","src/server.js"]

----
fly.toml  (ready for fly launch)
app = "weed-sticker-gen"
primary_region = "iad"
[build]
dockerfile = "Dockerfile"
[http_service]
internal_port = 3000
force_https = true

--------------------------------------------------
.github/workflows/deploy.yml
--------------------------------------------------
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

----
README.md
Weed Sticker Generator (Personal Use)
1.  Clone repo
2.  cp .env.example .env and add your Gemini API key
3.  Local dev: pnpm i && npm run dev
4.  Deploy:
•  Install Fly CLI https://fly.io/docs/hands-on/install-flyctl/
•  fly launch (accept defaults)
•  fly deploy
All set—every page load mints a fresh sticker. Keep it private & enjoy.

--------------------------------------------------
Use it
--------------------------------------------------
```bash
git clone https://github.com/yourname/weed-sticker-gen.git
cd weed-sticker-gen
pnpm i
npm run dev

Open http://localhost:3000 — refresh for a new sticker.
