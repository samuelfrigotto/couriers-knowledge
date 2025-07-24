// dotaScraperRoute.js

const express = require('express');
const puppeteer = require('puppeteer');

const router = express.Router();

router.get('/dotascraper/:region', async (req, res) => {
  const region = req.params.region || 'americas';
  const url = `https://www.dota2.com/leaderboards/#${region}`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new', // headless: true às vezes falha com sites JS pesados
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    // Espera os elementos aparecerem
    await page.waitForSelector('#leaderboard_body .player_name', { timeout: 10000 });

    // Extrai os nomes dos jogadores
    const players = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#leaderboard_body .player_name'))
                  .map(el => el.textContent.trim());
    });

    await browser.close();

    res.json({ region, players });
  } catch (error) {
    console.error('Erro no scraper:', error);
    res.status(500).json({ error: 'Erro ao extrair leaderboard', details: error.message });
  }
});

module.exports = router;
