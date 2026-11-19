const homePage = document.getElementById('homePage');
const browserPage = document.getElementById('browserPage');
const frame = document.getElementById('contentFrame');
const tabsEl = document.getElementById('tabs');
const overview = document.getElementById('overview');
const searchInput = document.getElementById('searchInput');

const games = [
  { name: 'Snow Rider 3D', url: 'https://snow-rider.io/snow-rider-3d/', description: 'A fast downhill sledding game where you steer around obstacles and collect gifts.' },
  { name: 'Geometry Dash', url: 'https://geometrydashlite.io/', description: 'A rhythm platform game built around timing jumps to the music. Availability and embeds depend on the publisher.' },
  { name: 'Flying Kiwi', url: 'https://poki.com/en/g/flying-kiwi', description: 'An arcade flying game listed on Poki.' }
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
      close.addEventListener('click', event => {
        event.stopPropagation();
        closeTab(tab.id);
      });
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
  if (!tab.home && frame.src !== tab.url) frame.src = tab.url;
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

document.getElementById('searchForm').addEventListener('submit', event => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  const game = findGame(query);
  if (game) {
    overview.hidden = false;
    overview.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = `Overview: ${game.name}`;
    const text = document.createElement('span');
    text.textContent = `${game.description} Opening the game in this tab if its site allows embedded viewing.`;
    overview.append(heading, text);
    openPage(game.name, game.url);
    return;
  }
  overview.hidden = false;
  overview.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = 'No matching game yet';
  const text = document.createElement('span');
  text.textContent = 'This demo search covers the games listed on the home screen. An AI overview is not connected; it would need an AI service and an API key.';
  overview.append(heading, text);
});

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const game = games.find(item => item.name === card.dataset.name);
    if (!game) return;
    overview.hidden = false;
    overview.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = `Overview: ${game.name}`;
    const text = document.createElement('span');
    text.textContent = `${game.description} Opening the game in this tab if its site allows embedded viewing.`;
    overview.append(heading, text);
    openPage(game.name, game.url);
  });
});

document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault();
  activateTab('home');
});
document.getElementById('newTabButton').addEventListener('click', () => {
  searchInput.focus();
  activateTab('home');
});

renderTabs();
