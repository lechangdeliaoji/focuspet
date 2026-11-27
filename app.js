/* ============================================================
 * app.js — 番茄宠物 FocusPet
 * 番茄钟 + 时间任务 + 积分经济 + 虚拟宠物养成 + 商店
 * 纯前端，localStorage 持久化
 * ============================================================ */
'use strict';

/* ------------------------------------------------------------
 * 0. 常量表
 * ---------------------------------------------------------- */
const STORE_KEY = 'focuspet.state.v1';
const C = 2 * Math.PI * 96;                 // 圆环周长
const DAY = 86400000;

/** 商品目录：cat=food|toy|wear */
const SHOP = [
  // ---------- 食物 ----------
  { id: 'apple',   cat: 'food', name: '苹果片',   emoji: '🍎', price: 8,   desc: '清爽小零嘴', eff: { hunger: 6, mood: 1, clean: 2 } },
  { id: 'fish',    cat: 'food', name: '小鱼干',   emoji: '🐟', price: 12,  desc: '最基础的口粮', eff: { hunger: 9, mood: 3 } },
  { id: 'bone',    cat: 'food', name: '磨牙骨',   emoji: '🦴', price: 15,  desc: '越啃越开心', eff: { hunger: 12, mood: 4 } },
  { id: 'milk',    cat: 'food', name: '温牛奶',   emoji: '🥛', price: 18,  desc: '饱腹又提神', eff: { hunger: 10, energy: 12 } },
  { id: 'can',     cat: 'food', name: '肉罐头',   emoji: '🥫', price: 30,  desc: '香到打滚', eff: { hunger: 26, mood: 5 } },
  { id: 'pudding', cat: 'food', name: '布丁蛋糕', emoji: '🍮', price: 45,  desc: '甜食就是快乐', eff: { hunger: 18, mood: 16 } },
  { id: 'steak',   cat: 'food', name: '豪华牛排', emoji: '🥩', price: 80,  desc: '一顿顶一天', eff: { hunger: 42, mood: 20, energy: 18 } },

  // ---------- 玩具 ----------
  { id: 'balloon', cat: 'toy',  name: '小气球',   emoji: '🎈', price: 25,  desc: '轻飘飘的快乐', eff: { mood: 10, bond: 1 } },
  { id: 'yarn',    cat: 'toy',  name: '毛线球',   emoji: '🧶', price: 35,  desc: '滚来滚去停不下', eff: { mood: 16, energy: -6, bond: 2 } },
  { id: 'wand',    cat: 'toy',  name: '逗猫棒',   emoji: '🎣', price: 55,  desc: '蹦跶半小时', eff: { mood: 22, energy: -9, bond: 3 } },
  { id: 'frisbee', cat: 'toy',  name: '飞盘',     emoji: '🥏', price: 60,  desc: '跑到喘气也开心', eff: { mood: 24, energy: -14, bond: 3 } },
  { id: 'puzzle',  cat: 'toy',  name: '益智宝箱', emoji: '🧩', price: 90,  desc: '聪明宠物的最爱', eff: { mood: 30, energy: -10, bond: 5 } },

  // ---------- 服饰（slot: neck / head / eyes）----------
  { id: 'bell',     cat: 'wear', slot: 'neck', name: '铃铛项圈', emoji: '🔔', price: 120, desc: '走路叮当响' },
  { id: 'collar',   cat: 'wear', slot: 'neck', name: '红色项圈', emoji: '🧧', price: 150, desc: '经典款，显白' },
  { id: 'scarf',    cat: 'wear', slot: 'neck', name: '蓝围巾',   emoji: '🧣', price: 260, desc: '冬天也要暖' },
  { id: 'necklace', cat: 'wear', slot: 'neck', name: '紫水晶链', emoji: '💜', price: 420, desc: '贵气逼人' },
  { id: 'bow',      cat: 'wear', slot: 'head', name: '蝴蝶结',   emoji: '🎀', price: 180, desc: '甜妹必备' },
  { id: 'cap',      cat: 'wear', slot: 'head', name: '鸭舌帽',   emoji: '🧢', price: 240, desc: '街头小酷仔' },
  { id: 'partyhat', cat: 'wear', slot: 'head', name: '生日帽',   emoji: '🎉', price: 300, desc: '每天都是纪念日' },
  { id: 'crown',    cat: 'wear', slot: 'head', name: '小皇冠',   emoji: '👑', price: 600, desc: '你家的主子' },
  { id: 'glasses',  cat: 'wear', slot: 'eyes', name: '墨镜',     emoji: '🕶️', price: 500, desc: '气场全开' }
];

/** 宠物阶段 */
const STAGES = [
  { name: '幼崽期', need: 0,   scale: 1 },
  { name: '少年期', need: 100, scale: 1 },
  { name: '成年期', need: 260, scale: 1 },
  { name: '挚友期', need: 500, scale: 1 }
];

/** 等级称号（按累计专注分钟） */
const TITLES = [
  '专注学徒', '时间猎手', '心流新手', '番茄工匠', '静默行者',
  '深度专注者', '专注大师', '心流宗师', '时间领主', '番茄之神'
];

/** 默认状态 */
function defaultState() {
  return {
    v: 1,
    createdAt: Date.now(),
    settings: {
      focus: 25, short: 5, long: 15, longEvery: 4,
      autoNext: false, sound: true, vibrate: true, dailyGoal: 8
    },
    points: 0,
    totalEarned: 0,
    totalFocusMin: 0,
    totalPomodoros: 0,
    timer: { mode: 'focus', running: false, endAt: null, remain: 25 * 60, taskId: null, round: 1 },
    tasks: [],
    logs: [],
    ledger: [],
    inventory: { fish: 2, yarn: 1 },
    pet: {
      type: 'cat', variant: 0, name: '团子',
      hunger: 82, mood: 80, energy: 78, clean: 76,
      bondTotal: 0, fed: 0, lastTick: Date.now(), born: Date.now(),
      equipped: { neck: null, head: null, eyes: null }
    },
    streak: { lastCheck: null, count: 0, best: 0 },
    goalAward: null,
    onboarded: false
  };
}

/* ------------------------------------------------------------
 * 1. 状态
 * ---------------------------------------------------------- */
let S = load();
let petSig = '';

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const d = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base, ...d,
      settings: { ...base.settings, ...(d.settings || {}) },
      timer: { ...base.timer, ...(d.timer || {}) },
      pet: { ...base.pet, ...(d.pet || {}), equipped: { ...base.pet.equipped, ...((d.pet || {}).equipped || {}) } },
      streak: { ...base.streak, ...(d.streak || {}) },
      inventory: d.inventory || base.inventory
    };
  } catch (e) {
    console.warn('读取存档失败，使用默认状态', e);
    return defaultState();
  }
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
    catch (e) { console.warn('保存失败', e); }
  }, 120);
}

/* ------------------------------------------------------------
 * 2. 工具
 * ---------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fmtClock = (sec) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function toast(msg, ms = 1900) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('on'), ms);
}

/* 原生桥：Android 外壳注入 window.AndroidTimer；浏览器中不存在，自动降级为 Web API */
const Native = (() => {
  const ok = typeof window.AndroidTimer !== 'undefined' && window.AndroidTimer !== null;
  const call = (fn, ...args) => { if (!ok) return; try { window.AndroidTimer[fn](...args); } catch (e) { /* ignore */ } };
  return {
    ok,
    schedule(ms, title, body) {
      if (!ok) return;
      call('scheduleAlarm', Date.now() + Math.max(1500, Math.round(ms)), title, body);
    },
    cancel() { call('cancelAlarm'); },
    vibrate(p) { call('vibrate', Array.isArray(p) ? (p[0] || 40) : (Number(p) || 20)); },
    awake(on) { call('awake', !!on); },
    notify(title, body) { call('notify', title, body); },
    toast(msg) { call('toast', msg); }
  };
})();

function buzz(p = 18) {
  if (!S.settings.vibrate) return;
  if (Native.ok) { Native.vibrate(p); return; }
  if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } }
}

/* 提示音：WebAudio 合成，无需音频文件 */
let actx = null;
function beep(kind = 'end') {
  if (!S.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const notes = kind === 'end' ? [880, 1174.7, 1318.5] : kind === 'coin' ? [1046.5, 1396.9] : [659.3];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t0 = actx.currentTime + i * 0.13;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
      o.connect(g); g.connect(actx.destination);
      o.start(t0); o.stop(t0 + 0.36);
    });
  } catch (e) { /* 静默失败 */ }
}

/* 弹层 */
function openSheet(html, mount) {
  $('#sheetBody').innerHTML = html;
  $('#mask').classList.add('on');
  if (mount) mount($('#sheetBody'));
}
function closeSheet() { $('#mask').classList.remove('on'); }

/* ------------------------------------------------------------
 * 3. 积分 / 等级
 * ---------------------------------------------------------- */
function addPoints(delta, reason) {
  S.points += delta;
  if (delta > 0) S.totalEarned += delta;
  S.ledger.unshift({ id: uid(), ts: Date.now(), delta, reason, bal: S.points });
  if (S.ledger.length > 400) S.ledger.length = 400;
  save();
  renderTop();
  return S.points;
}

const levelInfo = () => {
  const m = S.totalFocusMin;
  const lv = Math.floor(m / 60) + 1;
  const into = m % 60;
  return { lv, into, need: 60, title: TITLES[Math.min(Math.floor((lv - 1) / 3), TITLES.length - 1)] };
};

/* ------------------------------------------------------------
 * 4. 番茄钟
 * ---------------------------------------------------------- */
const DUR = (mode) => {
  const s = S.settings;
  return (mode === 'focus' ? s.focus : mode === 'short' ? s.short : s.long) * 60;
};

function setMode(mode, silent) {
  const t = S.timer;
  if (t.running) { if (!silent) toast('先暂停当前计时'); return; }
  t.mode = mode;
  t.remain = DUR(mode);
  save();
  renderTimer(); renderChips();
}

function startTimer() {
  const t = S.timer;
  if (t.remain <= 0) t.remain = DUR(t.mode);
  if (t.mode === 'focus' && !t.taskId) {
    const first = S.tasks.find(x => !x.completed);
    if (first) t.taskId = first.id;
  }
  t.running = true;
  t.endAt = Date.now() + t.remain * 1000;
  save();
  requestWake();
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* ignore */ }
  renderTimer();
  buzz(10);
  // 交给系统闹钟：即使 App 被切到后台/息屏也能到点提醒
  if (t.mode === 'focus') {
    Native.schedule(t.endAt - Date.now(), '专注完成 🍅', `起来活动一下，${S.pet.name || '宠物'}在等你投喂 🐾`);
  } else {
    Native.schedule(t.endAt - Date.now(), '休息结束 ☕', '准备好再来一个番茄了吗？');
  }
}

function pauseTimer() {
  const t = S.timer;
  if (!t.running) return;
  t.remain = Math.max(0, Math.round((t.endAt - Date.now()) / 1000));
  t.running = false;
  t.endAt = null;
  releaseWake();
  Native.cancel();
  save();
  renderTimer();
}

function resetTimer() {
  const t = S.timer;
  t.running = false; t.endAt = null;
  t.remain = DUR(t.mode);
  releaseWake();
  Native.cancel();
  save();
  renderTimer();
}

function skipSession() {
  const t = S.timer;
  if (t.mode === 'focus') {
    toast('已跳过本次专注（不计分）');
    t.round = t.round; // 保持轮次
    nextMode(false);
  } else {
    nextMode(false);
  }
  t.running = false; t.endAt = null;
  t.remain = DUR(t.mode);
  releaseWake(); Native.cancel(); save(); renderTimer(); renderChips();
}

function nextMode(afterFocus) {
  const t = S.timer;
  if (t.mode === 'focus') {
    const isLong = afterFocus && t.round % Math.max(2, S.settings.longEvery) === 0;
    t.mode = isLong ? 'long' : 'short';
  } else {
    t.mode = 'focus';
  }
  t.running = false; t.endAt = null;
  t.remain = DUR(t.mode);
}

let wakeLock = null;
async function requestWake() {
  Native.awake(true);
  try {
    if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) { /* 不支持则忽略 */ }
}
function releaseWake() {
  Native.awake(false);
  try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) { /* ignore */ }
}

/* 计时心跳 */
function tickTimer() {
  const t = S.timer;
  if (!t.running) return;
  const left = Math.round((t.endAt - Date.now()) / 1000);
  t.remain = Math.max(0, left);
  if (left <= 0) { completeSession(); return; }
  paintTimer();
}

function completeSession() {
  const t = S.timer;
  const mode = t.mode;
  const total = DUR(mode);
  t.running = false; t.endAt = null;
  releaseWake();
  Native.cancel();

  if (mode === 'focus') {
    const mins = Math.round(total / 60);
    const longEvery = Math.max(2, S.settings.longEvery);
    const isCycleEnd = t.round % longEvery === 0;

    let pts = 10;
    const bonus = [];
    if (mins >= 45) { pts += 8; bonus.push('长时段 +8'); }
    else if (mins >= 30) { pts += 4; bonus.push('中时段 +4'); }
    if (t.taskId) { pts += 2; bonus.push('任务绑定 +2'); }
    if (isCycleEnd) { pts += 15; bonus.push('四连击 +15'); }

    const task = S.tasks.find(x => x.id === t.taskId);
    if (task) { task.done = (task.done || 0) + 1; }

    S.logs.unshift({
      id: uid(), ts: Date.now(), day: dayKey(), type: 'focus',
      minutes: mins, points: pts, task: task ? task.title : null
    });
    if (S.logs.length > 500) S.logs.length = 500;

    S.totalFocusMin += mins;
    S.totalPomodoros += 1;
    addPoints(pts, `完成 ${mins} 分钟专注`);

    // 宠物陪伴奖励
    const p = S.pet;
    p.mood = clamp(p.mood + 8);
    p.bondTotal += 2;
    p.lastTick = Date.now();

    t.round += 1;
    nextMode(true);

    beep('end'); buzz([40, 60, 40]);
    showReward({ pts, bonus, mins, goalHit: checkGoal() });
    renderAll();
  } else {
    const mins = Math.round(total / 60);
    S.logs.unshift({ id: uid(), ts: Date.now(), day: dayKey(), type: mode, minutes: mins, points: 0 });
    nextMode(false);
    beep('end'); buzz(60);
    toast(`休息结束，准备好再专注一次吗？`, 2600);
    renderAll();
  }
  save();
}

function checkGoal() {
  const today = dayKey();
  const count = S.logs.filter(l => l.day === today && l.type === 'focus').length;
  if (count >= S.settings.dailyGoal && S.goalAward !== today) {
    S.goalAward = today;
    addPoints(20, '达成今日目标');
    return true;
  }
  return false;
}

function showReward({ pts, bonus, mins, goalHit }) {
  openSheet(`
    <div class="reward">
      <div class="em">${goalHit ? '🏆' : '🍅'}</div>
      <h2>${goalHit ? '今日目标达成！' : '专注完成'}</h2>
      <div class="plus">+${pts + (goalHit ? 20 : 0)} 积分</div>
      <div class="detail">
        ${mins} 分钟深度专注${bonus.length ? '<br>' + bonus.join(' · ') : ''}
        ${goalHit ? '<br><b style="color:#ffc84a">额外奖励：达成今日目标 +20</b>' : ''}
        <br>${S.pet.name} 因为你的陪伴，心情 +8
      </div>
      <div class="btn-row">
        <button class="btn" data-close>稍后再说</button>
        <button class="btn primary" data-close id="rwShop">去买东西给它</button>
      </div>
    </div>`, (el) => {
    el.querySelector('#rwShop').addEventListener('click', () => { closeSheet(); switchView('shop'); });
  });
}

/* ------------------------------------------------------------
 * 5. 宠物
 * ---------------------------------------------------------- */
function petMoodFace() {
  const p = S.pet;
  if (p.mood >= 70 && p.hunger >= 40) return 'happy';
  if (p.mood < 35 || p.hunger < 20 || p.clean < 20) return 'sad';
  return 'ok';
}

function decayPet() {
  const p = S.pet;
  const now = Date.now();
  const hrs = Math.min((now - (p.lastTick || now)) / 3600000, 72);
  p.lastTick = now;
  if (hrs < 0.002) return;
  p.hunger = clamp(p.hunger - 3.4 * hrs);
  p.mood = clamp(p.mood - 2.6 * hrs);
  p.energy = clamp(p.energy - 1.7 * hrs);
  p.clean = clamp(p.clean - 1.9 * hrs);
  if (p.hunger < 20) p.mood = clamp(p.mood - 1.4 * hrs);
  if (p.clean < 25) p.mood = clamp(p.mood - 0.8 * hrs);
  save();
}

function renderPet(force) {
  const p = S.pet;
  const face = petMoodFace();
  const sig = [p.type, p.variant, face, p.equipped.neck, p.equipped.head, p.equipped.eyes].join('|');
  if (!force && sig === petSig) return;
  petSig = sig;
  $('#petBox').innerHTML = PetSprite.render({
    type: p.type, variant: p.variant, mood: face, equipped: p.equipped
  });

  // 阶段与亲密度
  let stage = 0;
  STAGES.forEach((s, i) => { if (p.bondTotal >= s.need) stage = i; });
  const next = STAGES[Math.min(stage + 1, STAGES.length - 1)];
  const cur = STAGES[stage];
  const pct = next.need === cur.need ? 100 : Math.min(100, ((p.bondTotal - cur.need) / (next.need - cur.need)) * 100);
  $('#petStageTxt').textContent = cur.name;
  $('#bondBar').style.width = pct + '%';
  $('#bondTxt').textContent = `${Math.floor(p.bondTotal)} / ${next.need}`;
  $('#petName').innerHTML = `${esc(p.name)} <span class="lv" id="petLv">Lv.${levelInfo().lv}</span>`;
}

function renderPetStats() {
  const p = S.pet;
  ['hunger', 'mood', 'energy', 'clean'].forEach(k => {
    const v = Math.round(p[k]);
    $('#b' + k[0].toUpperCase() + k.slice(1)).style.width = v + '%';
    $('#v' + k[0].toUpperCase() + k.slice(1)).textContent = v;
  });
  const days = Math.max(1, Math.ceil((Date.now() - p.born) / DAY));
  $('#fDays').textContent = days + ' 天';
  $('#fFed').textContent = p.fed + ' 次';
  $('#fFocus').textContent = S.totalPomodoros + ' 个番茄';
  $('#fLike').textContent = p.type === 'dog' ? '飞盘 + 磨牙骨' : '毛线球 + 小鱼干';
  // 衣柜
  const names = { neck: '颈部', head: '头部', eyes: '眼睛' };
  const eq = p.equipped;
  const list = Object.keys(eq).filter(k => eq[k]).map(k => {
    const it = SHOP.find(x => x.id === eq[k]);
    return it ? `<span class="tag" style="margin-right:6px">${it.emoji} ${it.name}</span>` : '';
  }).join('');
  $('#wearing').innerHTML = list
    ? `<div class="between"><span>${list}</span><button class="use-btn" id="unwearAll">全部脱下</button></div>`
    : `<div class="between"><span class="muted tiny">还没给它打扮过，去商店挑一件吧</span><span style="font-size:22px;opacity:.35">👕</span></div>`;
  const ub = $('#unwearAll');
  if (ub) ub.addEventListener('click', () => {
    S.pet.equipped = { neck: null, head: null, eyes: null };
    save(); renderPet(true); renderPetStats(); renderShop(); toast('已经全部脱下');
  });
}

function floatEmoji(em) {
  const room = $('#petRoom');
  const d = document.createElement('div');
  d.className = 'pet-float';
  d.textContent = em;
  d.style.left = (35 + Math.random() * 30) + '%';
  d.style.top = (45 + Math.random() * 12) + '%';
  room.appendChild(d);
  setTimeout(() => d.remove(), 1600);
}

function petAnim(cls, ms = 900) {
  const b = $('#petBox');
  b.classList.add(cls);
  setTimeout(() => b.classList.remove(cls), ms);
}

let lastPetTime = 0;
function petAction(act) {
  const p = S.pet;
  if (act === 'feed') { openFeedSheet(); return; }

  if (act === 'play') {
    if (p.energy < 15) { toast('它太累了，让它休息一会儿吧'); petAnim('shake'); return; }
    p.mood = clamp(p.mood + 14);
    p.energy = clamp(p.energy - 10);
    p.hunger = clamp(p.hunger - 3);
    p.clean = clamp(p.clean - 4);
    p.bondTotal += 2;
    petAnim('dance', 1300);
    floatEmoji('💫'); floatEmoji('🎾');
    say(randomSay('play'));
    beep('coin'); buzz(15);
  } else if (act === 'pet') {
    const now = Date.now();
    if (now - lastPetTime < 15000) { toast(`它已经在你怀里了，${Math.ceil((15000 - (now - lastPetTime)) / 1000)} 秒后再摸摸`); return; }
    lastPetTime = now;
    p.mood = clamp(p.mood + 5);
    p.bondTotal += 1;
    petAnim('jump');
    floatEmoji('💗');
    say(randomSay('pet'));
    buzz(10);
  } else if (act === 'bath') {
    p.clean = clamp(p.clean + 40);
    p.mood = clamp(p.mood - 3);
    p.bondTotal += 1;
    petAnim('shake', 700);
    floatEmoji('🫧'); floatEmoji('✨');
    toast(`${p.name} 洗得香香的（清洁 +40，心情 -3）`);
    beep('coin');
  }
  save();
  renderPet(true); renderPetStats();
}

const SAY = {
  play: ['再来一次！', '好好玩～', '我还能跑！', '这是我今天最开心的时刻'],
  pet: ['呼噜呼噜…', '再摸一会儿嘛', '就喜欢你这样', '嗯…舒服'],
  hungry: ['肚子饿扁了…', '有小鱼干吗？', '我闻到香味了'],
  happy: ['今天也陪着你专注啦', '你在做事，我就安静趴着', '有你在真好'],
  sad: ['有点无聊…', '能陪我玩一下吗', '你是不是忘了我在等你']
};
const randomSay = (k) => SAY[k][Math.floor(Math.random() * SAY[k].length)];

let sayTimer = null;
function say(text, ms = 3200) {
  const room = $('#petRoom');
  const old = room.querySelector('.bubble');
  if (old) old.remove();
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  room.appendChild(b);
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => b.remove(), ms);
}

/* 喂食弹层 */
function openFeedSheet() {
  const foods = SHOP.filter(i => i.cat === 'food');
  const rows = foods.map(f => {
    const n = S.inventory[f.id] || 0;
    return `<div class="inv-item">
      <span class="em">${f.emoji}</span>
      <span class="grow"><span class="nm">${f.name}</span><span class="ct" style="display:block">持有 ${n} 个 · ${f.desc}</span></span>
      ${n > 0
        ? `<button class="use-btn" data-feed="${f.id}">喂它</button>`
        : `<button class="use-btn" data-buy="${f.id}" style="background:rgba(255,200,74,.13);color:#ffc84a;border-color:rgba(255,200,74,.28)">${f.price} 买</button>`}
    </div>`;
  }).join('');

  openSheet(`
    <h2>喂点什么好呢</h2>
    <div class="sub">食物可以在「商店 · 食物」里囤货 · 背包共 ${Object.values(S.inventory).reduce((a, b) => a + b, 0)} 件</div>
    <div>${rows}</div>
    <div class="btn-row"><button class="btn" data-close>关闭</button></div>
  `, (el) => {
    el.querySelectorAll('[data-feed]').forEach(btn => {
      btn.addEventListener('click', () => { useFood(btn.dataset.feed); closeSheet(); });
    });
    el.querySelectorAll('[data-buy]').forEach(btn => {
      btn.addEventListener('click', () => { buyItem(btn.dataset.buy); openFeedSheet(); });
    });
  });
}

function useFood(id) {
  const item = SHOP.find(x => x.id === id);
  if (!item || (S.inventory[id] || 0) <= 0) { toast('背包里没有这个了'); return; }
  S.inventory[id] -= 1;
  if (S.inventory[id] <= 0) delete S.inventory[id];
  const p = S.pet;
  Object.keys(item.eff).forEach(k => {
    if (k === 'bond') p.bondTotal += item.eff[k];
    else p[k] = clamp(p[k] + item.eff[k]);
  });
  p.fed += 1;
  p.lastTick = Date.now();
  petAnim('eat', 1000);
  floatEmoji(item.emoji);
  say(randomSay('pet'));
  beep('coin'); buzz(12);
  toast(`${p.name} 吃掉了${item.name} ${item.emoji}`);
  save();
  renderPet(true); renderPetStats(); renderShop(); renderFeedIfOpen();
}

function renderFeedIfOpen() {
  const sheet = $('#sheetBody');
  if (sheet && sheet.querySelector('[data-feed]')) openFeedSheet();
}

/* ------------------------------------------------------------
 * 6. 任务
 * ---------------------------------------------------------- */
function addTask(title, opts = {}) {
  title = String(title || '').trim();
  if (!title) { toast('先写点什么吧'); return; }
  const t = {
    id: uid(), title, tag: opts.tag || '', est: opts.est || 1,
    done: 0, completed: false, created: Date.now(), completedAt: null
  };
  S.tasks.unshift(t);
  save();
  renderTasks();
  toast('任务已添加');
  return t;
}

let taskFilter = 'active';
function renderTasks() {
  const list = $('#taskList');
  let items = S.tasks.slice();
  if (taskFilter === 'active') items = items.filter(t => !t.completed);
  else if (taskFilter === 'done') items = items.filter(t => t.completed);

  if (!items.length) {
    list.innerHTML = `<div class="empty"><span class="em">🗂</span>${taskFilter === 'done' ? '还没有完成的任务' : '还没有任务，先写一个吧'}</div>`;
    return;
  }
  list.innerHTML = items.map(t => `
    <div class="task ${t.completed ? 'done' : ''}" data-id="${t.id}">
      <button class="check" data-check="${t.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6"/></svg>
      </button>
      <div class="grow" data-open="${t.id}">
        <div class="t">${esc(t.title)}</div>
        <div class="meta">
          ${t.tag ? `<span class="tag">${esc(t.tag)}</span>` : ''}
          <span class="pomo-badge">🍅 ${t.done || 0}/${t.est}</span>
          ${t.completed ? '<span class="tiny muted">已完成 +5</span>' : ''}
        </div>
      </div>
      ${t.completed ? '' : `<button class="play" data-play="${t.id}">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l11 7-11 7z"/></svg></button>`}
    </div>`).join('');

  list.querySelectorAll('[data-check]').forEach(b => b.addEventListener('click', (e) => {
    e.stopPropagation(); toggleTask(b.dataset.check);
  }));
  list.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', (e) => {
    e.stopPropagation(); focusOnTask(b.dataset.play);
  }));
  list.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => openTaskDetail(b.dataset.open)));
}

function toggleTask(id) {
  const t = S.tasks.find(x => x.id === id);
  if (!t) return;
  if (t.completed) {
    t.completed = false; t.completedAt = null;
    save(); renderTasks(); toast('已恢复为进行中');
    return;
  }
  t.completed = true; t.completedAt = Date.now();
  addPoints(5, `完成任务：${t.title}`);
  if (S.timer.taskId === id) S.timer.taskId = null;
  buzz([10, 30, 10]); beep('coin');
  toast(`任务完成 +5 积分`);
  save(); renderTasks(); renderTop();
}

function focusOnTask(id) {
  const t = S.tasks.find(x => x.id === id);
  if (!t) return;
  S.timer.taskId = id;
  if (S.timer.mode !== 'focus') setMode('focus', true);
  if (!S.timer.running) S.timer.remain = DUR('focus');
  save();
  switchView('focus');
  renderTimer(); renderPick();
  toast(`开始专注：${t.title}`, 2200);
}

function openTaskDetail(id) {
  const t = S.tasks.find(x => x.id === id);
  if (!t) return;
  openSheet(`
    <h2>任务详情</h2>
    <div class="sub">创建于 ${new Date(t.created).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
    <div class="field"><label>任务名称</label><input id="edTitle" value="${esc(t.title)}" maxlength="60"></div>
    <div class="field"><label>标签（可留空）</label><input id="edTag" value="${esc(t.tag || '')}" placeholder="学习 / 工作 / 阅读" maxlength="12"></div>
    <div class="field"><label>预计番茄数</label>
      <div class="seg" id="edEst">
        ${[1, 2, 3, 4, 6, 8].map(n => `<button data-n="${n}" class="${t.est === n ? 'on' : ''}">${n}</button>`).join('')}
      </div>
    </div>
    <div class="btn-row">
      <button class="btn danger" id="delTask">删除</button>
      <button class="btn primary" id="saveTask">保存</button>
    </div>`, (el) => {
    let est = t.est;
    el.querySelectorAll('#edEst button').forEach(b => b.addEventListener('click', () => {
      est = +b.dataset.n;
      el.querySelectorAll('#edEst button').forEach(x => x.classList.toggle('on', x === b));
    }));
    el.querySelector('#delTask').addEventListener('click', () => {
      S.tasks = S.tasks.filter(x => x.id !== id);
      if (S.timer.taskId === id) S.timer.taskId = null;
      save(); closeSheet(); renderTasks(); renderPick(); renderTop(); toast('任务已删除');
    });
    el.querySelector('#saveTask').addEventListener('click', () => {
      const ti = el.querySelector('#edTitle').value.trim();
      if (!ti) { toast('名称不能为空'); return; }
      t.title = ti;
      t.tag = el.querySelector('#edTag').value.trim();
      t.est = est;
      save(); closeSheet(); renderTasks(); renderPick(); toast('已保存');
    });
  });
}

/* ------------------------------------------------------------
 * 7. 商店
 * ---------------------------------------------------------- */
let shopCat = 'food';

function renderShop() {
  $('#shopPoints').textContent = S.points;
  const today = dayKey();
  const income = S.ledger.filter(l => dayKey(l.ts) === today && l.delta > 0).reduce((a, b) => a + b.delta, 0);
  $('#shopTodayIncome').textContent = '+' + income;
  $$('#shopTabs button').forEach(b => b.classList.toggle('on', b.dataset.cat === shopCat));

  const body = $('#shopBody');
  if (shopCat === 'bag') { body.innerHTML = renderBag(); bindBag(); return; }

  const items = SHOP.filter(i => i.cat === shopCat);
  body.innerHTML = `<div class="grid">${items.map(it => {
    const owned = S.inventory[it.id] || 0;
    const equipped = it.cat === 'wear' && S.pet.equipped[it.slot] === it.id;
    const canAfford = S.points >= it.price;
    return `<div class="item ${equipped ? 'eq' : ''}">
      ${owned ? `<span class="badge">×${owned}</span>` : ''}
      <div class="emoji">${it.emoji}</div>
      <div class="nm">${it.name}</div>
      <div class="ds">${it.desc}</div>
      <button class="buy ${equipped ? 'own' : ''}" data-buy="${it.id}" ${canAfford || owned ? '' : 'style="opacity:.45"'}>
        ${equipped ? '已穿戴' : owned && it.cat === 'wear' ? '再买一件 · ' + it.price : '🪙 ' + it.price}
      </button>
    </div>`;
  }).join('')}</div>`;
  body.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => buyItem(b.dataset.buy)));
}

function renderBag() {
  const entries = Object.keys(S.inventory).filter(k => S.inventory[k] > 0);
  if (!entries.length) return `<div class="empty"><span class="em">🎒</span>背包空空的<br>去商店囤点货吧</div>`;
  const grouped = { food: [], toy: [], wear: [] };
  entries.forEach(k => {
    const it = SHOP.find(x => x.id === k);
    if (it) grouped[it.cat].push({ ...it, count: S.inventory[k] });
  });
  const titles = { food: '🍖 食物', toy: '🎾 玩具', wear: '🎀 服饰' };
  return Object.keys(grouped).filter(k => grouped[k].length).map(cat => `
    <h3 class="sec">${titles[cat]}</h3>
    <div class="card">
      ${grouped[cat].map(it => {
        const equipped = cat === 'wear' && S.pet.equipped[it.slot] === it.id;
        return `<div class="inv-item">
          <span class="em">${it.emoji}</span>
          <span class="grow"><span class="nm">${it.name}</span><span class="ct" style="display:block">×${it.count} · ${it.desc}</span></span>
          ${cat === 'wear'
            ? `<button class="use-btn" data-equip="${it.id}">${equipped ? '脱下' : '穿戴'}</button>`
            : `<button class="use-btn" data-use="${it.id}">${cat === 'food' ? '喂食' : '玩耍'}</button>`}
        </div>`;
      }).join('')}
    </div>`).join('');
}

function bindBag() {
  $$('#shopBody [data-use]').forEach(b => b.addEventListener('click', () => {
    const it = SHOP.find(x => x.id === b.dataset.use);
    if (!it) return;
    if (it.cat === 'food') useFood(it.id);
    else useToy(it.id);
    renderShop();
  }));
  $$('#shopBody [data-equip]').forEach(b => b.addEventListener('click', () => {
    const it = SHOP.find(x => x.id === b.dataset.equip);
    if (!it) return;
    const eq = S.pet.equipped;
    eq[it.slot] = eq[it.slot] === it.id ? null : it.id;
    save();
    renderPet(true); renderPetStats(); renderShop();
    toast(eq[it.slot] ? `已为 ${S.pet.name} 穿上${it.name}` : `已脱下${it.name}`);
    buzz(8);
  }));
}

function useToy(id) {
  const it = SHOP.find(x => x.id === id);
  if (!it || (S.inventory[id] || 0) <= 0) return;
  if (S.pet.energy < 15) { toast('它太累了，先歇歇'); return; }
  S.inventory[id] -= 1;
  if (S.inventory[id] <= 0) delete S.inventory[id];
  const p = S.pet;
  Object.keys(it.eff).forEach(k => {
    if (k === 'bond') p.bondTotal += it.eff[k];
    else p[k] = clamp(p[k] + it.eff[k]);
  });
  petAnim('dance', 1300);
  floatEmoji(it.emoji);
  say(randomSay('play'));
  toast(`${p.name} 玩得很开心（心情 +${it.eff.mood || 0}）`);
  beep('coin');
  save(); renderPet(true); renderPetStats();
}

function buyItem(id) {
  const it = SHOP.find(x => x.id === id);
  if (!it) return;
  if (S.points < it.price) { toast(`还差 ${it.price - S.points} 积分，再专注一会儿吧`); return; }
  addPoints(-it.price, `购买 ${it.name}`);
  S.inventory[id] = (S.inventory[id] || 0) + 1;
  save();
  beep('coin'); buzz(8);
  toast(`已购买 ${it.emoji} ${it.name}`);
  renderShop(); renderPetStats();
}

/* ------------------------------------------------------------
 * 8. 我的 / 签到 / 设置
 * ---------------------------------------------------------- */
function streakInfo() {
  const st = S.streak;
  if (!st.lastCheck) return { count: 0, alive: false };
  const diff = Math.floor((new Date(dayKey()).getTime() - new Date(st.lastCheck).getTime()) / DAY);
  return { count: diff <= 1 ? st.count : 0, alive: diff <= 1, checkedToday: st.lastCheck === dayKey() };
}

function signIn() {
  const today = dayKey();
  const st = S.streak;
  if (st.lastCheck === today) { toast('今天已经签到过啦'); return; }
  const y = dayKey(Date.now() - DAY);
  st.count = st.lastCheck === y ? st.count + 1 : 1;
  st.lastCheck = today;
  st.best = Math.max(st.best, st.count);
  const bonus = Math.min(st.count - 1, 5) * 2;
  const pts = 10 + bonus;
  addPoints(pts, `签到 · 连续 ${st.count} 天`);
  beep('coin'); buzz([12, 40, 12]);
  toast(`签到成功 +${pts} 积分${bonus ? `（连续 ${st.count} 天加成 +${bonus}）` : ''}`, 2400);
  renderMe(); renderTop();
}

function renderMe() {
  const lv = levelInfo();
  $('#meLvTxt').textContent = `${lv.title} · Lv.${lv.lv}`;
  $('#meLvSub').textContent = `累计专注 ${S.totalFocusMin} 分钟`;
  $('#meLvNeed').textContent = `还需 ${lv.need - lv.into} 分钟`;
  $('#meLvBar').style.width = (lv.into / lv.need * 100) + '%';

  const si = streakInfo();
  const btn = $('#btnSign');
  if (si.checkedToday) {
    btn.textContent = `今日已签到 · 连续 ${si.count} 天`;
    btn.style.opacity = '.5'; btn.style.pointerEvents = 'none';
    $('#meSignState').textContent = `🔥 连续 ${si.count} 天`;
  } else {
    btn.textContent = si.alive ? `每日签到 +${10 + Math.min(si.count, 5) * 2}` : '每日签到 +10';
    btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
    $('#meSignState').textContent = si.count ? `🔥 已断签（上次 ${si.count} 天）` : '';
  }

  $('#sTotalPomo').textContent = S.totalPomodoros;
  $('#sTotalMin').innerHTML = S.totalFocusMin + '<small>分</small>';
  $('#sStreak').innerHTML = Math.max(S.streak.best, si.count) + '<small>天</small>';
  $('#sTasks').textContent = S.tasks.filter(t => t.completed).length;

  const logs = S.logs.slice(0, 8);
  $('#logList').innerHTML = logs.length ? logs.map(l => `
    <div class="li" style="cursor:default">
      <span class="ic">${l.type === 'focus' ? '🍅' : l.type === 'short' ? '☕' : '🌿'}</span>
      <span class="tx">${l.type === 'focus' ? (l.task ? esc(l.task) : '自由专注') : '休息'}
        <small>${new Date(l.ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${l.minutes} 分钟</small></span>
      <span class="tiny" style="color:${l.points ? '#ffc84a' : '#616c7d'};font-weight:700">${l.points ? '+' + l.points : '—'}</span>
    </div>`).join('') : `<div class="empty" style="padding:26px">还没有记录</div>`;

  $('#durSub').textContent = `专注 ${S.settings.focus} · 短休 ${S.settings.short} · 长休 ${S.settings.long}`;
  $('#petSub').textContent = `${S.pet.name} · ${S.pet.type === 'dog' ? '小狗' : '小猫'}`;
  $('#swSound').classList.toggle('on', S.settings.sound);
  $('#swVibrate').classList.toggle('on', S.settings.vibrate);
}

function openDurationSheet() {
  openSheet(`
    <h2>时长设置</h2>
    <div class="sub">按自己的节奏来，改变后立即生效</div>
    <div class="field"><label>专注时长（分钟）</label>
      <div class="seg" data-key="focus">${[15, 20, 25, 30, 45, 60].map(n => `<button data-n="${n}" class="${S.settings.focus === n ? 'on' : ''}">${n}</button>`).join('')}</div>
    </div>
    <div class="field"><label>短休息（分钟）</label>
      <div class="seg" data-key="short">${[3, 5, 8, 10].map(n => `<button data-n="${n}" class="${S.settings.short === n ? 'on' : ''}">${n}</button>`).join('')}</div>
    </div>
    <div class="field"><label>长休息（分钟）</label>
      <div class="seg" data-key="long">${[10, 15, 20, 30].map(n => `<button data-n="${n}" class="${S.settings.long === n ? 'on' : ''}">${n}</button>`).join('')}</div>
    </div>
    <div class="field"><label>每几个番茄进入长休息</label>
      <div class="seg" data-key="longEvery">${[2, 3, 4, 5].map(n => `<button data-n="${n}" class="${S.settings.longEvery === n ? 'on' : ''}">${n}</button>`).join('')}</div>
    </div>
    <div class="li" style="border:0;padding-left:0"><span class="ic">🔁</span><span class="tx">结束后自动开始下一段<small>专注完直接进休息，反之亦然</small></span>
      <div class="switch ${S.settings.autoNext ? 'on' : ''}" id="swAuto"><i></i></div></div>
    <div class="btn-row"><button class="btn primary" data-close>完成</button></div>`, (el) => {
    el.querySelectorAll('.seg').forEach(seg => {
      seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        S.settings[seg.dataset.key] = +b.dataset.n;
        seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        if (!S.timer.running && S.timer.mode === 'focus') { S.timer.remain = DUR('focus'); }
        save(); renderTimer(); renderChips(); renderMe(); renderTop();
      }));
    });
    el.querySelector('#swAuto').addEventListener('click', (e) => {
      S.settings.autoNext = !S.settings.autoNext;
      e.currentTarget.classList.toggle('on', S.settings.autoNext);
      save();
    });
  });
}

function openPetSheet() {
  const p = S.pet;
  openSheet(`
    <h2>宠物设置</h2>
    <div class="sub">换名字、换毛色，随时都可以</div>
    <div class="field"><label>它叫什么</label><input id="pn" value="${esc(p.name)}" maxlength="10"></div>
    <div class="field"><label>毛色</label>
      <div class="seg" id="pv">
        ${['奶油', '银灰', '墨黑', '橘色'].map((n, i) => `<button data-n="${i}" class="${p.variant === i ? 'on' : ''}">${n}</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>宠物类型（切换不会清空数据）</label>
      <div class="seg" id="pt">
        <button data-n="cat" class="${p.type === 'cat' ? 'on' : ''}">🐱 小猫</button>
        <button data-n="dog" class="${p.type === 'dog' ? 'on' : ''}">🐶 小狗</button>
      </div>
    </div>
    <div class="btn-row"><button class="btn" data-close>取消</button><button class="btn primary" id="petSave">保存</button></div>`, (el) => {
    let variant = p.variant, type = p.type;
    el.querySelectorAll('#pv button').forEach(b => b.addEventListener('click', () => {
      variant = +b.dataset.n;
      el.querySelectorAll('#pv button').forEach(x => x.classList.toggle('on', x === b));
    }));
    el.querySelectorAll('#pt button').forEach(b => b.addEventListener('click', () => {
      type = b.dataset.n;
      el.querySelectorAll('#pt button').forEach(x => x.classList.toggle('on', x === b));
    }));
    el.querySelector('#petSave').addEventListener('click', () => {
      const nm = el.querySelector('#pn').value.trim() || '团子';
      S.pet.name = nm; S.pet.variant = variant; S.pet.type = type;
      save(); closeSheet();
      renderPet(true); renderPetStats(); renderMe(); toast('已更新');
    });
  });
}

/* 导出 / 导入 */
function exportData() {
  const json = JSON.stringify(S, null, 2);
  /* 桌面浏览器直接下载；Android WebView 不支持 <a download>，改为展示文本让用户复制 */
  if (!Native.ok) {
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `focuspet-${dayKey()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    } catch (e) { /* ignore */ }
  }
  openSheet(`
    <h2>数据备份</h2>
    <p class="sub">这份文字就是你的全部进度。长按全选复制，存进备忘录或网盘；换手机时粘贴到「导入备份」即可原样恢复。</p>
    <textarea id="expBox" class="backup-box" readonly spellcheck="false">${esc(json)}</textarea>
    <div class="btn-row">
      <button class="btn ghost" id="expClose">关闭</button>
      <button class="btn primary" id="expCopy">复制全部</button>
    </div>
  `, (body) => {
    body.querySelector('#expClose').addEventListener('click', closeSheet);
    body.querySelector('#expCopy').addEventListener('click', () => {
      const ta = body.querySelector('#expBox');
      ta.removeAttribute('readonly');
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.setAttribute('readonly', 'readonly');
      toast(ok ? '已复制到剪贴板 ✅' : '长按文本框全选后复制');
    });
  });
  return json;
}

function importText(txt) {
  try {
    const d = JSON.parse(txt);
    if (!d || !d.pet || !d.timer) throw new Error('格式不对');
    const base = defaultState();
    S = {
      ...base, ...d,
      settings: { ...base.settings, ...(d.settings || {}) },
      timer: { ...base.timer, ...(d.timer || {}), running: false, endAt: null },
      pet: { ...base.pet, ...(d.pet || {}), equipped: { ...base.pet.equipped, ...((d.pet || {}).equipped || {}) } },
      streak: { ...base.streak, ...(d.streak || {}) }
    };
    S.timer.remain = DUR(S.timer.mode);
    save(); petSig = '';
    renderAll();
    closeSheet();
    toast('导入成功，进度已恢复');
    return true;
  } catch (e) {
    toast('导入失败：内容不是有效的备份');
    return false;
  }
}

function openImportSheet() {
  openSheet(`
    <h2>导入备份</h2>
    <p class="sub">把之前复制的那段备份文字整段粘贴进来。</p>
    <textarea id="impBox" class="backup-box" placeholder='{"points":120,"pet":{...}}' spellcheck="false"></textarea>
    <div class="btn-row">
      <button class="btn ghost" id="impCancel">取消</button>
      <button class="btn primary" id="impOk">恢复进度</button>
    </div>
  `, (body) => {
    body.querySelector('#impCancel').addEventListener('click', closeSheet);
    body.querySelector('#impOk').addEventListener('click', () => {
      const txt = body.querySelector('#impBox').value.trim();
      if (!txt) { toast('先粘贴备份内容'); return; }
      importText(txt);
    });
  });
}

function importData(file) {
  const fr = new FileReader();
  fr.onload = () => importText(String(fr.result));
  fr.readAsText(file);
}

/* ------------------------------------------------------------
 * 9. 渲染层
 * ---------------------------------------------------------- */
function renderTop() {
  $('#pointsNum').textContent = S.points;
  const today = dayKey();
  const todayLogs = S.logs.filter(l => l.day === today && l.type === 'focus');
  const todayMin = todayLogs.reduce((a, b) => a + b.minutes, 0);
  const si = streakInfo();
  $('#streakLine').textContent = `🔥 ${si.count ? '连续 ' + si.count + ' 天' : '今天开始第一天'} · 今日 ${todayLogs.length} 个番茄`;
  $('#todayPomo').textContent = todayLogs.length;
  $('#todayMin').innerHTML = todayMin + '<small style="font-size:11px;color:#616c7d"> 分</small>';
  const earned = S.ledger.filter(l => dayKey(l.ts) === today && l.delta > 0).reduce((a, b) => a + b.delta, 0);
  $('#todayPts').textContent = '+' + earned;
  $('#greet').textContent = greeting();
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '还没睡？先专注一小会儿吧';
  if (h < 11) return '早上好，今天从第一个番茄开始';
  if (h < 14) return '中午好，吃饱再干活';
  if (h < 19) return '下午好，来一段心流吧';
  if (h < 23) return '晚上好，收个尾就休息';
  return '夜深了，专注完早点睡';
}

function paintTimer() {
  const t = S.timer;
  const total = DUR(t.mode);
  const left = Math.max(0, t.remain);
  $('#timeText').textContent = fmtClock(left);
  const pct = total ? (1 - left / total) : 0;
  const prog = $('#dialProg');
  prog.style.strokeDashoffset = String(C * (1 - Math.min(1, Math.max(0, pct))));
  prog.setAttribute('stroke', t.mode === 'focus' ? 'url(#gFocus)' : 'url(#gBreak)');
  $('#stateText').textContent =
    t.running ? (t.mode === 'focus' ? '专注中' : '休息中') :
      left < total ? '已暂停' : (t.mode === 'focus' ? '准备开始' : '随时休息');
  document.title = t.running ? `${fmtClock(left)} · ${t.mode === 'focus' ? '专注' : '休息'}` : '番茄宠物 · FocusPet';
}

function renderTimer() {
  const t = S.timer;
  const btn = $('#btnMain');
  if (t.running) btn.textContent = '暂停';
  else if (t.remain < DUR(t.mode)) btn.textContent = '继续';
  else btn.textContent = t.mode === 'focus' ? '开始专注' : '开始休息';
  paintTimer();
  renderChips();
  renderRound();
  renderPick();
}

function renderChips() {
  $$('#modeChips .chip').forEach(b => {
    const m = b.dataset.mode;
    b.classList.toggle('on', m === S.timer.mode);
    b.textContent = `${m === 'focus' ? '专注' : m === 'short' ? '短休' : '长休'} ${S.settings[m]}`;
  });
}

function renderRound() {
  const n = Math.max(2, S.settings.longEvery);
  const cur = ((S.timer.round - 1) % n) + 1;
  $('#roundDots').innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < cur ? 'on' : ''}"></i>`).join('');
  const goal = S.settings.dailyGoal;
  const done = S.logs.filter(l => l.day === dayKey() && l.type === 'focus').length;
  $('#goalTxt').textContent = `${done} / ${goal}`;
  $('#goalBar').style.width = Math.min(100, done / goal * 100) + '%';
}

function renderPick() {
  const t = S.tasks.find(x => x.id === S.timer.taskId);
  $('#pickTitle').textContent = t ? t.title : '未选择任务（自由专注）';
  $('#pickDot').style.background = t ? 'var(--tomato)' : 'var(--mint)';
}

function renderAll() {
  renderTop(); renderTimer(); renderTasks(); renderPet(true); renderPetStats(); renderShop(); renderMe();
}

/* 视图切换 */
function switchView(v) {
  $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  $$('#tabbar .tab').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (v === 'shop') renderShop();
  if (v === 'pet') { decayPet(); renderPet(true); renderPetStats(); }
  if (v === 'me') renderMe();
}

/* ------------------------------------------------------------
 * 10. 事件绑定
 * ---------------------------------------------------------- */
function bind() {
  // 底栏
  $$('#tabbar .tab').forEach(b => b.addEventListener('click', () => switchView(b.dataset.v)));

  // 模式
  $$('#modeChips .chip').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  // 主按钮
  $('#btnMain').addEventListener('click', () => { S.timer.running ? pauseTimer() : startTimer(); renderTimer(); });
  $('#btnReset').addEventListener('click', () => { resetTimer(); toast('已重置'); });
  $('#btnSkip').addEventListener('click', () => skipSession());

  // 任务选择
  $('#taskPick').addEventListener('click', openTaskPicker);
  $('#jumpTasks').addEventListener('click', () => switchView('tasks'));
  $('#jumpShop').addEventListener('click', () => switchView('shop'));
  $('#btnGoal').addEventListener('click', openGoalSheet);

  // 快速添加
  $('#quickBtn').addEventListener('click', () => { addTask($('#quickInput').value); $('#quickInput').value = ''; });
  $('#quickInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { addTask($('#quickInput').value); $('#quickInput').value = ''; }
  });
  $$('#taskFilters button').forEach(b => b.addEventListener('click', () => {
    taskFilter = b.dataset.f;
    $$('#taskFilters button').forEach(x => x.classList.toggle('on', x === b));
    renderTasks();
  }));

  // 宠物互动
  $$('#petRoom .actions button').forEach(b => b.addEventListener('click', () => petAction(b.dataset.act)));
  $('#petStage').addEventListener('click', () => petAction('pet'));

  // 商店分类
  $$('#shopTabs button').forEach(b => b.addEventListener('click', () => { shopCat = b.dataset.cat; renderShop(); }));

  // 我的
  $('#btnSign').addEventListener('click', signIn);
  $('#setDur').addEventListener('click', openDurationSheet);
  $('#setPet').addEventListener('click', openPetSheet);
  $('#swSound').addEventListener('click', (e) => {
    S.settings.sound = !S.settings.sound;
    e.currentTarget.classList.toggle('on', S.settings.sound); save();
    if (S.settings.sound) beep('coin');
  });
  $('#swVibrate').addEventListener('click', (e) => {
    S.settings.vibrate = !S.settings.vibrate;
    e.currentTarget.classList.toggle('on', S.settings.vibrate); save();
    if (S.settings.vibrate) buzz(20);
  });
  $('#btnExport').addEventListener('click', exportData);
  $('#btnImport').addEventListener('click', openImportSheet);
  $('#fileIn').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) importData(f);
    e.target.value = '';
  });
  $('#btnReset').addEventListener('click', () => {
    openSheet(`
      <h2>清空所有数据？</h2>
      <div class="sub">番茄记录、积分、任务、宠物都会被删除，且无法恢复。</div>
      <div class="btn-row"><button class="btn" data-close>再想想</button>
      <button class="btn danger" id="doReset">确认清空</button></div>`, (el) => {
      el.querySelector('#doReset').addEventListener('click', () => {
        localStorage.removeItem(STORE_KEY);
        location.reload();
      });
    });
  });

  // 弹层关闭
  $('#mask').addEventListener('click', (e) => {
    if (e.target.id === 'mask' || e.target.hasAttribute('data-close')) closeSheet();
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-close]');
    if (t && $('#mask').classList.contains('on')) closeSheet();
  });

  // 切后台回来：校正时间
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      decayPet();
      if (S.timer.running) tickTimer();
      renderTimer(); renderPet(true); renderPetStats(); renderTop();
    } else if (S.timer.running && wakeLock === null) {
      // 记录一次，回前台再结算
    }
  });
}

function openTaskPicker() {
  const items = S.tasks.filter(t => !t.completed);
  openSheet(`
    <h2>选一个任务</h2>
    <div class="sub">专注结束后，这个任务会 +1 个番茄</div>
    <div class="list" style="margin-top:0;border:0;background:none">
      <button class="li" data-pick="" style="border-radius:14px;background:var(--card);border:1px solid var(--line);margin-bottom:8px">
        <span class="ic">🌿</span><span class="tx">自由专注<small>不绑定任务</small></span>
        ${!S.timer.taskId ? '<span style="color:#3ddc97">✓</span>' : ''}</button>
      ${items.map(t => `<button class="li" data-pick="${t.id}" style="border-radius:14px;background:var(--card);border:1px solid var(--line);margin-bottom:8px">
        <span class="ic">🍅</span><span class="tx">${esc(t.title)}<small>${t.done || 0}/${t.est} 个番茄${t.tag ? ' · ' + esc(t.tag) : ''}</small></span>
        ${S.timer.taskId === t.id ? '<span style="color:#3ddc97">✓</span>' : ''}</button>`).join('')}
    </div>
    ${items.length ? '' : `<div class="empty" style="padding:18px">还没有进行中的任务</div>`}
    <div class="btn-row"><button class="btn" data-close>取消</button>
      <button class="btn primary" id="newT">新建任务</button></div>`, (el) => {
    el.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
      S.timer.taskId = b.dataset.pick || null;
      save(); closeSheet(); renderPick(); renderTimer();
      toast(S.timer.taskId ? '已绑定任务' : '已切换为自由专注');
    }));
    el.querySelector('#newT').addEventListener('click', () => {
      closeSheet(); switchView('tasks'); setTimeout(() => $('#quickInput').focus(), 260);
    });
  });
}

function openGoalSheet() {
  openSheet(`
    <h2>今日目标</h2>
    <div class="sub">今天打算完成几个番茄？达成后有 +20 积分奖励</div>
    <div class="seg" id="gseg">${[2, 3, 4, 6, 8, 10, 12].map(n => `<button data-n="${n}" class="${S.settings.dailyGoal === n ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="btn-row"><button class="btn primary" data-close>知道了</button></div>`, (el) => {
    el.querySelectorAll('#gseg button').forEach(b => b.addEventListener('click', () => {
      S.settings.dailyGoal = +b.dataset.n;
      el.querySelectorAll('#gseg button').forEach(x => x.classList.toggle('on', x === b));
      save(); renderRound(); renderTop();
      if (S.goalAward === dayKey()) S.goalAward = null;
    }));
  });
}

/* ------------------------------------------------------------
 * 11. 启动
 * ---------------------------------------------------------- */
function buildSky() {
  const sky = $('#petSky');
  let html = '';
  for (let i = 0; i < 26; i++) {
    const s = 1 + Math.random() * 2.2;
    html += `<i class="star" style="left:${Math.random() * 100}%;top:${Math.random() * 62}%;width:${s}px;height:${s}px;animation-delay:${(Math.random() * 3).toFixed(1)}s"></i>`;
  }
  html += `<div style="position:absolute;right:22px;top:92px;font-size:26px;opacity:.7;filter:drop-shadow(0 0 18px rgba(255,240,180,.4))">🌙</div>`;
  sky.innerHTML = html;
}

function boot() {
  buildSky();
  bind();

  // 结算掉线期间结束的计时
  if (S.timer.running && S.timer.endAt && Date.now() >= S.timer.endAt) {
    completeSession();
  } else if (S.timer.running) {
    S.timer.remain = Math.max(0, Math.round((S.timer.endAt - Date.now()) / 1000));
  }

  decayPet();
  renderAll();

  // 每 250ms 心跳
  setInterval(tickTimer, 250);
  // 宠物状态每 45 秒衰减
  setInterval(() => { decayPet(); renderPetStats(); renderPet(false); }, 45000);

  // 首次引导
  if (!S.onboarded) setTimeout(openOnboarding, 500);

  // PWA
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // 宠物随机说话
  setInterval(() => {
    if (document.getElementById('view-pet').classList.contains('active') && Math.random() < 0.5) {
      const p = S.pet;
      if (p.hunger < 30) say(randomSay('hungry'));
      else if (p.mood < 40) say(randomSay('sad'));
      else if (p.mood > 80 && Math.random() < 0.6) say(randomSay('happy'));
    }
  }, 22000);
}

function openOnboarding() {
  openSheet(`
    <div class="onboard">
      <div style="font-size:44px">🍅</div>
      <h2>欢迎来到番茄宠物</h2>
      <div class="sub">专注 25 分钟 → 赚积分 → 养大你的小宠物</div>
      <div class="pet-choice" id="pc">
        <button data-t="cat" class="on"><span class="em">🐱</span><span class="nm">小猫</span><div class="ds">傲娇又黏人</div></button>
        <button data-t="dog"><span class="em">🐶</span><span class="nm">小狗</span><div class="ds">热情小跟班</div></button>
      </div>
      <div class="field"><label>给它起个名字</label><input id="obName" value="${esc(S.pet.name)}" maxlength="10" placeholder="团子"></div>
      <div class="btn-row"><button class="btn primary" id="obDone" style="flex:1">开始养它</button></div>
    </div>`, (el) => {
    let type = 'cat';
    el.querySelectorAll('#pc button').forEach(b => b.addEventListener('click', () => {
      type = b.dataset.t;
      el.querySelectorAll('#pc button').forEach(x => x.classList.toggle('on', x === b));
      el.querySelector('#obName').value = type === 'dog' ? '豆豆' : '团子';
    }));
    el.querySelector('#obDone').addEventListener('click', () => {
      S.pet.type = type;
      S.pet.name = el.querySelector('#obName').value.trim() || (type === 'dog' ? '豆豆' : '团子');
      S.onboarded = true;
      save(); closeSheet();
      renderAll();
      switchView('pet');
      setTimeout(() => say(`我叫${S.pet.name}，以后请多指教！`), 700);
    });
  });
}

/* 调试接口：供桌面浏览器 / 自动化冒烟测试调用，不参与玩法逻辑 */
try {
  window.__fp = {
    get S() { return S; },
    addTask: addTask, startTimer: startTimer, pauseTimer: pauseTimer, resetTimer: resetTimer,
    skipSession: skipSession, tickTimer: tickTimer, completeSession: completeSession,
    buyItem: buyItem, useFood: useFood, useToy: useToy, petAction: petAction,
    signIn: signIn, levelInfo: levelInfo, exportData: exportData, importData: importData,
    importText: importText, openImportSheet: openImportSheet,
    decayPet: decayPet, closeSheet: closeSheet, switchView: switchView, save: save,
    SHOP: SHOP, DUR: DUR
  };
} catch (e) { /* ignore */ }

document.addEventListener('DOMContentLoaded', boot);
