let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.71: Gece Görev Paketi */
entSet([]);
T_('five missions',GP_CH.length===5);
T_('first one free',gpOpenIx(0)&&!gpOpenIx(1)&&!gpOpenIx(4));
T_('store product',STORE.some(function(s){ return s.id==='gece'; }));
entSet([{product:'gece',source:'yonetici'}]); T_('pack opens all',GP_CH.every(function(c,i){ return gpOpenIx(i); }));
T_('every mission builds',GP_CH.every(function(c){ const D=c.D(); return D.obj&&D.obj.length&&D.lim>0&&D.xp>0; }));
/* night only for the pack mission */
SETTINGS.tod='day'; WX.vis='off';
const ch=GP_CH[2], D=ch.D(); Object.assign(D,{id:'gece_g3',kind:'dyn',sub:'air',cat:'dinamik',dur:10,name:'Gece 3'}); ch._D=D;
DYN.cur=D; missionId='dyn'; GP.run=ch; if(typeof CAMP!=='undefined') CAMP.run=null;
try{ setupMission(); }catch(e){ T_('setup ran',false,e.message); }
T_('night during the mission',SETTINGS.tod==='night'&&WX.vis==='nvg');
let xp0=accProfile().xp; const p=accProfile(); p.stats=p.stats||{}; delete p.stats.gece; PLAY.mode='career';
try{ endMission(true); }catch(e){ T_('end ran',false,e.message); }
T_('stars saved',gpProg().g3>=1,JSON.stringify(gpProg()));
T_('first-time bonus',accProfile().xp-xp0>=ch.bonusTP,accProfile().xp-xp0);
/* retry keeps night; another mission restores the player's settings */
try{ setupMission(); }catch(e){}
T_('retry still night',SETTINGS.tod==='night');
DYN.cur=null; missionId='intercept'; try{ setupMission(); }catch(e){}
T_('other mission restores day',SETTINGS.tod==='day'&&WX.vis==='off'&&GP.run===null,[SETTINGS.tod,WX.vis,!!GP.run,JSON.stringify(GP.keep)].join());
/* medal after all five */
const P={g1:1,g2:2,g3:3,g4:1,g5:1}; T_('medal rule',MEDALS.find(function(m){ return m[0]==='gecekartali'; })[3]({gece:P}));
T_('menu entries',NAV_D.c_gece&&NAV_D.q_gece&&typeof gpOpen==='function');
entSet([]); delete p.stats.gece;
console.log('v271: pass '+ok+' fail '+bad);
