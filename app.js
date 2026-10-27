// app.js – 화면 동작 (목록 그리기, 일정 추가)

let tasks = [];
let weatherByRegion = {};
const TEST_WIND = new URLSearchParams(window.location.search).get('test') === 'wind';
function isPublicSupabaseKey(key) {
  if (key.startsWith('sb_publishable_')) return true;
  if (!key.startsWith('eyJ')) return false;
  try {
    let payloadPart = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    payloadPart += '='.repeat((4 - payloadPart.length % 4) % 4);
    const payload = JSON.parse(atob(payloadPart));
    return payload.role === 'anon';
  } catch (error) {
    return false;
  }
}

const hasSupabaseConfig = typeof SUPABASE_URL === 'string'
  && typeof SUPABASE_PUBLIC_KEY === 'string'
  && SUPABASE_URL.startsWith('https://')
  && !SUPABASE_URL.includes('YOUR_')
  && !SUPABASE_PUBLIC_KEY.includes('YOUR_')
  && isPublicSupabaseKey(SUPABASE_PUBLIC_KEY);
let supabaseClient = null;
try {
  if (window.supabase && hasSupabaseConfig) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
  }
} catch (error) {
  console.warn('Supabase 설정을 읽지 못했습니다.', error);
}

async function loadTasks() {
  const { data, error } = await supabaseClient
    .from('wx_tasks')
    .select('id, title, region, kind, owner, created_at')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  tasks = data || [];
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

function downloadJudgmentMarkdown() {
  const today = new Date();
  const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  const markdown = buildJudgmentMarkdown(tasks, weatherByRegion, date);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `현장일정_판단_${date}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function addTask(e) {
  e.preventDefault();
  const t = {
    title: document.getElementById('titleInput').value.trim(),
    region: document.getElementById('regionInput').value,
    kind: document.getElementById('kindInput').value,
    owner: document.getElementById('ownerInput').value.trim(),
  };
  if (!t.title || !t.owner) return;

  const submitButton = e.target.querySelector('button[type="submit"], button:not([type])');
  submitButton.disabled = true;
  try {
    const { error } = await supabaseClient.from('wx_tasks').insert(t);
    if (error) throw error;
    e.target.reset();
    document.getElementById('msgBox').textContent = '';
    try {
      await loadTasks();
      renderTasks();
    } catch (error) {
      document.getElementById('msgBox').textContent = '일정은 저장됐지만 목록을 새로 읽지 못했습니다.';
      console.warn('저장 후 목록을 갱신하지 못했습니다.', error);
    }
  } catch (error) {
    document.getElementById('msgBox').textContent = 'Supabase에 일정을 저장하지 못했습니다. 연결과 표 권한을 확인해 주세요.';
    console.warn('일정을 저장하지 못했습니다.', error);
  } finally {
    submitButton.disabled = false;
  }
}

async function initializeApp() {
  const taskForm = document.getElementById('taskForm');
  const downloadButton = document.getElementById('downloadJudgmentButton');
  const loadMessage = document.getElementById('loadMessage');
  taskForm.querySelector('button').disabled = true;
  downloadButton.disabled = true;
  renderTasks();

  if (!window.supabase) {
    loadMessage.hidden = false;
    loadMessage.textContent = 'Supabase 스크립트를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.';
    return;
  }
  if (!supabaseClient) {
    loadMessage.hidden = false;
    loadMessage.textContent = 'config.js에 Supabase 주소와 publishable/anon 공개 키를 설정해 주세요. secret 키는 사용할 수 없습니다.';
    return;
  }

  try {
    await loadTasks();
    renderTasks();
    taskForm.querySelector('button').disabled = false;
    downloadButton.disabled = false;
    loadWeather();
  } catch (error) {
    loadMessage.hidden = false;
    loadMessage.textContent = 'Supabase에서 일정을 읽지 못했습니다. setup.sql 실행과 연결 설정을 확인해 주세요.';
    console.warn('Supabase 일정 목록을 불러오지 못했습니다.', error);
  }
}

document.getElementById('taskForm').addEventListener('submit', addTask);
document.getElementById('downloadJudgmentButton').addEventListener('click', downloadJudgmentMarkdown);
initializeApp();
