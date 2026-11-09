const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PIPS=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
const half=v=>`<i>${[...Array(9)].map((_,k)=>PIPS[v].includes(k)?'<b></b>':'<span></span>').join('')}</i>`;
const tile=(a,b,c='',st='')=>`<div class="t ${c}" style="${st}">${half(a)}<u></u>${half(b)}</div>`;
let G=null,cfg=null,OL=null,ME=0,LB=null;const MU={on:false};
function setup(){
 const c=cfg||{target:3,timer:15,teams:['Tim A','Tim B'],names:['Kamu','Lawan 1','Partner','Lawan 2']};
 $('#app').innerHTML=`<div class="modal"><div class="card"><h1>Domino 2v2</h1><p style="margin:0 0 6px;opacity:.8">Gaple kompetisi. Kamu duduk di kursi bawah, tiga kursi lain dimainkan bot.</p>
 <div class="g2"><div><label for="tg">Target ronde (first to)</label><input id="tg" type="number" min="1" max="20" value="${c.target}"></div>
 <div><label for="tm">Timer giliran</label><select id="tm">${[10,15,20,0].map(v=>`<option value="${v}" ${v==c.timer?'selected':''}>${v?v+' detik':'Tanpa timer'}</option>`).join('')}</select></div></div>
 <div class="g2"><div><label class="tA" for="ta">Nama Tim A</label><input id="ta" value="${esc(c.teams[0])}" maxlength="14"></div><div><label class="tB" for="tb">Nama Tim B</label><input id="tb" value="${esc(c.teams[1])}" maxlength="14"></div>
 <div><label for="p1">Player 1 (bawah)</label><input id="p1" value="${esc(c.names[0])}" maxlength="10"></div><div><label for="p2">Player 2 (kiri)</label><input id="p2" value="${esc(c.names[1])}" maxlength="10"></div>
 <div><label for="p3">Player 3 (atas, partner)</label><input id="p3" value="${esc(c.names[2])}" maxlength="10"></div><div><label for="p4">Player 4 (kanan)</label><input id="p4" value="${esc(c.names[3])}" maxlength="10"></div></div>
 <button class="btn" style="width:100%;margin-top:16px" onclick="start()">Main lawan bot</button>
 <div class="g2" style="margin-top:14px"><button class="btn ghost" onclick="hostCreate()">Buat room online</button><button class="btn ghost" onclick="joinScreen()">Gabung room</button></div>
 <p id="olmsg" style="font-size:13px;opacity:.8;margin:8px 0 0">Online tanpa akun: tukar kode lewat WhatsApp. Saat gabung, isi namamu di kolom Player 1.</p></div></div>`;
}
function readCfg(){
 const v=i=>$('#'+i).value.trim();
 return cfg={target:Math.max(1,Math.min(20,+v('tg')||3)),timer:+v('tm'),teams:[v('ta')||'Tim A',v('tb')||'Tim B'],names:[v('p1')||'P1',v('p2')||'P2',v('p3')||'P3',v('p4')||'P4']};
}
function start(){musicStart();readCfg();OL=null;ME=0;G={cfg,rounds:[0,0],tally:[0,0],emo:{},ecd:0,hu:[true,false,false,false]};newHand(null)}
function newHand(op){
 const d=[];for(let a=0;a<7;a++)for(let b=a;b<7;b++)d.push([a,b]);
 for(let i=27;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]]}
 G.hands=[0,1,2,3].map(s=>d.slice(s*7,s*7+7).sort((x,y)=>x[0]+x[1]-y[0]-y[1]));
 Object.assign(G,{center:null,L:null,R:null,la:[],ra:[],phase:'play',first:op===null,modal:null,msg:'',last:0});
 G.turn=op===null?G.hands.findIndex(h=>h.some(t=>t[0]==6&&t[1]==6)):op;
 startTurn();
}
function valid(s){const r=[];G.hands[s].forEach((t,i)=>{const sd=[];
 if(!G.center){if(!G.first||(t[0]==6&&t[1]==6))sd.push('C')}else{if(t.includes(G.L))sd.push('L');if(t.includes(G.R))sd.push('R')}
 if(sd.length)r.push({i,sd})});return r}
function startTurn(){
 clearTimeout(G.bt);G.sel=null;G.deadline=cfg.timer?Date.now()+cfg.timer*1000:0;render();bc();
 if(G.phase!=='play')return;const s=G.turn;
 if(!G.hu[s])G.bt=setTimeout(()=>bot(s),800+Math.random()*800);
 else if(!G.center&&G.first)G.bt=setTimeout(()=>doPlay(s,G.hands[s].findIndex(t=>t[0]==6&&t[1]==6),'C'),900);
 else if(!valid(s).length&&G.center){G.msg=cfg.names[s]+', tidak ada langkah. Tekan PASS.';render();bc()}
}
function doPlay(s,i,side){
 const t=G.hands[s].splice(i,1)[0];sfx('place');G.lastTile=t;G.msg='';G.sel=null;
 if(side==='C'){G.center=t;G.L=t[0];G.R=t[1]}
 else{const e=side==='L'?G.L:G.R,o=t[0]===e?t[1]:t[0];(side==='L'?G.la:G.ra).push([e,o]);if(side==='L')G.L=o;else G.R=o}
 G.last=s;
 if(!G.hands[s].length)return endHand('empty',s);
 if([0,1,2,3].every(x=>!valid(x).length))return endHand('dead',s);
 G.turn=(s+1)%4;startTurn();
}
function pass(s){if(G.phase!=='play'||valid(s).length)return;sfx('pass');G.turn=(s+1)%4;G.msg=cfg.names[s]+' pass';startTurn()}
function bot(s){
 if(G.phase!=='play'||G.turn!==s)return;const v=valid(s);
 if(Math.random()<.06)emote(['👍','😅','😂'][Math.random()*3|0],s);
 if(!v.length)return pass(s);
 const sc=o=>{const t=G.hands[s][o.i];return t[0]+t[1]+(t[0]===t[1]?3:0)+Math.random()*2};
 v.sort((a,b)=>sc(b)-sc(a));const m=v[0];doPlay(s,m.i,m.sd[Math.random()*m.sd.length|0]);
}
function tap(i){
 if(G.turn!==ME||G.phase!=='play')return;const o=valid(ME).find(x=>x.i===i);if(!o)return;
 if(o.sd.length===1)act(i,o.sd[0]);else{G.sel=i;render()}
}
function side(sd){if(G.sel!==null){const i=G.sel;G.sel=null;act(i,sd)}}
const isClient=()=>OL&&OL.role==='client';
function act(i,sd){if(isClient()){OL.room.emit('act',{a:'p',i,t:G.hands[ME][i],sd});render()}else doPlay(ME,i,sd)}
function passMe(){if(isClient())OL.room.emit('act',{a:'x'});else pass(ME)}
function emote(e,s=ME){if(s===ME){if(Date.now()<G.ecd)return;G.ecd=Date.now()+8000}if(OL)OL.room.emit('em',{s,e});else showEm(s,e)}
function showEm(s,e){G.emo[s]={e,t:Date.now()};render();setTimeout(render,2600)}
function endHand(kind,s){
 G.phase='over';clearTimeout(G.bt);let name,pts,team,op=s;
 const sum=x=>G.hands[x].reduce((a,t)=>a+t[0]+t[1],0),ts=[sum(0)+sum(2),sum(1)+sum(3)];
 if(kind==='empty'){team=s%2;const l=G.lastTile;if(l[0]===l[1]){name='APOLLO';pts=4}else if(G.L===G.R){name='CEKI';pts=2}else{name='DOMI';pts=1}}
 else{const m=s%2;if(ts[m]<ts[1-m]){name='KANDANG';pts=2;team=m}else{name='TANGKAP KANDANG';pts=3;team=1-m;op=(s+1)%4}}
 G.tally[team]+=pts;const pre=[...G.tally];let rw=false,champ=false;
 if(G.tally[team]>=10){G.rounds[team]++;G.tally=[0,0];rw=true;if(G.rounds[team]>=cfg.target)champ=true}
 G.opener=op;G.modal={name,pts,team,kind,ts,rw,champ,s,pre};G.cd=5;render();bc();sfx(team===ME%2?'win':'lose');
 clearInterval(G.ci);if(!champ)G.ci=setInterval(()=>{if(--G.cd<=0)nextHand();else{render();bc()}},1000);
}
function nextHand(){if(isClient())return;clearInterval(G.ci);newHand(G.opener)}
function layout(){
 const pos=[];if(!G.center)return pos;const F=$('#felt'),wide=!!F&&F.clientWidth>F.clientHeight*1.5;
 pos.push({x:0,y:0,ang:0,a:G.center[0],b:G.center[1]});
 const arm=(list,d0,perp)=>{
  const nd=[-d0[0],-d0[1]],dirs=[d0,perp,nd,perp,d0,perp,nd,perp],lens=wide?[7,2,7,2,7,2,7,2]:[6,3,6,3,6,3,6,3];
  let p=[d0[0],d0[1]],seg=0,cnt=0;
  list.forEach(([a,b])=>{
   if(cnt>=lens[seg]){seg++;cnt=0}
   const d=dirs[seg];let c;
   if(cnt===0&&seg>0){const o=dirs[seg-1];c=[p[0]+o[0]*.5+d[0]*1.5,p[1]+o[1]*.5+d[1]*1.5];p=[p[0]+o[0]*.5+d[0]*2.5,p[1]+o[1]*.5+d[1]*2.5]}
   else{c=[p[0]+d[0],p[1]+d[1]];p=[p[0]+d[0]*2,p[1]+d[1]*2]}
   cnt++;pos.push({x:c[0],y:c[1],ang:Math.atan2(d[1],d[0])*180/Math.PI,a,b});
  });
 };
 arm(G.ra,[1,0],[0,1]);arm(G.la,[-1,0],[0,-1]);return pos;
}
function trk(){const on=G.center?[G.center,...G.la,...G.ra]:[],c=n=>7-on.filter(t=>t.includes(n)).length-G.hands[ME].filter(t=>t.includes(n)).length;return [0,1,2,3,4,5,6].map(n=>`<span>${half(n)}${c(n)}</span>`).join('')}
function seatEl(s,pc){
 const t=s%2,n=G.hands[s].length,on=G.turn===s&&G.phase==='play',e=G.emo[s];
 return `<div class="seat ${pc||''} ${on?'on':''}"><div class="av ${on?'on':''}" id="av${s}" style="--c:var(--${t?'B':'A'})"><span>${esc(cfg.names[s][0])}</span></div>
 <div style="display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0"><div class="nm">${esc(cfg.names[s])}</div>${s!==ME?`<div class="bks">${'<s class="bk"></s>'.repeat(n)}</div><b class="cnt">${n}</b>`:''}</div>
 ${e&&Date.now()-e.t<2500?`<div class="bub">${e.e}</div>`:''}</div>`;
}
function render(){
 if(!G)return setup();
 const T=cfg.teams,pct=i=>Math.min(100,G.tally[i]*10);
 const mine=G.turn===ME&&G.phase==='play',v=mine?valid(ME):[],cur=cfg.names[G.turn];
 let m='';
 if(G.modal){const M=G.modal,w=M.team;
  m=`<div class="modal"><div class="card"><h2 class="t${w?'B':'A'}">${esc(T[w])}</h2>
  ${M.champ?`<h1>JUARA MATCH</h1><p>${esc(T[w])} menang ${G.rounds[w]} ronde lebih dulu.</p>`:`<h1>${M.name} +${M.pts}</h1><p style="margin:4px 0 10px">${M.kind==='dead'?'Meja terkunci. ':''}Oleh ${esc(cfg.names[M.s])}.</p>`}
  ${[0,1,2,3].map(x=>`<div class="row"><span class="t${x%2?'B':'A'}">${esc(cfg.names[x])}</span><span class="tl">${G.hands[x].map(t=>tile(t[0],t[1],'v','--h:10px')).join('')||'habis'}</span><b>${G.hands[x].reduce((a,t)=>a+t[0]+t[1],0)} biji</b></div>`).join('')}
  <div class="row"><span>Total biji tim</span><span><span class="tA">${M.ts[0]}</span> lawan <span class="tB">${M.ts[1]}</span></span></div>
  <div class="row"><span>Poin kocokan</span><b><span class="tA">${M.pre[0]}</span> / 10 lawan <span class="tB">${M.pre[1]}</span> / 10</b></div>
  ${M.rw&&!M.champ?`<p style="color:var(--brass)">${esc(T[w])} dapat 1 skor ronde. Poin kedua tim kembali 0 – 0.</p>`:''}
  ${M.champ?`<button class="btn" style="width:100%;margin-top:12px" onclick="leave()">Main lagi</button>`:`<button class="btn" style="width:100%;margin-top:12px" onclick="nextHand()">Lanjut kocokan berikutnya (${G.cd})</button>`}</div></div>`}
 $('#app').innerHTML=`
 <div class="hud"><div class="tm A"><b>${esc(T[0])}</b><div class="bar"><i style="width:${pct(0)}%"></i></div><small>${G.tally[0]}/10 poin</small></div>
 <div class="score"><span class="tA">${G.rounds[0]}</span> : <span class="tB">${G.rounds[1]}</span><small>first to ${cfg.target}</small></div>
 <div class="tm B"><b>${esc(T[1])}</b><div class="bar"><i style="width:${pct(1)}%"></i></div><small>${G.tally[1]}/10 poin</small></div><button class="mb" onclick="toggleMu()" aria-label="Musik">${MU.on?'🎵':'🔇'}</button></div>
 <div class="arena">${seatEl((ME+2)%4,'sT')}${seatEl((ME+1)%4,'s1')}<div class="felt" id="felt"><div class="msg">${G.msg?esc(G.msg):(G.phase==='play'?'Giliran '+esc(cur):'')}</div><div class="chain" id="chain"></div>
 <div class="info">${G.center?`Ujung kiri ${G.L}, kanan ${G.R}`:'Meja kosong'}</div></div>${seatEl((ME+3)%4,'s3')}</div>
 <div class="bot">${seatEl(ME,'sB')}<div class="hw"><div class="hand">${G.hands[ME].map((t,i)=>{const ok=v.some(x=>x.i===i);return `<button class="hb ${ok?'ok':mine?'dim':''} ${G.sel===i?'sel':''}" onclick="tap(${i})" aria-label="Kartu ${t[0]}-${t[1]}">${tile(t[0],t[1],'v')}</button>`}).join('')}</div><div class="trk">${trk()}</div></div>
 <div class="acts"><button class="btn" ${mine&&G.center&&!v.length?'':'disabled'} onclick="passMe()">PASS</button>
 ${G.sel!==null&&valid(ME).find(x=>x.i===G.sel)?valid(ME).find(x=>x.i===G.sel).sd.map(d=>`<button class="btn ghost" onclick="side('${d}')">${d==='L'?'Kiri ('+G.L+')':'Kanan ('+G.R+')'}</button>`).join(''):''}
 <div id="emotes" class="${Date.now()<G.ecd?'cd':''}">${['👍','😅','😂'].map(e=>`<button onclick="emote('${e}')" aria-label="Emote">${e}</button>`).join('')}</div></div></div>${m}`;
 fit();
}
function fit(){
 const f=$('#felt'),ch=$('#chain');if(!f||!ch)return;const U=26,pos=layout();if(!pos.length)return;
 const xs=pos.map(p=>p.x),ys=pos.map(p=>p.y),x0=Math.min(...xs)-1.3,x1=Math.max(...xs)+1.3,y0=Math.min(...ys)-1.3,y1=Math.max(...ys)+1.3;
 const W=f.clientWidth*.82,H=f.clientHeight*.7,s=Math.min(1.5,W/((x1-x0)*U),H/((y1-y0)*U));
 ch.style.transform=`scale(${s}) translate(${-(x0+x1)/2*U}px,${-(y0+y1)/2*U}px)`;
 ch.innerHTML=pos.map(p=>tile(p.a,p.b,'',`--h:${U}px;--r:${p.ang}deg;left:${p.x*U}px;top:${p.y*U}px`)).join('');
}
const NOOL='Online belum tersedia di sini. Buka lewat link artifact, pastikan sudah login dan temanmu diundang sebagai Contributor.';
function bc(){
 if(!OL||OL.role!=='host'||!OL.started||!G)return;
 const R=OL.room;OL.v++;
 R.emit('st',{v:OL.v,cfg,ce:G.center,L:G.L,R:G.R,la:G.la,ra:G.ra,tu:G.turn,ph:G.phase,ta:G.tally,ro:G.rounds,fi:G.first,ms:G.msg,hu:G.hu,cn:G.hands.map(h=>h.length),dl:G.deadline?Math.max(0,G.deadline-Date.now()):0,sp:OL.seats.map(x=>x?x.p:null),mo:G.modal?{...G.modal,hs:G.hands,cd:G.cd}:null});
 OL.seats.forEach((x,s)=>{if(x&&s)R.emit('hd',{p:x.p,h:G.hands[s]})});
}
function lobbyBc(){if(OL&&OL.role==='host')OL.room.emit('ls',{s:OL.seats.map(x=>x?{p:x.p,n:x.n}:null)})}
async function openRoom(code,role){
 try{const R=await window.claude?.use('room');if(!R)return false;const room=await R.join('dom-'+code.toLowerCase());
 OL={role,code,room,seats:[],v:-1,me:role==='host'?'H':null,started:false};
 room.on('jn',onJn);room.on('ls',onLs);room.on('st',onSt);room.on('hd',onHd);room.on('act',onAct);room.on('em',onEm);room.onPeers(onPeers);return true}catch(e){return false}}
function onJn(m){
 if(!OL)return;
 if(OL.role==='client'){if(m.isMe&&m.sameTab&&!OL.me)OL.me=m.peer;return}
 if(m.isMe)return;
 let s=OL.seats.findIndex(x=>x&&x.p===m.peer);
 if(s<0){s=[2,1,3].find(k=>!OL.seats[k]);if(s===undefined)return;OL.seats[s]={p:m.peer,n:String(m.data&&m.data.n||'Teman').slice(0,10)};
  if(OL.started){G.hu[s]=true;cfg.names[s]=OL.seats[s].n;if(G.turn===s&&G.phase==='play')startTurn()}}
 lobbyBc();if(OL.started)bc();else lobby()}
function onLs(m){if(!OL||OL.role==='host')return;const d=m.data;if(!d||!Array.isArray(d.s))return;LB=d;if(d.s.some(x=>x&&x.p===OL.me))OL.seatOk=true;if(!G)lobby()}
function onSt(m){if(!OL||OL.role==='host')return;const d=m.data;if(!d||!d.cfg||!Array.isArray(d.cn)||!Array.isArray(d.sp)||d.v<=OL.v)return;
 OL.v=d.v;cfg=d.cfg;const k=d.sp.indexOf(OL.me);if(k>=0){ME=k;OL.seatOk=true}
 const old=G||{emo:{},ecd:0},hs=d.mo&&d.mo.hs;
 G={cfg,rounds:d.ro,tally:d.ta,emo:old.emo,ecd:old.ecd,center:d.ce,L:d.L,R:d.R,la:d.la,ra:d.ra,turn:d.tu,phase:d.ph,first:d.fi,msg:d.ms,hu:d.hu,sel:old.turn===d.tu?old.sel:null,hands:d.cn.map((n,s)=>hs?hs[s]:s===ME?(OL.mh||[]):Array(n).fill([0,0])),modal:d.mo||null,cd:d.mo?d.mo.cd:0,deadline:d.dl?Date.now()+d.dl:0};
 LB=null;render()}
function onHd(m){if(!OL||OL.role==='host')return;const d=m.data;if(d&&d.p===OL.me&&Array.isArray(d.h)){OL.mh=d.h;if(G&&!G.modal){G.hands[ME]=d.h;render()}}}
function onAct(m){
 if(!OL||OL.role!=='host'||m.isMe||!OL.started||G.phase!=='play')return;
 const s=OL.seats.findIndex(x=>x&&x.p===m.peer),d=m.data||{};
 if(s<1||G.turn!==s)return;
 if(d.a==='x')return pass(s);
 const h=G.hands[s][d.i],o=valid(s).find(x=>x.i===d.i);
 if(d.a==='p'&&h&&o&&Array.isArray(d.t)&&h[0]===d.t[0]&&h[1]===d.t[1]&&o.sd.includes(d.sd))doPlay(s,d.i,d.sd)}
function onEm(m){const d=m.data;if(!d||!G)return;if(![0,1,2,3].includes(d.s)||!['👍','😅','😂'].includes(d.e))return;showEm(d.s,d.e)}
function onPeers(ch){
 if(!OL||OL.role!=='host')return;
 ch.left.forEach(p=>{const s=OL.seats.findIndex(x=>x&&x.p===p.peer);if(s>0){OL.seats[s]=null;if(OL.started){G.hu[s]=false;cfg.names[s]+=' (bot)';if(G.turn===s&&G.phase==='play')startTurn()}lobbyBc();if(!OL.started)lobby()}})}
function lobby(){
 const host=OL.role==='host',seats=host?OL.seats:(LB?LB.s:[]);
 $('#app').innerHTML=`<div class="modal"><div class="card"><h2>Room online</h2>${host?'<div id="inv" style="margin-bottom:10px"></div>':''}
 ${['Tim A, bawah (host)','Tim B, kiri','Tim A, atas (partner host)','Tim B, kanan'].map((l,s)=>`<div class="row"><span class="t${s%2?'B':'A'}">${l}</span><b>${seats[s]?esc(seats[s].n):'Bot'}</b></div>`).join('')}
 ${host?`<button class="btn" style="width:100%;margin-top:14px" onclick="hostStart()">Mulai (kursi kosong diisi bot)</button>`:'<p>Menunggu host memulai...</p>'}
 <button class="btn ghost" style="width:100%;margin-top:8px" onclick="leave()">Keluar</button></div></div>`;invUI()}
async function hostCreate(){
 musicStart();const m=$('#olmsg');m.textContent='Menghubungkan...';readCfg();
 const code=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random()*24|0]).join('');
 if(!await openRoom(code,'host')){m.textContent=NOOL;return}
 OL.seats=[{p:'H',n:cfg.names[0]},null,null,null];G=null;ME=0;lobbyBc();lobby();
 OL.lb=setInterval(()=>{if(OL&&!OL.started)lobbyBc()},3000)}
async function joinRoom(){
 musicStart();const m=$('#olmsg'),code=$('#rc').value.trim().toUpperCase(),n=$('#p1').value.trim()||'Teman';
 if(code.length!==4){m.textContent='Masukkan kode room 4 huruf.';return}
 m.textContent='Menghubungkan...';
 if(!await openRoom(code,'client')){m.textContent=NOOL;return}
 const send=()=>OL&&OL.room.emit('jn',{n});send();
 OL.ji=setInterval(()=>{if(!OL||OL.seatOk)return clearInterval(OL&&OL.ji);send()},2000);
 LB={s:[]};G=null;lobby()}
function hostStart(){
 const n=[...cfg.names];OL.seats.forEach((x,s)=>{if(x)n[s]=x.n});cfg.names=n;
 G={cfg,rounds:[0,0],tally:[0,0],emo:{},ecd:0,hu:[0,1,2,3].map(s=>!!OL.seats[s])};OL.started=true;ME=0;lobbyBc();
 OL.bi=setInterval(bc,5000);newHand(null)}
function leave(){
 if(G){clearInterval(G.ci);clearTimeout(G.bt)}
 if(OL){clearInterval(OL.ji);clearInterval(OL.lb);clearInterval(OL.bi);try{OL.room.leave()}catch(e){}}
 OL=null;LB=null;G=null;ME=0;setup()}
const mf=m=>440*2**((m-69)/12),CH=[[45,[57,60,64,67]],[38,[57,60,65,69]],[43,[55,59,62,65]],[36,[55,59,64,67]]],PE=[69,72,74,76,79,81];
function osc(ty,f,t,d,v,at,dst){const C=MU.ctx,x=C.createOscillator(),e=C.createGain();x.type=ty;x.frequency.setValueAtTime(f,t);e.gain.setValueAtTime(.0001,t);e.gain.linearRampToValueAtTime(v,t+at);e.gain.exponentialRampToValueAtTime(.0001,t+d);x.connect(e);e.connect(dst||MU.g);x.start(t);x.stop(t+d+.05);return x}
function nz(t,d,v,ty,f){const C=MU.ctx,s=C.createBufferSource(),b=C.createBiquadFilter(),e=C.createGain();s.buffer=MU.nb;b.type=ty;b.frequency.value=f;e.gain.setValueAtTime(v,t);e.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(e);e.connect(MU.g);s.start(t);s.stop(t+d)}
function beat(n,t){
 const [b,c]=CH[(n>>3)%4],k=n%8,S=60/76/2;
 if(k===0)c.forEach(m=>osc('triangle',mf(m),t,S*7.5,.05,.5));
 if(k===0||k===4||(k===7&&Math.random()<.3))osc('sine',mf(b),t,S*1.8,.32,.02);
 if(k===0||k===4){const x=osc('sine',130,t,.3,.5,.005);x.frequency.exponentialRampToValueAtTime(42,t+.2)}
 if(k===2||k===6)nz(t,.18,.18,'bandpass',1800);
 nz(t+(k%2?S*.12:0),.05,.06,'highpass',7000);
 if(Math.random()<.45)osc('triangle',mf(PE[Math.random()*6|0]),t,.7,.1,.01,MU.dl)}
function musicStart(){
 if(MU.ctx){if(!MU.on){MU.on=true;MU.ctx.resume()}return}
 try{const C=MU.ctx=new(window.AudioContext||window.webkitAudioContext)(),g=MU.g=C.createGain(),out=C.createGain(),lp=C.createBiquadFilter(),dl=C.createDelay(),fb=C.createGain(),sd=MU.dl=C.createGain();
 out.gain.value=.22;lp.type='lowpass';lp.frequency.value=2400;dl.delayTime.value=.39;fb.gain.value=.3;
 g.connect(out);out.connect(lp);lp.connect(C.destination);sd.connect(g);sd.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(g);
 const nb=MU.nb=C.createBuffer(1,C.sampleRate*.5,C.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 MU.step=0;MU.t=C.currentTime+.1;MU.on=true;
 MU.iv=setInterval(()=>{while(MU.t<C.currentTime+.3){beat(MU.step++,MU.t);MU.t+=60/76/2}},80)}catch(e){MU.on=false}
 const b=$('.mb');if(b)b.textContent=MU.on?'🎵':'🔇'}
function toggleMu(){if(!MU.ctx){musicStart();return}if(MU.on){MU.on=false;MU.ctx.suspend()}else{MU.on=true;MU.ctx.resume()}const b=$('.mb');if(b)b.textContent=MU.on?'🎵':'🔇'}
const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
const enc=d=>btoa(JSON.stringify(d)),dec=s=>JSON.parse(atob(s.trim()));
const waitIce=pc=>new Promise(r=>{if(pc.iceGatheringState==='complete')return r();const f=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',f);r()}};pc.addEventListener('icegatheringstatechange',f);setTimeout(r,5000)});
function mkNet(role){
 const hs={},ps=new Map(),N={role,myId:role==='host'?'H':null,pl:[],pend:{},n:0};
 const fire=(t,d,peer,me)=>(hs[t]||[]).forEach(f=>{try{f({topic:t,data:d,peer,isMe:!!me,sameTab:!!me,kind:'viewer',guest:false})}catch(e){}});
 N.on=(t,f)=>{(hs[t]=hs[t]||[]).push(f);return()=>{}};
 N.onPeers=f=>{N.pl.push(f);return()=>{}};
 N.emit=(t,d)=>{const s=JSON.stringify({t,d});if(role==='host')ps.forEach(c=>c.dc.readyState==='open'&&c.dc.send(s));else if(N.dc&&N.dc.readyState==='open')N.dc.send(s);fire(t,d,N.myId,1);return Promise.resolve()};
 N.leave=()=>{ps.forEach(c=>c.pc.close());Object.values(N.pend).forEach(c=>c.pc.close());N.pc&&N.pc.close()};
 const wire=(dc,id)=>{dc.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}if(!m||typeof m.t!=='string')return;
  if(role==='host'){if(m.t==='em')ps.forEach((c,k)=>k!==id&&c.dc.readyState==='open'&&c.dc.send(e.data));if(['jn','act','em'].includes(m.t))fire(m.t,m.d,id,0)}
  else if(m.t==='hello'){N.myId=m.d;N.hello&&N.hello()}else fire(m.t,m.d,'H',0)}};
 N.invite=async()=>{const id='c'+(++N.n),pc=new RTCPeerConnection(ICE),dc=pc.createDataChannel('g');wire(dc,id);
  dc.onopen=()=>{ps.set(id,{pc,dc});delete N.pend[id];dc.send(JSON.stringify({t:'hello',d:id}));N.upd&&N.upd(id)};
  const gone=()=>{if(ps.delete(id)){N.pl.forEach(f=>f({left:[{peer:id}],joined:[],updated:[]}));N.upd&&N.upd()}};dc.onclose=gone;
  pc.onconnectionstatechange=()=>{if(['failed','closed','disconnected'].includes(pc.connectionState))gone()};
  N.pend[id]={pc};await pc.setLocalDescription(await pc.createOffer());await waitIce(pc);return{id,code:enc(pc.localDescription)}};
 N.accept=(id,code)=>N.pend[id].pc.setRemoteDescription(dec(code));
 N.join=async code=>{const pc=N.pc=new RTCPeerConnection(ICE);pc.ondatachannel=e=>{N.dc=e.channel;wire(N.dc);N.dc.onclose=()=>fire('gone',0,'H',0)};await pc.setRemoteDescription(dec(code));await pc.setLocalDescription(await pc.createAnswer());await waitIce(pc);return enc(pc.localDescription)};
 return N}
function openNet(role){
 const N=mkNet(role);OL={role,code:'',room:N,seats:[],v:-1,me:role==='host'?'H':null,started:false};
 N.on('jn',onJn);N.on('ls',onLs);N.on('st',onSt);N.on('hd',onHd);N.on('act',onAct);N.on('em',onEm);N.onPeers(onPeers);
 N.upd=id=>{if(OL&&OL.inv&&OL.inv.id===id)OL.inv=null;if(OL&&OL.role==='host'&&!OL.started)invUI()};return N}
function hostCreate(){musicStart();readCfg();openNet('host');OL.seats=[{p:'H',n:cfg.names[0]},null,null,null];G=null;ME=0;lobby();OL.lb=setInterval(()=>{if(OL&&!OL.started)lobbyBc()},3000)}
function invUI(){
 const el=$('#inv');if(!el||!OL||OL.role!=='host')return;const p=OL.inv;
 el.innerHTML=p?`<p style="margin:0 0 4px;font-size:13px">1. Kirim kode ini ke temanmu:</p><textarea id="oc" readonly rows="3">${p.code}</textarea><button class="btn ghost" style="margin-top:4px" onclick="cp('oc')">Salin kode</button><p style="margin:8px 0 4px;font-size:13px">2. Tempel kode balasan dari temanmu:</p><textarea id="ac" rows="3"></textarea><button class="btn" style="margin-top:4px" onclick="doAccept()">Sambungkan</button><p id="im" style="font-size:13px"></p>`:`<button class="btn ghost" style="width:100%" onclick="doInvite()">Undang teman (buat kode)</button>`}
async function doInvite(){const el=$('#inv');el.textContent='Membuat kode...';try{OL.inv=await OL.room.invite()}catch(e){OL.inv=null}invUI()}
async function doAccept(){const m=$('#im');try{await OL.room.accept(OL.inv.id,$('#ac').value);m.textContent='Menyambung... tunggu sebentar.'}catch(e){m.textContent='Kode balasan tidak valid.'}}
function cp(id){const t=$('#'+id);t.select();try{navigator.clipboard.writeText(t.value)}catch(e){document.execCommand('copy')}}
function joinScreen(){musicStart();readCfg();$('#app').innerHTML=`<div class="modal"><div class="card"><h2>Gabung room</h2><p style="font-size:13px;margin:0 0 6px">1. Tempel kode undangan dari host:</p><textarea id="ic" rows="3"></textarea><button class="btn" style="margin-top:6px" onclick="doJoin()">Buat kode balasan</button><div id="ja"></div><p id="olmsg" style="font-size:13px"></p><button class="btn ghost" style="width:100%;margin-top:8px" onclick="leave()">Kembali</button></div></div>`}
async function doJoin(){
 const m=$('#olmsg'),n=cfg.names[0]||'Teman';
 try{const N=openNet('client');m.textContent='Membuat balasan...';const code=await N.join($('#ic').value);
  N.hello=()=>{OL.me=N.myId;const send=()=>OL&&OL.room.emit('jn',{n});send();OL.ji=setInterval(()=>{if(!OL||OL.seatOk)return clearInterval(OL&&OL.ji);send()},2000);LB={s:[]};G=null;lobby()};
  N.on('gone',()=>{leave();const x=$('#olmsg');if(x)x.textContent='Koneksi ke host terputus.'});
  $('#ja').innerHTML=`<p style="font-size:13px;margin:10px 0 4px">2. Kirim kode balasan ini ke host, lalu tunggu:</p><textarea id="rc2" readonly rows="3">${code}</textarea><button class="btn ghost" style="margin-top:4px" onclick="cp('rc2')">Salin kode</button>`;m.textContent='Menunggu host menyambungkan...'}
 catch(e){leave();const x=$('#olmsg');if(x)x.textContent='Kode tidak valid atau gagal tersambung.'}}
function sfx(k){
 const C=MU.ctx;if(!C||!MU.on||!MU.nb)return;
 if(!MU.sx){MU.sx=C.createGain();MU.sx.gain.value=.6;MU.sx.connect(C.destination)}
 const t=C.currentTime+.01,d=MU.sx;
 const tn=(ty,f,s,dur,v,f2)=>{const x=C.createOscillator(),e=C.createGain(),a=t+s;x.type=ty;x.frequency.setValueAtTime(f,a);if(f2)x.frequency.exponentialRampToValueAtTime(f2,a+dur);e.gain.setValueAtTime(.0001,a);e.gain.linearRampToValueAtTime(v,a+.005);e.gain.exponentialRampToValueAtTime(.0001,a+dur);x.connect(e);e.connect(d);x.start(a);x.stop(a+dur+.03)};
 const ns=(s,dur,v,f)=>{const n=C.createBufferSource(),b=C.createBiquadFilter(),e=C.createGain(),a=t+s;n.buffer=MU.nb;b.type='bandpass';b.frequency.value=f;e.gain.setValueAtTime(v,a);e.gain.exponentialRampToValueAtTime(.0001,a+dur);n.connect(b);b.connect(e);e.connect(d);n.start(a);n.stop(a+dur)};
 if(k==='place'){ns(0,.06,.9,1200);tn('sine',220,0,.09,.5,80)}
 if(k==='pass'){ns(0,.05,.7,500);tn('sine',120,0,.08,.4,70);ns(.13,.05,.7,500);tn('sine',120,.13,.08,.4,70)}
 if(k==='win')[523,659,784,1047].forEach((f,i)=>tn('triangle',f,i*.12,.35,.3));
 if(k==='lose')[392,349,311,262].forEach((f,i)=>tn('triangle',f,i*.2,.45,.28))}
function mode(){const ph=Math.min(innerWidth,innerHeight)<=520,rot=ph&&innerHeight>innerWidth,eh=rot?innerWidth:innerHeight,b=document.body;b.classList.toggle('phone',ph);b.classList.toggle('rot',rot);b.classList.toggle('land',ph||innerWidth>innerHeight);b.style.setProperty('--hh',Math.max(24,Math.min(44,eh*.085))+'px')}
addEventListener('resize',()=>{mode();if(G)render()});mode();
setInterval(()=>{
 if(!G)return;const em=$('#emotes');if(em)em.classList.toggle('cd',Date.now()<G.ecd);
 if(G.phase!=='play'||!G.deadline)return;const left=G.deadline-Date.now(),av=$('#av'+G.turn);
 if(av)av.style.setProperty('--p',Math.max(0,100*left/(cfg.timer*1000)));
 if(left<=0&&!isClient()&&G.hu[G.turn]){const s=G.turn;G.deadline=0;const v=valid(s);if(v.length){const o=v[Math.random()*v.length|0];doPlay(s,o.i,o.sd[0])}else if(G.center)pass(s)}
},200);
render();