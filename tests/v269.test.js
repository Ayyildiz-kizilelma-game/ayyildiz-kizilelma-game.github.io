let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.69: seasons, Harekât Kartı, daily reward, continue in Harekât */
T_('first season on 18 March 2027',SEZONLAR[1].bas==='2027-03-18');
T_('preparation now',szAt(Date.UTC(2026,10,25))&&szAt(Date.UTC(2026,10,25)).id==='s0');
T_('season 1 starts at 00:00 TR',szAt(Date.UTC(2027,2,17,21,0)).id==='s1'&&szAt(Date.UTC(2027,2,17,20,59)).id==='s0');
T_('seasons follow each other',SEZONLAR.every(function(S,i){ return i===0||S.bas===SEZONLAR[i-1].bit; }));
T_('national day',szBayram(Date.UTC(2027,9,29,10))&&!szBayram(Date.UTC(2027,9,30,10)));
const S1=SEZONLAR[1], tr=szTrack(S1);
T_('30 levels',tr.length===30);
T_('pass gives only paints and emblems',tr.every(function(r){ return !r.kart||!r.kart.tp; }));
T_('pass has 4 paints and 2 emblems',tr.filter(function(r){ return r.kart&&r.kart.boya; }).length===4&&tr.filter(function(r){ return r.kart&&r.kart.emb; }).length===2);
T_('preparation has no pass',szTrack(SEZONLAR[0]).every(function(r){ return !r.kart; }));
T_('season paints listed',PSCHEMES.some(function(P){ return P.id==='sz1_altin'&&P.sz==='s1'; })&&EMBLEMS.some(function(e){ return e[0]==='sz1_capa'; }));
/* progress in the preparation season */
SZ.now=Date.UTC(2026,10,25,12); const p=accProfile(); p.stats=p.stats||{}; delete p.stats.sezon; p.stats.koz=[];
const z=szState(); T_('state starts',z.id==='s0'&&z.sp===0);
careerAdd(700,null,'deneme'); T_('TP counts as SP',szState().sp===700,szState().sp);
careerAdd(500,null,'deneme'); T_('level 1',szLevel(szState())===1);
T_('one reward ready',szClaimable()===1);
const xp=p.xp; T_('claim',szClaim(1,false)===true&&p.xp===xp+szTrack(SEZONLAR[0])[0].free.tp);
T_('season reward gives no SP',szState().sp===1200,szState().sp);
T_('no double claim',szClaim(1,false)===false);
T_('cannot claim unreached',szClaim(5,false)===false);
szState().sp=5000; T_('emblem at level 5',szClaim(5,false)&&szOwns('sz0_nisan'));
T_('paint locked until earned',(paintSet(selectedId,'sz0_hazirlik'),PAINT[selectedId]!=='sz0_hazirlik'));
szState().sp=99999; T_('capped at last level',szState().sp===99999||szLevel(szState())===10);
/* national day doubles */
SZ.now=Date.UTC(2027,2,18,12); delete p.stats.sezon; const z1=szState(); T_('season 1 state',z1.id==='s1');
careerAdd(100,null,'deneme'); T_('2× SP on 18 March',szState().sp===200,szState().sp);
T_('pass reward needs the card',(szState().sp=2000,szClaim(1,true)===false));
entSet([{product:'kart_s1',source:'yonetici'}]); T_('with the card',szClaim(1,true)&&szOwns('sz1_seddulbahir'));
/* season change hands out unclaimed rewards */
szState().sp=10000; const xp2=p.xp; SZ.now=Date.UTC(2027,4,20,12); const z2=szState();
T_('next season',z2.id==='s2'&&z2.sp===0);
T_('unclaimed season 1 rewards given',szOwns('sz1_capa')&&szOwns('sz1_dalga')&&p.xp>xp2,p.xp-xp2);
entSet([]); SZ.now=null;
/* weekly season tasks */
T_('three weekly tasks',szTasks().length===3&&szTasks().every(function(t){ return t.sp===500; }));
/* daily reward */
p.stats.gunluk=null; const d1=Date.UTC(2026,10,25,9), d2=Date.UTC(2026,10,26,9), d4=Date.UTC(2026,10,28,9);
T_('day 1',goState(d1).day===1&&goState(d1).tp===50);
const x0=p.xp; T_('take',goTake(false,d1)===50&&p.xp-x0===50);
T_('only once a day',goTake(false,d1)===0);
T_('next day grows',goState(d2).day===2&&goTake(true,d2)===120);
T_('missed day restarts',goState(d4).day===1);
p.stats.gunluk={son:'2026-11-24',seri:7}; T_('after 7 days back to 1',goState(d1).day===1);
/* continue in Harekât */
T_('progress check',cdvHas({i:1,tr:null,dead:[]})&&!cdvHas({i:0,tr:null,dead:[]})&&cdvHas({i:0,tr:{i:3},dead:[]})&&cdvHas({i:0,tr:null,dead:[2]}));
try{ const ch=CAMP_CH[0], D=ch.D(); Object.assign(D,{id:'camp_k1',kind:'dyn',sub:'air',cat:'dinamik',dur:15,name:'Kızıl Elma 1'}); ch._D=D; ch.ix=0;
  DYN.cur=D; missionId='dyn'; CAMP.run=ch; setupMission(); DYN.st.i=2; endMission(false);
  T_('failed chapter keeps progress',CDV.prog&&CDV.prog.i===2&&CDV.ch===ch,JSON.stringify(CDV.prog&&{i:CDV.prog.i}));
  CDV.go=true; setupMission(); T_('restart resumes at objective 3',DYN.st.i===2&&!CDV.go&&!CDV.prog,DYN.st.i);
  setupMission(); T_('plain retry starts over',DYN.st.i===0);
  CAMP.run=null; DYN.cur=null; }catch(e){ T_('campaign continue ran',false,e.message); }
T_('menu entries',NAV_D.c_sezon&&typeof szOpen==='function'&&typeof goOpen==='function');
delete p.stats.sezon; p.stats.gunluk=null;
console.log('v269: pass '+ok+' fail '+bad);
