// app.js – 화면 동작 (목록 그리기, 일정 추가)

// 01 단원 : 일정 목록을 코드 안에 둠 (가상 데이터) → 04 단원에서 data/tasks.json 으로 분리
const SAMPLE_TASKS = [
  { title: '다중이용시설 안전점검', region: '세종', kind: '야외', owner: '김안전' },
  { title: '시민 안전체험 행사 운영', region: '보령', kind: '야외', owner: '이행사' },
  { title: '옥상 태양광 설비 점검', region: '태안', kind: '고소', owner: '박설비' },
  { title: '하천 수위계 확인', region: '대전', kind: '야외', owner: '최현장' },
  { title: '청사 외벽 간판 보수', region: '세종', kind: '고소', owner: '정시설' },
  { title: '비상연락 훈련', region: '대전', kind: '실내', owner: '한상황' },
];

let tasks = [];
let weatherByRegion = {};
const TEST_WIND = new URLSearchParams(window.location.search).get('test') === 'wind';

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  tasks = SAMPLE_TASKS.concat(saved);
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
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  saved.push(t);
  localStorage.setItem('wx_added', JSON.stringify(saved));
  e.target.reset();
  loadTasks();
  renderTasks();
}

document.getElementById('taskForm').addEventListener('submit', addTask);
loadTasks();
renderTasks();
loadWeather();
