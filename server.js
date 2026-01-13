// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const GAMES = require('./games.js'); // your 300+ games with GitHub.io links

// --------------------
// Route: list all games metadata
// --------------------
app.get('/games', (req, res) => {
  res.json(GAMES);
});

// --------------------
// Route: serve HTML for a single game
// --------------------
app.get('/game', async (req, res) => {
  const id = parseInt(req.query.id);
  const game = GAMES.find(g => g.id === id);
  if (!game) return res.status(404).send('Game not found');

  try {
    // Fetch game HTML from GitHub.io
    const response = await fetch(game.link);
    let html = await response.text();

    // Rewrite all relative URLs (src, href) to go through our Render proxy
    // This handles JS, CSS, images, WebGL builds, etc.
    const proxiedHtml = html.replace(
      /(src|href)=["']([^"']+)["']/g,
      (match, attr, url) => {
        // Absolute URLs (http/https) stay as-is
        if (url.startsWith('http') || url.startsWith('//')) return match;
        // Relative URLs rewritten to go through Render
        return `${attr}="/game/assets/${id}/${url}"`;
      }
    );

    res.send(proxiedHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching game HTML');
  }
});

// --------------------
// Route: serve proxied assets for a game
// --------------------
app.get('/game/assets/:id/*', async (req, res) => {
  const id = parseInt(req.params.id);
  const game = GAMES.find(g => g.id === id);
  if (!game) return res.status(404).send('Game not found');

  const assetPath = req.params[0]; // everything after /game/assets/:id/
  const assetURL = game.link + (game.link.endsWith('/') ? '' : '/') + assetPath;

  try {
    const response = await fetch(assetURL);

    // Infer content type from URL extension
    const ext = path.extname(assetPath).toLowerCase();
    if (ext === '.js') res.type('application/javascript');
    else if (ext === '.css') res.type('text/css');
    else if (ext === '.html') res.type('text/html');
    else if (['.png','.jpg','.jpeg','.gif','.webp','.svg'].includes(ext)) res.type(`image/${ext.slice(1)}`);
    else if (ext === '.json') res.type('application/json');
    else res.type('application/octet-stream');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching asset');
  }
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Render proxy server running on port ${PORT}`));
