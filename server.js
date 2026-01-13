const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
app.use(cors());

// Import your games array from games.js
const GAMES = require('./games.js'); 

// Utility: convert relative URLs in HTML to absolute URLs
function rewriteRelativePaths(html, baseUrl) {
    // Replace src/href attributes that are relative with full URL
    return html.replace(/(src|href)=["'](?!https?:)([^"']+)["']/g, (match, attr, path) => {
        // Ensure baseUrl ends with /
        const fixedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        return `${attr}="${fixedBase}${path}"`;
    });
}

// Route to serve a game by id
app.get('/game', async (req, res) => {
    const id = parseInt(req.query.id);
    const game = GAMES.find(g => g.id === id);

    if (!game) return res.status(404).send('Game not found');

    try {
        // Fetch HTML of the game from GitHub.io
        const response = await fetch(game.link);
        let body = await response.text();

        // Rewrite relative paths to absolute URLs
        body = rewriteRelativePaths(body, game.link);

        // Serve the fixed HTML to the browser
        res.send(body);
    } catch (err) {
        console.error('Error fetching game:', err);
        res.status(500).send('Error fetching game');
    }
});

// Optional: redirect root to some info page or your index
app.get('/', (req, res) => {
    res.send('Games Proxy Server is running! Add /game?id=GAME_ID to play.');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Render proxy server running on port ${PORT}`));
