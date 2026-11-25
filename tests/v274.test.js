let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.74: cockpits per aircraft, helicopter cockpits, UAV views */
T_('each manned aircraft its own cockpit',CKP_FOR.kaan==='kaan'&&CKP_FOR.hurjet==='hurjet'&&CKP_FOR.hurkus==='hurkus');
T_('UAVs have no cockpit',['tb2','tb3','akinci','anka','anka3','aksungur','kizilelma'].every(function(id){ return !CKP_FOR[id]&&AIRCRAFT[id].uav; }));
T_('both helicopters',CKP_HELI.t129==='t129'&&CKP_HELI.t625==='t625'&&ckpIsHeli('t625')&&!ckpIsHeli('hurkus'));
const roles={}; ['kaan','hurjet','hurkus','t129','t625'].forEach(function(k){ let S2=null; try{ S2=ckpBuild(k,{hurjet:'B',hurkus:'B',t625:'B'}[k]||'A'); }catch(e){ T_('build '+k,false,e.message); return; }
  roles[k]=S2.scr.map(function(s){ return s.role; }).filter(function(r){ return r!=='radio'; }).join(','); T_('stick and lever '+k,!!S2.stick&&!!S2.thr); });
T_('KAAN one wide display',roles.kaan==='wide',roles.kaan);
T_('Hürjet three MFDs and UFCP',roles.hurjet==='adi,map,sys,ufcp',roles.hurjet);
T_('Hürkuş round gauges',roles.hurkus.indexOf('gauge')>=0,roles.hurkus);
T_('T625 four displays',roles.t625.split(',').length===4,roles.t625);
T_('cockpits differ',new Set([roles.kaan,roles.hurjet,roles.hurkus,roles.t129,roles.t625]).size===5);
T_('Hürkuş propeller',!!ckpBuild('hurkus','B').prop);
const sv=SETTINGS.uavView; SETTINGS.uavView=null; T_('UAV view default sensor',uavView()==='sensor');
SETTINGS.uavView='gcs'; T_('ground station',uavView()==='gcs'); SETTINGS.uavView='vr'; T_('VR removed in V2.75 → sensor',uavView()==='sensor'); SETTINGS.uavView='x'; T_('unknown → sensor',uavView()==='sensor');
SETTINGS.uavView='sensor'; try{ uavCycle(); }catch(e){} T_('cycle sensor → gcs',uavView()==='gcs'); try{ uavCycle(); }catch(e){} T_('cycle wraps',uavView()==='sensor');
state='play'; camMode=1; selectedId='kaan'; setAircraft('kaan'); T_('no UAV views in a manned aircraft',!uavIn());
SETTINGS.uavView=sv; camMode=0;
console.log('v274: pass '+ok+' fail '+bad);
