const homePage = document.getElementById('homePage');
const browserPage = document.getElementById('browserPage');
const frame = document.getElementById('contentFrame');
const tabsEl = document.getElementById('tabs');
const overview = document.getElementById('overview');
const searchInput = document.getElementById('searchInput');

const games = [
  { name: 'Frostline Run', url: 'games.html?game=sled', description: 'An original downhill sledding arcade game. Pick a lane, dodge snowy obstacles, and collect glowing trail tokens.' },
  { name: 'Pulse Cube', url: 'games.html?game=cube', description: 'An original rhythm-inspired platform challenge. Jump over hazards and keep your run going with the beat.' },
  { name: 'Kiwi Skies', url: 'games.html?game=flight', description: 'An original one-button flying game. Flap through the clouds, thread the gates, and chase a high score.' }
];
let tabs = [{ id: 'home', title: 'Home', url: '', home: true }];
let activeId = 'home';

function renderTabs() {
  tabsEl.replaceChildren();
  for (const tab of tabs) {
    const button = document.createElement('button');
    button.className = `tab${tab.id === activeId ? ' active' : ''}`;
    button.type = 'button';
    button.setAttribute('aria-current', tab.id === activeId ? 'page' : 'false');
    const label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = tab.title;
    button.append(label);
    if (!tab.home) {
      const close = document.createElement('span');
      close.className = 'close-tab';
      close.textContent = '×';
      close.setAttribute('role', 'button');
      close.setAttribute('aria-label', `Close ${tab.title}`);
      close.addEventListener('click', event => { event.stopPropagation(); closeTab(tab.id); });
      button.append(close);
    }
    button.addEventListener('click', () => activateTab(tab.id));
    tabsEl.append(button);
  }
}
function activateTab(id) {
  const tab = tabs.find(item => item.id === id);
  if (!tab) return;
  activeId = id;
  homePage.hidden = !tab.home;
  browserPage.hidden = tab.home;
  if (!tab.home && frame.src !== new URL(tab.url, location.href).href) frame.src = tab.url;
  renderTabs();
}
function openPage(title, url) {
  const tab = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title, url, home: false };
  tabs.push(tab);
  activateTab(tab.id);
}
function closeTab(id) {
  const index = tabs.findIndex(tab => tab.id === id);
  if (index < 0 || tabs[index].home) return;
  tabs.splice(index, 1);
  if (activeId === id) activateTab(tabs[Math.max(0, index - 1)].id);
  else renderTabs();
}
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
document.getElementById('searchForm').addEventListener('submit', event => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  const game = findGame(query);
  if (game) { showOverview(game); openPage(game.name, game.url); return; }
  overview.hidden = false;
  overview.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = 'No matching Appl Study game';
  const text = document.createElement('span');
  text.textContent = 'Try Frostline Run, Pulse Cube, or Kiwi Skies. General web search and AI summaries are not connected in this demo.';
  overview.append(heading, text);
});
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const game = games.find(item => item.name === card.dataset.name);
    if (game) { showOverview(game); openPage(game.name, game.url); }
  });
});
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); activateTab('home'); });
document.getElementById('newTabButton').addEventListener('click', () => { searchInput.focus(); activateTab('home'); });
renderTabs();
