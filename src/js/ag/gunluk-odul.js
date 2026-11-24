/* ------------------------------------------------------------------ daily reward and "continue" in Harekât (V2.69)
   Two rewarded-ad offers from the income plan (ROADMAP → Gelir planı), both always the player's choice:
   • Günlük ödül: once a day (Türkiye date) the menu shows the day's reward; seven days in a row grow it (50 → 150 TP),
     a missed day starts again from day 1. "Al" takes it; "Reklam izle · 2×" doubles it (Reklamsız: doubled without an
     ad). Kept in the profile (stats.gunluk), so it follows the account.
   • Harekât'ta kaldığın yerden devam: when a Kızıl Elma chapter fails after some of it was done (objectives passed,
     drones shot down, escort route flown), the mission-end card offers to restart from there after a rewarded ad. */
const GO_TP=[50,60,70,80,90,100,150];
const GO={shown:null, busy:false};
function goToday(ms){ return new Date((ms==null?Date.now():ms)+3*3600e3).toISOString().slice(0,10); }
function goPrevDay(d){ const t=Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10))-864e5; return new Date(t).toISOString().slice(0,10); }
function goState(ms){ const st=accProfile().stats||(accProfile().stats={}), g=st.gunluk||{son:null,seri:0}, today=goToday(ms);
  const day=g.son===today?g.seri:(g.son===goPrevDay(today)?g.seri%7+1:1);
  return {today:today, taken:g.son===today, day:day, tp:GO_TP[day-1]}; }
function goTake(x2,ms){ const s=goState(ms); if(s.taken) return 0; const st=accProfile().stats, n=s.tp*(x2?2:1);
  st.gunluk={son:s.today, seri:s.day}; careerAdd(n,{dailyLogin:1},'Günlük ödül'); toast('🎁 Günlük ödül: +'+n+' TP'+(x2?' (2×)':''),'#7dffb0'); return n; }
function goRender(){ const el=$('goBody'); if(!el) return; const s=goState(), ad=typeof adsOfferable==='function'&&adsOfferable(), no=typeof adsNoAds==='function'&&adsNoAds();
  el.innerHTML='<p class="mgn">'+s.day+'. gün · her gün gelirsen ödül büyür; bir gün kaçarsa 1. günden başlar.</p><div class="godays">'+GO_TP.map(function(v,i){ const d=i+1;
      return '<span class="'+(d<s.day?'got':d===s.day?'now':'')+'"><small>'+d+'. gün</small><b>'+v+'</b><em>TP</em></span>'; }).join('')+'</div>'+
    '<div class="stack"><button class="btn primary" type="button" data-go="1">+'+s.tp+' TP al</button>'+(ad?'<button class="btn gold" type="button" data-go="2">'+(no?'⭐ 2× al':'🎬 Reklam izle · 2× al')+' (+'+s.tp*2+' TP)</button>':'')+'</div>'; }
function goOpen(){ const s=goState(); if(s.taken) return false; let el=$('goUI'); if(!el&&document.createElement){ el=document.createElement('div'); el.id='goUI'; el.className='modal hidden';
    el.innerHTML='<div class="card relcard gocard"><h2>🎁 Günlük ödül</h2><div id="goBody"></div></div>'; document.body.appendChild(el); MODALS.push('goUI');
    el.addEventListener('click',function(e){ const b=e.target.closest('button[data-go]'); if(!b||GO.busy) return;
      if(b.dataset.go==='1'){ goTake(false); el.classList.add('hidden'); if(state==='menu') navRender(); return; }
      GO.busy=true; Array.prototype.forEach.call(el.querySelectorAll('button'),function(x){ x.disabled=true; });
      adsReward('günlük ödül').then(function(ok){ GO.busy=false; if(ok){ goTake(true); el.classList.add('hidden'); if(state==='menu') navRender(); } else goRender(); }); }); }
  if(!el) return false; goRender(); el.classList.remove('hidden'); GO.shown=s.today; return true; }
/* shown once a day when the menu is calm: loading done, account settled, no update card or ads notice open */
setInterval(function(){ try{ if(typeof state==='undefined'||state!=='menu'||(typeof BOOT!=='undefined'&&!BOOT.done)||anyModalOpen()) return;
  if(typeof GUN!=='undefined'&&!GUN.checked) return; if(typeof ADS!=='undefined'&&(ADS.native||ADS.sim)&&!ADS.st.pers) return;
  if(typeof ACC!=='undefined'&&(ACC.status==='connecting'||ACC.status==='syncing'||ACC.status==='newprofile')) return;
  const s=goState(); if(s.taken||GO.shown===s.today) return; goOpen(); }catch(e){} },2500);
/* ---- Harekât: continue from where the chapter failed */
const CDV={ch:null, prog:null, go:false};
function cdvProg(){ const st=DYN.st||{}, p={i:st.i||0, tr:null, dead:[]};
  if(DYN.tr) p.tr={i:DYN.tr.i, p:DYN.tr.p.clone()};
  if(DYN.cur&&DYN.cur.tp==='intercept') targets.forEach(function(t,k){ if(t.dyn&&!t.alive) p.dead.push(k); });
  return p; }
function cdvHas(p){ return !!p&&(p.i>0||(p.tr&&p.tr.i>1)||p.dead.length>0); }
function cdvText(p,D){ if(p.i>0) return p.i+' / '+D.obj.length+' hedef'; if(p.dead.length) return p.dead.length+' İHA düşürüldü'; return 'yolun '+Math.round((p.tr.i-1)/Math.max(1,(D.route||[]).length)*100)+'%\'i'; }
function cdvBtn(show){ const card=$('missionEnd')&&$('missionEnd').querySelector('.card'); if(!card||!card.querySelector) return; let b=$('btnMResume');
  if(!b){ b=document.createElement('button'); b.id='btnMResume'; b.type='button'; b.className='btn gold adx';
    b.addEventListener('click',function(){ if(!CDV.prog) return; b.disabled=true; adsReward('harekât devam').then(function(ok){ if(!ok){ b.disabled=false; return; }
      CDV.go=true; b.classList.add('hidden'); const r=$('btnMRetry'); if(r){ r._adPass=true; r.click(); } }); });
    const stk=card.querySelector('.stack'); card.insertBefore(b,stk||null); }
  b.disabled=false; const ok=show&&typeof adsOfferable==='function'&&adsOfferable(); b.classList.toggle('hidden',!ok);
  if(ok) b.textContent=(typeof adsNoAds==='function'&&adsNoAds()?'⭐ ':'🎬 Reklam izle · ')+'kaldığın yerden devam ('+cdvText(CDV.prog,CDV.ch._D)+')'; }
endMission=HOOK.wrap('endMission','ag/gunluk-odul#cdv',function(next){ return function(ok){ const ch=typeof CAMP!=='undefined'?CAMP.run:null, was=M.done;
  const hit=!was&&ch&&ch._D&&M&&M.id==='dyn'&&DYN.cur===ch._D, prog=hit?cdvProg():null; const r=next.apply(this,arguments);
  if(!was&&M.done){ if(hit&&!ok&&cdvHas(prog)){ CDV.ch=ch; CDV.prog=prog; cdvBtn(true); } else { CDV.ch=null; CDV.prog=null; cdvBtn(false); } } return r; }; },endMission);
setupMission=HOOK.wrap('setupMission','ag/gunluk-odul#cdvSetup',function(next){ return function(){ const r=next.apply(this,arguments);
  if(CDV.go){ CDV.go=false; const ch=CDV.ch, p=CDV.prog; CDV.ch=null; CDV.prog=null;
    if(ch&&p&&typeof CAMP!=='undefined'&&CAMP.run===ch&&missionId==='dyn'&&DYN.cur===ch._D&&DYN.st){ const D=DYN.cur;
      DYN.st.i=Math.min(p.i,D.obj.length-1); dynMarkCur();
      if(p.tr&&DYN.tr){ DYN.tr.i=p.tr.i; DYN.tr.p.copy(p.tr.p); }
      p.dead.forEach(function(k){ const t=targets[k]; if(t&&t.dyn){ t.alive=false; if(t.g) t.g.visible=false; } });
      toast('▶ Kaldığın yerden: '+D.obj[DYN.st.i].n,'#7dffb0'); } }
  return r; }; },setupMission);
