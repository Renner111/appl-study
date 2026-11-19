const games = [
  { name: 'Frostline Run', url: 'games.html?game=sled', description: 'An original downhill sledding arcade game. Pick a lane, dodge snowy obstacles, and collect glowing trail tokens.' },
  { name: 'Pulse Cube', url: 'games.html?game=cube', description: 'An original rhythm-inspired platform challenge. Jump over hazards and keep your run going with the beat.' },
  { name: 'Kiwi Skies', url: 'games.html?game=flight', description: 'An original one-button flying game. Flap through the clouds, thread the gates, and chase a high score.' }
];
const overview = document.getElementById('overview');
const searchInput = document.getElementById('searchInput');

function findGame(query) {
  const normalized = query.trim().toLowerCase();
  return games.find(game => game.name.toLowerCase() === normalized) ||
    games.find(game => game.name.toLowerCase().includes(normalized) || normalized.includes(game.name.toLowerCase()));
}
function showOverview(game) {
  overview.hidden = false;
  overview.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = `About ${game.name}`;
  const text = document.createElement('span');
  text.textContent = `${game.description} These are original Appl Study games, not copies of third-party games.`;
  overview.append(heading, text);
}
function openGame(game) {
  // Load the game's own page directly. Some browsers block or misrender games inside iframes.
  window.location.href = game.url;
}

document.getElementById('searchForm').addEventListener('submit', event => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  const game = findGame(query);
  if (game) {
    showOverview(game);
    openGame(game);
    return;
  }
  overview.hidden = false;
  overview.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = 'No matching Appl Study game';
  const text = document.createElement('span');
  text.textContent = 'Try Frostline Run, Pulse Cube, or Kiwi Skies. General web search and AI summaries are not connected in this demo.';
  overview.append(heading, text);
});

document.querySelectorAll('.game-card[data-name]').forEach(card => {
  card.addEventListener('click', () => {
    const game = games.find(item => item.name === card.dataset.name);
    if (game) openGame(game);
  });
});

const brand = document.querySelector('.brand');
if (brand) brand.addEventListener('click', event => {
  event.preventDefault();
  window.location.href = 'index.html';
});
const newTabButton = document.getElementById('newTabButton');
if (newTabButton) newTabButton.addEventListener('click', () => {
  searchInput.focus();
  window.location.href = 'index.html';
});
