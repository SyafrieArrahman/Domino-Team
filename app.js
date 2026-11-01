const TARGET = 10;
const TEAM_AVATARS = ['🐻','🦊','🐼','🐯','🐸','🐰','🐱','🐶'];
const initialState = () => ({
  setupComplete: false,
  matchPointTarget: null,
  gameStartedAt: null,
  teams: {
    a: { name: 'Tim A', players: ['Pemain 1', 'Pemain 2'], avatar: '🐻', score: 0, wins: 0, matches: 0 },
    b: { name: 'Tim B', players: ['Pemain 3', 'Pemain 4'], avatar: '🐸', score: 0, wins: 0, matches: 0 },
  },
  waitingTeams: [],
  history: [],
});

let state;
try {
  const saved = JSON.parse(localStorage.getItem('domino-team-state'));
  const fresh = initialState();
  state = saved && typeof saved === 'object' ? {
    ...fresh,
    ...saved,
    setupComplete: typeof saved.setupComplete === 'boolean' ? saved.setupComplete : false,
    matchPointTarget: Number.isInteger(Number(saved.matchPointTarget)) && Number(saved.matchPointTarget) > 0 ? Number(saved.matchPointTarget) : null,
    gameStartedAt: Number.isFinite(Number(saved.gameStartedAt)) && Number(saved.gameStartedAt) > 0 ? Number(saved.gameStartedAt) : (saved.setupComplete ? Date.now() : null),
    teams: Object.fromEntries(['a','b'].map((key) => {
      const oldTeam = saved.teams?.[key] || {};
      const defaultPlayers = fresh.teams[key].players;
      const savedPlayers = Array.isArray(oldTeam.players) ? oldTeam.players : [];
      return [key, { ...fresh.teams[key], ...oldTeam,
        players: [0, 1].map((index) => typeof savedPlayers[index] === 'string' && savedPlayers[index].trim() ? savedPlayers[index] : defaultPlayers[index]),
        avatar: TEAM_AVATARS.includes(oldTeam.avatar) ? oldTeam.avatar : fresh.teams[key].avatar,
        score: Number(oldTeam.score) || 0, wins: Number(oldTeam.wins) || 0, matches: Number(oldTeam.matches) || 0 }];
    })),
    waitingTeams: Array.isArray(saved.waitingTeams)
      ? saved.waitingTeams.filter((team) => team && typeof team === 'object').map((team, index) => ({
          name: typeof team.name === 'string' && team.name.trim() ? team.name.trim() : `Tim antrean ${index + 1}`,
          players: Array.isArray(team.players) ? [0, 1].map((i) => typeof team.players[i] === 'string' && team.players[i].trim() ? team.players[i].trim() : `Pemain ${i + 1}`) : ['Pemain 1', 'Pemain 2'],
          avatar: TEAM_AVATARS.includes(team.avatar) ? team.avatar : '🦊',
        }))
      : Array.isArray(saved.queue)
        ? Array.from({ length: Math.ceil(saved.queue.length / 2) }, (_, index) => ({
            name: `Tim antrean ${index + 1}`,
            players: [saved.queue[index * 2], saved.queue[index * 2 + 1]].map((name, i) => typeof name === 'string' && name.trim() ? name.trim() : `Pemain ${i + 1}`),
            avatar: '🦊',
          }))
        : [],
    history: Array.isArray(saved.history) ? saved.history : [],
  } : fresh;
} catch { state = initialState(); }
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function save() {
  try { localStorage.setItem('domino-team-state', JSON.stringify(state)); }
  catch { /* The live game remains usable when browser storage is unavailable. */ }
}
function renderPlayerLists() {
  const roster = $('#rosterList');
  if (roster) {
    roster.replaceChildren();
    ['a','b'].forEach((key) => {
      const team = state.teams[key];
      team.players.forEach((player) => {
        const item = document.createElement('li');
        const teamTag = document.createElement('span');
        teamTag.className = `roster-team roster-${key}`;
        teamTag.textContent = `${team.avatar || '🐻'} ${team.name}`;
        const playerName = document.createElement('span');
        playerName.className = 'roster-name';
        playerName.textContent = player;
        item.append(teamTag, playerName);
        roster.append(item);
      });
    });
    state.waitingTeams.forEach((waitingTeam) => {
      const item = document.createElement('li');
      const queueTag = document.createElement('span');
      queueTag.className = 'roster-team roster-waiting';
      queueTag.textContent = `${waitingTeam.avatar || '🦊'} ${waitingTeam.name}`;
      const playerName = document.createElement('span');
      playerName.className = 'roster-name';
      playerName.textContent = waitingTeam.players.join(' & ');
      item.append(queueTag, playerName);
      roster.append(item);
    });
  }
  const queueList = $('#queueList');
  if (queueList) {
    queueList.replaceChildren();
    state.waitingTeams.forEach((team, i) => {
      const item = document.createElement('li');
      const index = document.createElement('span');
      index.className = 'queue-index';
      index.textContent = String(i + 1).padStart(2, '0');
      const teamInfo = document.createElement('span');
      teamInfo.className = 'queue-team-info';
      const teamName = document.createElement('strong');
      teamName.textContent = team.name;
      const playerNames = document.createElement('small');
      playerNames.textContent = team.players.join(' & ');
      teamInfo.append(teamName, playerNames);
      const remove = document.createElement('button');
      remove.className = 'remove-player';
      remove.dataset.remove = String(i);
      remove.setAttribute('aria-label', `Hapus ${team.name}`);
      remove.textContent = '×';
      item.append(index, teamInfo, remove);
      queueList.append(item);
    });
  }
  const count = $('#queueCount');
  if (count) count.textContent = state.waitingTeams.length;
  const empty = $('#emptyQueue');
  if (empty) empty.classList.toggle('hidden', state.waitingTeams.length > 0);
}
function render() {
  const setupScreen = $('#setupScreen');
  const appShell = $('.app-shell');
  setupScreen.hidden = state.setupComplete;
  appShell.hidden = !state.setupComplete;
  if (!state.setupComplete) { save(); return; }
  renderPlayerLists();
  const pendingMatch = state.matchPointTarget !== null && state.waitingTeams.length === 0 && ['a','b'].some((key) => state.teams[key].matches >= state.matchPointTarget);
  ['a','b'].forEach((key) => {
    const team = state.teams[key];
    $(`#team${key.toUpperCase()}Name`).textContent = team.name;
    $(`#${key}Player1`).textContent = team.players[0];
    $(`#${key}Player2`).textContent = team.players[1];
    document.querySelectorAll(`[data-team-avatar="${key}"]`).forEach((avatar) => { avatar.textContent = team.avatar || (key === 'a' ? '🐻' : '🐸'); });
    $(`#${key}Score`).textContent = team.score;
    $(`#${key}Wins`).textContent = state.matchPointTarget === null ? `${team.matches} match point` : `${team.matches} / ${state.matchPointTarget} match point`;
  });
  $('#aSeatTeamTop').textContent = state.teams.a.name;
  $('#aSeatTeamBottom').textContent = state.teams.a.name;
  $('#bSeatTeamLeft').textContent = state.teams.b.name;
  $('#bSeatTeamRight').textContent = state.teams.b.name;
  $('#headerTeamAName').textContent = state.teams.a.name;
  $('#headerTeamBName').textContent = state.teams.b.name;
  $('#modeLabel').textContent = pendingMatch ? 'WINNER MENUNGGU' : state.matchPointTarget === null ? 'MATCH TANPA BATAS' : 'PERTANDINGAN';
  $('#targetLabel').textContent = state.matchPointTarget === null ? '10 poin → 1 match point · tanpa batas' : `10 poin → 1 match point · target ${state.matchPointTarget}`;
  updateGameTimer();
  $('#queueDescription').textContent = state.matchPointTarget === null
    ? 'Target match point tanpa batas: tidak ada pemenang match atau pergantian tim otomatis.'
    : `Saat satu tim mencapai ${state.matchPointTarget} match point, tim antrean menggantikan tim yang kalah. Tim kalah masuk kembali ke akhir antrean.`;
  $('#queueCount').textContent = state.waitingTeams.length;
  $('#queueState').textContent = state.waitingTeams.length ? 'Menunggu giliran' : 'Kosong';
  document.querySelectorAll('.card-score-actions button').forEach((button) => { button.disabled = pendingMatch; });
  $('#historyList').innerHTML = state.history.length ? state.history.slice(0,6).map((entry) => `<li><span>${esc(entry.text)}</span><span class="history-time">${entry.time}</span></li>`).join('') : '<li class="history-empty">Belum ada hasil ronde.</li>';
  save();
}
function updateGameTimer() {
  const timer = $('#gameTimer');
  if (!timer) return;
  if (!state.setupComplete || !state.gameStartedAt) { timer.textContent = '00:00'; return; }
  const totalSeconds = Math.max(0, Math.floor((Date.now() - state.gameStartedAt) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  timer.textContent = hours ? `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}` : `${String(Math.floor(totalSeconds / 60)).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}
function addHistory(text) {
  state.history.unshift({ text, time: new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date()) });
  state.history = state.history.slice(0,20);
}
let toastTimer;
function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2400);
}
function showModal({ title, message, value = null, choices = null, confirmLabel = 'Lanjut', cancelLabel = 'Batal', danger = false }) {
  return new Promise((resolve) => {
    const backdrop = $('#modalBackdrop');
    const input = $('#modalInput');
    const select = $('#modalSelect');
    $('#modalTitle').textContent = title;
    $('#modalMessage').textContent = message;
    $('#modalConfirm').textContent = confirmLabel;
    $('#modalCancel').textContent = cancelLabel;
    $('#modalConfirm').classList.toggle('danger', danger);
    input.hidden = value === null || Boolean(choices);
    input.value = value ?? '';
    select.hidden = !choices;
    select.replaceChildren();
    if (choices) {
      choices.forEach((choice) => {
        const option = document.createElement('option');
        option.value = choice.value;
        option.textContent = choice.label;
        select.append(option);
      });
      select.value = choices.some((choice) => choice.value === value) ? value : choices[0].value;
    }
    backdrop.hidden = false;
    if (choices) select.focus();
    else if (value !== null) { input.focus(); input.select(); }
    else $('#modalConfirm').focus();
    const finish = (result) => {
      backdrop.hidden = true;
      $('#modalConfirm').removeEventListener('click', onConfirm);
      $('#modalCancel').removeEventListener('click', onCancel);
      backdrop.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onConfirm = () => finish(choices ? select.value : value === null ? true : input.value.trim());
    const onCancel = () => finish(null);
    const onBackdrop = (event) => { if (event.target === backdrop) finish(null); };
    const onKey = (event) => {
      if (event.key === 'Escape') finish(null);
      if (event.key === 'Enter') { event.preventDefault(); onConfirm(); }
    };
    $('#modalConfirm').addEventListener('click', onConfirm);
    $('#modalCancel').addEventListener('click', onCancel);
    backdrop.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);
  });
}
function recordWin(winner, points) {
  if (state.matchPointTarget !== null && !state.waitingTeams.length && ['a','b'].some((key) => state.teams[key].matches >= state.matchPointTarget)) return;
  const loser = winner === 'a' ? 'b' : 'a';
  const winningTeam = state.teams[winner];
  winningTeam.wins += 1;
  const winnerName = winningTeam.name;
  winningTeam.score += points;
  addHistory(`${winnerName} menang +${points} poin`);
  if (winningTeam.score >= TARGET) {
    winningTeam.matches = (Number(winningTeam.matches) || 0) + 1;
    state.teams.a.score = 0;
    state.teams.b.score = 0;
    addHistory(`${winnerName} mendapat 1 match point`);

    if (state.matchPointTarget !== null && winningTeam.matches >= state.matchPointTarget) {
      settleMatch(winner, loser);
    } else {
      toast(`${winnerName} mendapat 1 match point. Kedua poin direset.`);
    }
  }
  render();
}

function settleMatch(winner, loser) {
  const winnerTeam = state.teams[winner];
  if (!state.waitingTeams.length) {
    addHistory(`${winnerTeam.name} mencapai 3 match point; menunggu tim antrean untuk pergantian`);
    toast(`${winnerTeam.name} menang! Tambahkan tim antrean untuk mengganti tim yang kalah.`);
    return;
  }
  rotateLosingTeam(winner, loser);
}

function rotateLosingTeam(winner, loser) {
  const winnerTeam = state.teams[winner];
  const outgoing = state.teams[loser];
  const incoming = state.waitingTeams.shift();
  state.teams[loser] = { name: incoming.name, players: incoming.players, avatar: incoming.avatar || '🦊', score: 0, wins: 0, matches: 0 };
  state.teams.a.matches = 0;
  state.teams.b.matches = 0;
  state.teams.a.score = 0;
  state.teams.b.score = 0;
  state.waitingTeams.push({ name: outgoing.name, players: outgoing.players, avatar: outgoing.avatar || '🐻' });
  addHistory(`${winnerTeam.name} menang match; ${incoming.name} masuk, ${outgoing.name} kembali ke antrean`);
  toast(`${winnerTeam.name} menang! ${incoming.name} menggantikan ${outgoing.name}; ${outgoing.name} masuk antrean.`);
}

document.querySelectorAll('.card-score-actions button').forEach((button) => button.addEventListener('click', () => recordWin(button.dataset.winner, Number(button.dataset.points))));
$('#queueForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const teamNameInput = $('#queueTeamName');
  const player1Input = $('#queuePlayer1');
  const player2Input = $('#queuePlayer2');
  const name = teamNameInput.value.trim();
  const player1 = player1Input.value.trim();
  const player2 = player2Input.value.trim();
  if (!name || !player1 || !player2) return;
  state.waitingTeams.push({ name, players: [player1, player2], avatar: $('#queueTeamAvatar').value });
  teamNameInput.value = '';
  player1Input.value = '';
  player2Input.value = '';
  const pendingWinner = state.matchPointTarget === null ? null : ['a','b'].find((key) => state.teams[key].matches >= state.matchPointTarget);
  if (pendingWinner) rotateLosingTeam(pendingWinner, pendingWinner === 'a' ? 'b' : 'a');
  renderPlayerLists();
  save();
  if (!pendingWinner) toast(`${name} ditambahkan ke antrean.`);
  try { render(); } catch (error) { console.error('Pembaruan papan skor gagal:', error); }
});
$('#queueList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove]'); if (!button) return;
  state.waitingTeams.splice(Number(button.dataset.remove), 1);
  render();
});
$('#queueToggle').addEventListener('click', () => document.body.classList.toggle('queue-panel-open'));
$('#queueClose').addEventListener('click', () => document.body.classList.remove('queue-panel-open'));
$('#rulesButton').addEventListener('click', () => showModal({
  title: 'Aturan Main',
  message: `Pilih tim yang menang, lalu tambahkan +1 sampai +4 poin. Saat satu tim mencapai ${TARGET} poin, ia mendapat 1 match point dan poin kedua tim kembali ke 0. Tim yang mencapai target match point menang; tim kalah diganti tim berikutnya dan masuk ke akhir antrean. Target kosong berarti match point tanpa batas.`,
  confirmLabel: 'Mengerti', cancelLabel: 'Tutup',
}));
document.querySelectorAll('.edit-name').forEach((button) => button.addEventListener('click', async () => {
  const key = button.dataset.team; const team = state.teams[key];
  const name = await showModal({ title: 'Ubah nama tim', message: 'Masukkan nama baru untuk tim ini.', value: team.name, confirmLabel: 'Simpan' });
  if (name === null) return;
  if (name) team.name = name.slice(0, 24);
  for (let index = 0; index < team.players.length; index += 1) {
    const updated = await showModal({ title: `Pemain ${index + 1}`, message: `Ubah nama pemain di ${team.name}.`, value: team.players[index], confirmLabel: 'Simpan' });
    if (updated === null) break;
    if (updated) team.players[index] = updated.slice(0, 24);
  }
  const avatar = await showModal({
    title: 'Pilih karakter tim',
    message: `Kedua pemain ${team.name} akan memakai karakter yang sama.`,
    value: team.avatar,
    choices: [
      ['🐻','Beruang'],['🦊','Rubah'],['🐼','Panda'],['🐯','Harimau'],
      ['🐸','Katak'],['🐰','Kelinci'],['🐱','Kucing'],['🐶','Anjing'],
    ].map(([character, label]) => ({ value: character, label: `${character} ${label}` })),
    confirmLabel: 'Pakai karakter',
  });
  if (avatar) team.avatar = avatar;
  render();
}));
$('#resetButton').addEventListener('click', async () => {
  const confirmed = await showModal({ title: 'Mulai ulang papan skor?', message: 'Skor, antrean, dan riwayat akan dihapus.', confirmLabel: 'Mulai ulang', danger: true });
  if (!confirmed) return;
  state = initialState(); render(); toast('Papan skor sudah diatur ulang.');
});
$('#setupForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const value = (key) => String(data.get(key) || '').trim();
  state.teams.a = { name: value('teamA'), players: [value('aPlayer1'), value('aPlayer2')], avatar: value('teamAAvatar') || '🐻', score: 0, wins: 0, matches: 0 };
  state.teams.b = { name: value('teamB'), players: [value('bPlayer1'), value('bPlayer2')], avatar: value('teamBAvatar') || '🐸', score: 0, wins: 0, matches: 0 };
  const target = value('matchPointTarget');
  state.matchPointTarget = target ? Math.max(1, Math.min(99, Number.parseInt(target, 10) || 1)) : null;
  state.gameStartedAt = Date.now();
  state.waitingTeams = [];
  state.teams.a.score = 0;
  state.teams.b.score = 0;
  state.setupComplete = true;
  addHistory(`Permainan dimulai: ${state.teams.a.name} melawan ${state.teams.b.name}`);
  render();
});
render();
window.setInterval(updateGameTimer, 1000);
