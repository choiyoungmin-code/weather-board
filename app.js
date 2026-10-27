// app.js – 화면 동작 (목록 그리기, 일정 추가)

let tasks = [];
let baseTasks = [];
let addedTasks = [];
let weatherByRegion = {};
const TEST_WIND = new URLSearchParams(window.location.search).get('test') === 'wind';

async function loadTasks() {
  const response = await fetch('data/tasks.json');
  if (!response.ok) throw new Error('일정 JSON 요청 실패: ' + response.status);

  const loadedTasks = await response.json();
  if (!Array.isArray(loadedTasks)) throw new Error('일정 JSON 형식이 올바르지 않습니다.');

  // 기준 일정 JSON을 먼저 읽은 다음, 화면에서 추가한 일정만 브라우저 저장소에서 읽습니다.
  baseTasks = loadedTasks;
  try {
    const savedTasks = JSON.parse(localStorage.getItem('wx_added') || '[]');
    addedTasks = Array.isArray(savedTasks) ? savedTasks : [];
  } catch (error) {
    addedTasks = [];
  }
  tasks = baseTasks.concat(addedTasks);
}

function weatherText(w) {
  return w ? w.tempMax + '℃ · ' + w.windMax + 'm/s · ' + w.rainProb + '%' : '-';
}

function renderTasks() {
  const body = document.getElementById('taskList');
  body.innerHTML = '';
  for (const t of tasks) {
    const w = weatherByRegion[t.region];
    const r = judge(t.kind, w);
    const tr = document.createElement('tr');
    for (const v of [t.title, t.region, t.kind, t.owner, weatherText(w)]) {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    }
    const td = document.createElement('td');
    td.textContent = r.text;
    td.className = r.level;
    tr.appendChild(td);
    body.appendChild(tr);
  }
}

async function loadWeather() {
  const regions = Object.keys(WEATHER_LOCATIONS);
  const results = await Promise.allSettled(regions.map(async (region) => {
    const response = await fetch(buildWeatherUrl(region));
    if (!response.ok) throw new Error('날씨 API 요청 실패: ' + response.status);
    return [region, parseWeatherResponse(await response.json())];
  }));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const region = regions[i];
    if (result.status === 'fulfilled') {
      weatherByRegion[region] = result.value[1];
    } else {
      delete weatherByRegion[region];
      console.warn(region + ' 날씨를 불러오지 못했습니다.', result.reason);
    }

    if (TEST_WIND) {
      // API 실패 시에도 규칙 시험이 가능하도록 다른 값은 중립값을 사용합니다.
      const weather = weatherByRegion[region] || { tempMax: 0, rainProb: 0 };
      weatherByRegion[region] = { ...weather, windMax: 12 };
    }
  }
  renderTasks();
}

function addTask(e) {
  e.preventDefault();
  const t = {
    title: document.getElementById('titleInput').value.trim(),
    region: document.getElementById('regionInput').value,
    kind: document.getElementById('kindInput').value,
    owner: document.getElementById('ownerInput').value.trim(),
  };
  if (!t.title || !t.owner) return;
  addedTasks.push(t);
  try {
    localStorage.setItem('wx_added', JSON.stringify(addedTasks));
  } catch (error) {
    addedTasks.pop();
    document.getElementById('msgBox').textContent = '일정을 브라우저에 저장하지 못했습니다.';
    return;
  }
  tasks = baseTasks.concat(addedTasks);
  e.target.reset();
  document.getElementById('msgBox').textContent = '';
  renderTasks();
}

async function initializeApp() {
  const taskForm = document.getElementById('taskForm');
  const loadMessage = document.getElementById('loadMessage');
  taskForm.querySelector('button').disabled = true;
  renderTasks();

  try {
    await loadTasks();
    renderTasks();
    taskForm.querySelector('button').disabled = false;
    loadWeather();
  } catch (error) {
    loadMessage.hidden = false;
    loadMessage.textContent = '배포 주소로 열어주세요';
    console.warn('일정 목록을 불러오지 못했습니다.', error);
  }
}

document.getElementById('taskForm').addEventListener('submit', addTask);
initializeApp();
