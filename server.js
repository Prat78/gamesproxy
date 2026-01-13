// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());

const GAMES = require('./games.js'); // your Render games.js with GitHub.io links

// Serve game metadata
app.get('/games', (req, res) => {
  res.json(GAMES);
});

// Serve game HTML, proxy all assets
app.get('/game', async (req, res) => {
  const id = parseInt(req.query.id);
  const game = GAMES.find(g => g.id === id);
  if (!game) return res.status(404).send('Game not found');

  try {
    // Fetch HTML from GitHub.io server-side
    const response = await fetch(game.link);
    let html = await response.text();

    // Rewrite all asset URLs to point to Render proxy
    const baseURL = game.link.endsWith('/') ? game.link : game.link + '/';
    const proxiedHtml = html.replaceAll(baseURL, `/game/assets/${id}/`);

    res.send(proxiedHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching game HTML');
  }
});

// Serve game assets
app.get('/game/assets/:id/*', async (req, res) => {
  const id = parseInt(req.params.id);
  const game = GAMES.find(g => g.id === id);
  if (!game) return res.status(404).send('Game not found');

  const assetPath = req.params[0]; // the path after /game/assets/:id/
  const assetURL = game.link.endsWith('/') ? game.link + assetPath : game.link + '/' + assetPath;

  try {
    const response = await fetch(assetURL);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching asset');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Render proxy server running on port ${PORT}`));
