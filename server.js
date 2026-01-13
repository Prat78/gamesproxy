const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors()); // 🚀 no CORS issues

const GAMES = require('./games.js'); // load your games metadata

// Cache folder
const cacheDir = path.join(__dirname, 'cache');
fs.ensureDirSync(cacheDir);

// Endpoint to get all games metadata
app.get('/games', (req, res) => {
  res.json(GAMES);
});

// Endpoint to fetch a game by ID
app.get('/game', async (req, res) => {
  const id = parseInt(req.query.id);
  const game = GAMES.find(g => g.id === id);
  if (!game) return res.status(404).send('Game not found');

  const cacheFile = path.join(cacheDir, `${id}.zip`);

  // If cached, serve cached version
  if (fs.existsSync(cacheFile)) return res.sendFile(cacheFile);

  try {
    // Fetch from GitHub.io (first time)
    const response = await fetch(game.link);
    const buffer = await response.buffer();

    // Save to cache
    await fs.writeFile(cacheFile, buffer);

    // Serve to browser
    res.sendFile(cacheFile);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching game');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Render Proxy Server running on port ${PORT}`));
