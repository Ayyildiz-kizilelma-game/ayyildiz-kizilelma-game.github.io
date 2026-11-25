let ok=0,bad=0; function T_(n,c,i){ if(c){ok++;} else {bad++; console.log('FAIL',n,i===undefined?'':i);} }
/* V2.70: fleets */
T_('clean names pass',flTemiz('Hilal Kartalları')&&flTemiz('Akşamları birlikte uçuyoruz'));
T_('bad words caught',!flTemiz('selam amk')&&!flTemiz('Orospu filo'));
T_('no false alarm inside words',flTemiz('Sikorsky')&&flTemiz('Kasıkçı')&&flTemiz('Gotik'));
T_('reward tiers',flOdulTier(9999)===0&&flOdulTier(10000)===50&&flOdulTier(30000)===100&&flOdulTier(80000)===200);
const sv={sb:ACC.sb,user:ACC.user,prof:ACC.prof};
ACC.user={id:'me'}; ACC.prof=Object.assign({},accProfile());
/* member view as komutan */
FL.me={filo_id:'f1',rol:'komutan'}; FL.fleet={id:'f1',ad:'Hilal <Kartal>',etiket:'HK',amblem:'hilal',aciklama:'Akşam uçuşu',duyuru:'Cuma 21:00',acik:false};
FL.members=[{user_id:'me',callsign:'Hilal 1',unit:'hava',emblem:'hilal',rank:8,rol:'komutan',tp:6000},{user_id:'b',callsign:'Mavi 2',unit:'deniz',emblem:'kartal',rank:3,rol:'yardimci',tp:3000},{user_id:'c',callsign:'Kurt',unit:'kara',emblem:'kurt',rank:1,rol:'pilot',tp:2000}];
FL.reqs=[{user_id:'d',callsign:'Yeni',unit:'hava',emblem:'hilal',rank:0}]; FL.view='f1';
let h=flRenderFleet();
T_('name escaped',h.indexOf('<Kartal>')<0&&h.indexOf('&lt;Kartal&gt;')>=0);
T_('week total and goal',flWeekTotal()===11000&&/10 bin TP → \+50 TP/.test(h));
T_('first goal reached',/class="on"/.test(h));
T_('requests for komutan',/data-fl="kabul" data-id="d"/.test(h));
T_('komutan can kick and promote',/data-fl="cikar" data-id="c"/.test(h)&&/data-fl="rol" data-r="yardimci" data-id="c"/.test(h)&&/data-fl="devret" data-id="b"/.test(h));
T_('no actions on self',!/data-id="me"/.test(h));
T_('settings for officers',/Filo ayarları/.test(h));
/* as pilot */
FL.me.rol='pilot'; h=flRenderFleet();
T_('pilot sees no actions',!/data-fl="cikar"/.test(h)&&!/Filo ayarları/.test(h)&&!/data-fl="kabul"/.test(h));
T_('leave button',/data-fl="ayril"/.test(h));
/* yardımcı: kicks pilots only */
FL.me.rol='yardimci'; FL.members[0].rol='komutan'; FL.members[1].user_id='me2'; h=flRenderFleet();
T_('yardımcı kicks pilots only',/data-fl="cikar" data-id="c"/.test(h)&&!/data-fl="cikar" data-id="me"/.test(h)&&!/data-fl="devret"/.test(h));
/* list view */
FL.me=null; FL.fleet=null; FL.view=null; FL.apps=['f2'];
FL.list=[{sira:1,id:'f1',ad:'Açık Filo',etiket:'AF',amblem:'hilal',aciklama:'',acik:true,uye:5,tp:900},{sira:2,id:'f2',ad:'Kapalı',etiket:'KP',amblem:'kurt',aciklama:'x',acik:false,uye:8,tp:300},{sira:3,id:'f3',ad:'Dolu',etiket:'DL',amblem:'kurt',aciklama:'',acik:true,uye:30,tp:0}];
h=flRenderList();
T_('join open',/data-fl="katil" data-id="f1">Katıl/.test(h));
T_('applied shows withdraw',/data-fl="geri" data-id="f2"/.test(h));
T_('full fleet',/Dolu<\/span>/.test(h)&&!/data-id="f3">Katıl/.test(h));
/* leaderboard tag */
const row=lbRows([{sira:1,user_id:'x',callsign:'Hilal 9',unit:'hava',emblem:'hilal',tp:10,etiket:'HK'}],function(r){ return lbTp(r.tp); });
T_('fleet tag in leaderboard',/<span class="fltag">HK<\/span>Hilal 9/.test(row));
T_('fleets tab',LB_TABS.some(function(t){ return t[0]==='filo'; }));
/* weekly reward */
const q=function(rows){ const o={select:function(){ return o; },eq:function(){ return o; },then:function(a,b){ return Promise.resolve({data:rows}).then(a,b); }}; return o; };
let n=0; ACC.sb={from:function(t){ n++; return n===1?q([{filo_id:'f1',user_id:'me',tp:400}]):q([{tp:400},{tp:12000}]); }, rpc:function(){ return Promise.resolve({data:[]}); }};
ACC.user={id:'me'}; stSet('ayy-filo-odul',''); FL.odul=false; const xp=accProfile().xp;
flOdul().then(function(r){
  T_('fleet reward given',r===50&&accProfile().xp-xp===50,r);
  FL.odul=false; return flOdul(); }).then(function(r){
  T_('only once a week',r===0);
  T_('menu entry',NAV_D.c_filo&&typeof flOpen==='function');
  ACC.sb=sv.sb; ACC.user=sv.user; ACC.prof=sv.prof; FL.me=null; FL.list=null; stSet('ayy-filo-odul','');
  console.log('v270: pass '+ok+' fail '+bad); });
