let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.68: leaderboards — weeks in Türkiye time, the TP queue, race records, lists and the unit race */
/* week starts Monday 00:00 UTC+3: Sunday 23:30 TR is the old week, Monday 00:30 TR the new one */
const sun=Date.UTC(2026,10,29,20,30), mon=Date.UTC(2026,10,29,21,30);   /* 29 Nov 2026 is a Sunday */
T_('week id sunday night',lbWeekId(sun)==='2026-11-23',lbWeekId(sun));
T_('week id monday',lbWeekId(mon)==='2026-11-30',lbWeekId(mon));
T_('week start is monday 00:00 TR',lbWeekStart(mon)===Date.UTC(2026,10,29,21,0));
T_('time left text',/dakika/.test(lbLeft(sun)));
/* the queue: guests queue nothing */
const sv={sb:ACC.sb,user:ACC.user,prof:ACC.prof}; stSet('ayy-lb-bekle',''); 
ACC.sb=null; ACC.user=null; ACC.prof=null; T_('guest queues nothing',lbQueue(50)===0);
const calls=[]; ACC.sb={rpc:function(f,a){ calls.push([f,a]); return Promise.resolve({data:f==='lb_tp_ekle'?a.n:f==='lb_yaris_kaydet'?a.sure:[]}); }, from:function(){ return {select:function(){ return this; },eq:function(){ return this; },maybeSingle:function(){ return Promise.resolve({data:null}); }}; }};
ACC.user={id:'u1'}; ACC.prof={unit:'kara',xp:0,stats:{}};
const xp0=accProfile().xp||0; careerAdd(40,null,'deneme');
T_('careerAdd queues TP',lbPend().n===40&&lbPend().u==='u1',JSON.stringify(lbPend()));
lbQueue(2000); T_('queue adds up',lbPend().n===2040);
ACC.user={id:'u2'}; lbQueue(10); T_('another account starts its own queue',lbPend().u==='u2'&&lbPend().n===10);
ACC.user={id:'u1'}; stSet('ayy-lb-bekle',JSON.stringify({u:'u1',n:2040}));
lbFlush().then(function(){
  T_('sends at most 1500',calls.length===1&&calls[0][0]==='lb_tp_ekle'&&calls[0][1].n===1500,JSON.stringify(calls));
  T_('rest stays queued',lbPend().n===540,JSON.stringify(lbPend()));
  clearTimeout(LB.t);
  /* race record */
  calls.length=0; RACE.def={id:'r_air',n:'Deneme',ac:'hurjet'}; RACE.t=83.25; RACE.rec=[]; RACE.splits=[]; RACE.meshes=[];
  try{ raceFinish(); }catch(e){}
  T_('race time sent in ms',calls.some(function(c){ return c[0]==='lb_yaris_kaydet'&&c[1].y==='r_air'&&c[1].sure===83250; }),JSON.stringify(calls));
  /* lists */
  const html=lbRows([{sira:1,user_id:'u1',callsign:'<b>x',unit:'kara',emblem:'kurt',tp:500},{sira:2,user_id:'u9',callsign:'Hilal 9',unit:'hava',emblem:'hilal',tp:300}],function(r){ return lbTp(r.tp); });
  T_('names escaped',html.indexOf('<b>x')<0&&html.indexOf('&lt;b&gt;x')>=0);
  T_('own row marked',/class="me"/.test(html));
  T_('unit names',html.indexOf('Bozkurtlar')>=0&&html.indexOf('Hilal Kanatlar')>=0);
  T_('empty list',/İlk sen ol/.test(lbRows([])));
  LB.me={unit:'kara',hafta_tp:120,hafta_sira:3};
  const b=lbBirlik({now:[{unit:'kara',tp:900,oyuncu:2},{unit:'hava',tp:300,oyuncu:1}],prev:[{unit:'deniz',tp:50,oyuncu:1}]});
  T_('leading unit crowned',b.indexOf('👑 Bozkurtlar')>=0,b.slice(0,400));
  T_('all three units shown',b.indexOf('Mavi Kanatlar')>=0&&b.indexOf('Hilal Kanatlar')>=0);
  T_('last week winner',b.indexOf('Geçen haftanın kazananı: <b>Mavi Kanatlar')>=0);
  T_('share 75%',b.indexOf('width:75%')>=0);
  T_('menu entry',NAV_D.c_rank&&NAV_IC.trophy&&typeof lbOpen==='function');
  ACC.sb=sv.sb; ACC.user=sv.user; ACC.prof=sv.prof; stSet('ayy-lb-bekle',''); LB.me=null;
  console.log('v268: pass '+ok+' fail '+bad);
});
