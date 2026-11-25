#!/usr/bin/env python3
"""Özellik envanteri (V2.36): oyundaki her özelliğin kartı tek yerde.
Bu dosyadan iki çıktı üretilir:
  docs/OZELLIKLER.md            — geliştirici ve karar listesi
  src/js/veri/rehber-veri.js    — oyundaki "Rehber" ekranının verisi
Kullanım: python3 tools/ozellikler.py   (yayın betiği de çalıştırır)
Durum: iyi · iyileştirilmeli · birleştirilmeli · kaldırılmalı · denenmeli (gerçek oyunda/cihazda doğrulanmadı)
"""
import json, os, re
ROOT = os.path.join(os.path.dirname(__file__), '..')
T = lambda *a: list(a)
# kat, ad, ne yapar, nereden açılır, tuş/düğme, ilk sürüm, testler, durum, not (durum gerekçesi / öneri)
F = [
 # ---- Uçuş
 ('Uçuş','Uçak seçimi ve hangar','On Türk uçağı ve İHA arasından seçim; hangarda 3B inceleme, boya, performans çubukları ve karşılaştırma.','Hızlı Oyun → Serbest Uçuş / Sürüş · Kariyer → Hangar','—','V1.24',T('picker','menu3'),'iyi',''),
 ('Uçuş','Uçuş modeli','Gaz, art yakıcı, fren, iniş takımı; uçağa göre gerçek hız, tırmanma ve servis tavanı.','Her uçuşta','W/S/A/D · Q/E · R/F · Shift · B · G','V1.02',T('features','realperf'),'iyi',''),
 ('Uçuş','Taksi ve kalkış','Hangardan piste taksi, otomatik taksi ve taksiyi atlama; kule izni.','Başlangıç yeri: Hangardan','T otomatik taksi · L taksiyi atla','V1.00',T('taxi','hangar_taxi','airport'),'iyi',''),
 ('Uçuş','İniş yardımı','Piste yaklaşırken süzülüş ve merkez hattı göstergesi, istenirse otomatik iniş.','Ayarlar → Uçuş → Uçuş yardımı','—','V1.96',T('assist'),'iyi',''),
 ('Uçuş','Uçuş konforu','Otomatik denge, türbülans ayarı, kare süresi yumuşatma.','Ayarlar → Uçuş','—','V1.84',T('comfort'),'iyi',''),
 ('Uçuş','3B kokpit','Çalışan çok işlevli ekranlar, kafa hareketi.','Uçuşta kamera değiştir','C','V1.89',T('cockpit'),'iyi','Tıklanabilir kokpit düğmeleri yol haritasının sonundaki fikirlerde.'),
 ('Uçuş','Akrobasi','Akrobasi dumanı, figür tanıyıcı ve akrobasi gösterisi görevi.','Görevler · uçuşta duman','F6 duman','V2.07',T('acro'),'iyi',''),
 ('Uçuş','Hasar, yakıt ve fırlatma koltuğu','Parça hasarı, yakıt tüketimi, ikmal-onarım, fırlatma koltuğu.','Her uçuşta','J (iki kez) fırlatma','V1.73',T('damage','service'),'iyi',''),
 ('Uçuş','Bakım hangarı','Yerde bakım hangarına girince silah yükleme ve onarım.','Üste bakım hangarı','—','V1.00',T('service'),'iyi',''),
 ('Uçuş','İHA uçuş bilgisayarı','İHA\'larda irtifa ve rota tutan uçuş bilgisayarı.','İHA ile uçarken','—','V1.96',T('uav','assist'),'iyi',''),
 # ---- Silah ve savaş
 ('Silah ve savaş','Silahlar ve yük ekranı','Top, 2 bomba ve 3 füze tipi; uçağa göre yük, hazır yük grupları.','Hangar → Yük · Bakım hangarı','Space top · X silah · N sıradaki · 1–5','V1.02',T('setup','features','v230'),'iyi','Silahlı bütün uçaklar (KAAN, TB2, TB3, Akıncı, Kızılelma, ANKA-3, Aksungur, Hürjet, Hürkuş) gerçek Türk mühimmatıyla (V2.41–V2.48); ANKA silahsız keşif İHA\'sı.'),
 ('Silah ve savaş','Gerçek Türk mühimmatı','Model serisinden geçen uçaklar gerçek mühimmat taşır: KAAN\'da GÖKDOĞAN, BOZDOĞAN, SOM-J (iç silah yuvasında, kapaklar atışta açılır), HGK-82 ve NEB-84 (kanat altında). TB2 (V2.42) ve TB3\'te (V2.43) MAM-L, MAM-C ve MAM-T. Akıncı\'da TEBER-82, NEB-84, L-UMTAS, GÖKDOĞAN ve SOM-A (V2.44). Kızılelma\'da iç silah yuvasıyla BOZDOĞAN, GÖKDOĞAN, SOM-J; kanat altında TEBER-82 ve NEB-84 (V2.45). ANKA-3\'te iç yuvada TEBER-82 ve SOM-J, dış kanatta MAM-L (V2.46; model V2.50\'de oyuncunun fotoğraflarıyla yenilendi). Aksungur\'da TEBER-82, MAM-C ve MAM-T (V2.47). Hürjet\'te TEBER-82, HGK-82, BOZDOĞAN ve GÖKDOĞAN; Hürkuş\'ta MAM-L, MAM-C ve LUMTAS (V2.48). Veriler Defence Turk Sistem Envanteri\'nden.','Hangar → Yük · Model Kütüphanesi → Mühimmat','X silah · 1–5 silah seç','V2.41',T('v241','v242','v243','v244','v245','v246','v247','v248','v250','setup'),'iyi','Diğer uçaklar model serisinde sırayla gelecek'),
 ('Modeller','Ayrıntılı helikopter, kara aracı ve gemi modelleri','T129 ATAK (CİRİT ve L-UMTAS ile), T625 GÖKBEY, Altay, T-155 Fırtına, Pars III 8×8, Kirpi, Korkut, Hisar-A, Ada sınıfı korvet, İstif fırkateyni, TCG Anadolu ve Tuzla sınıfı hücumbot yenilendi (V2.49): eğik zırh plakaları, yol tekerlekleri ve palet bantları, nişangâhlar, uzaktan kumandalı silah istasyonları, gemilerde küpeşte, 76 mm top, can salları. Kütüphanede eski modelle karşılaştırılabilir.','Model Kütüphanesi · Kara üssü · Deniz üssü','—','V2.49',T('v249'),'iyi','Modeller kod içinde çizilir; eski modeller buildXV1 olarak durur.'),
('Silah ve savaş','Hedef kilidi','Füzeler için hedef kilidi, kilit uyarısı açılıp kapatılabilir.','Uçuşta','K kilit · Tab hedef değiştir','V1.02',T('features'),'iyi',''),
 ('Silah ve savaş','Düşman uçakları ve kanat adamı','Kırmızı Kuvvet savaş uçakları, yapay zekâ kanat adamı (Kılıç 2) ve ona emir verme.','Görev ekranı → düşman / kanat adamı','F8 kanat adamı emirleri','V1.10',T('ai','wing','enemy'),'iyi',''),
 ('Silah ve savaş','Hava savunma ve füzeden kaçış','SAM bataryaları, füze uyarısı, gerçekçi füze modeli, flare ve kaçış yardımı.','Görev ekranı → SAM','Z flare · F7 kaçış','V1.51',T('evade','enemy'),'iyi',''),
 ('Silah ve savaş','Gece görüş ve termal kamera','NVG ve FLIR görünümleri.','Uçuşta','` (Backquote)','V1.74',T('weather'),'iyi',''),
 # ---- Araçlar
 ('Kara ve deniz araçları','Yürüyüş','Birinci şahıs yürüme, koşma, zıplama, araçlara ve uçaklara binme.','Hızlı Oyun → Üssü Gez','WASD · Shift · Space · E bin','V1.34',T('walk','indoor'),'iyi',''),
 ('Kara ve deniz araçları','Kara araçları','Arabalar, tanklar, zırhlılar, itfaiye, uçak çekici; her birinin kendi sürüşü, turbo, park etmiş araçlara binme.','Yürürken araca bin · Araç çağır','W/S/A/D · Shift turbo · T araç değiştir','V1.54',T('vehicles','land','collide'),'iyi',''),
 ('Kara ve deniz araçları','Deniz araçları','Hücumbot, korvet, TCG Anadolu; makine telgrafı, dümen, gemi topları, helikopter güvertesi, kıyıya yanaşma.','Marina ve deniz üssü · Araç çağır','W/S hız · A/D dümen · Space top','V1.70',T('boats','naval','groundsea'),'iyi',''),
 ('Kara ve deniz araçları','Araç çağırma','Kara, hava ve deniz aracını bulunduğun yere teslim ettirme (lojistik telsizi).','Yürürken','G araç çağır','V1.71',T('call'),'iyi',''),
 ('Kara ve deniz araçları','Helikopterler','T129 ATAK ve T625 Gökbey: askı yükü, asker taşıma, kapı silahı, askı yardımı.','Hangar · üslerdeki helikopterler','R/F kolektif · B kanca · J askı yardımı','V1.55',T('heli','heliops'),'iyi',''),
 # ---- Dünya
 ('Dünya','Ada ve üsler','30 km\'lik ada: hava üssü, deniz üssü, kara üssü, İHA adası, marina, köyler, Hilalkent ve Anadolukent, Kızıl Bölge, simge yapılar.','Harita','M harita','V1.31',T('airport','naval','land','uav','marina','town','rural','south','military','landmarks'),'iyi',''),
 ('Dünya','Canlı dünya','Trafik, yayalar, yer personeli, hava trafiği, martılar, ortam sesleri.','Her yerde','—','V1.42',T('airlife','town'),'iyi',''),
 ('Dünya','Gün saati ve hava durumu','Gün/gece, sabah sisi, yağmur, kar, fırtına, rüzgâr ve türbülans.','Ayarlar → Dünya · görev ekranı','—','V1.46',T('daynight','weather'),'iyi',''),
 ('Dünya','Harita ve ışınlanma','Tam ekran harita, köşe haritası, yerler listesine ışınlanma, haritaya işaret ve işaret çarkı.','Uçuşta ve yürürken','M harita · F4 işaret','V1.53',T('map','comms'),'iyi',''),
 # ---- Görev ve modlar
 ('Görevler ve modlar','Gece Görev Paketi','Beş gece görevi (keşif, İHA avı, gece taarruzu, deniz devriyesi, refakat); gece görüş görev başında açılır, termal görüşe geçilebilir. İlk görev ücretsiz, diğerleri mağazadaki Gece Görev Paketi ile açılır. İlk tamamlamada TP bonusu, beşinde Gece Kartalı madalyası. Gece ve gece görüş yalnız bu görevler için, sonra oyuncunun ayarı geri gelir.','Kariyer → Gece Görev Paketi · Hızlı Oyun → Gece Görev Paketi','` gece görüş / termal','V2.71',T('v271'),'iyi','Satın alma V2.74 (Google Play) ile; şimdilik yönetici deneme için tanımlayabilir.'),
 ('Görevler ve modlar','Hızlı Oyun','Kariyerden bağımsız: hemen başla, serbest uçuş/sürüş, hızlı görev, üssü gez. Her şey açık, puan kazandırmaz.','Ana menü → Hızlı Oyun','—','V1.82',T('menu2','menu3','v229'),'iyi',''),
 ('Görevler ve modlar','Hızlı Savaş','Botlara karşı havada başlayan dört mod: İt Dalaşı, Serbest Çatışma, Yer Taarruzu, Hava Hedefleri.','Ana menü → Hızlı Oyun → Hızlı Savaş','—','V2.29',T('v229'),'iyi',''),
 ('Görevler ve modlar','Görev panosu','Bütün görevler tek ekranda: uçak, helikopter, kara, deniz, yarış; brifing, hedef takibi, görev günlüğü, görev sonu raporu.','Kariyer → Görevler · Hızlı Oyun → Hızlı Görev','F2 görev günlüğü','V1.76',T('board','misui'),'iyi',''),
 ('Görevler ve modlar','Dinamik görevler','Her seferinde farklı, çok aşamalı görevler ve görev ortası olaylar; günlük ve haftalık görevler.','Görev panosu','—','V1.77',T('dynamic','progress'),'iyi',''),
 ('Görevler ve modlar','Harekât: Kızıl Elma','Sekiz bölümlük hikâyeli harekât; bölümler sırayla açılır, final madalya verir.','Kariyer → Harekât','—','V1.98',T('campaign'),'iyi',''),
 ('Görevler ve modlar','Yarışlar','Kapılı yarışlar, süre, hayalet ve sıralama tablosu.','Görev panosu → Yarışlar','—','V1.80',T('races'),'iyi',''),
 ('Görevler ve modlar','Görev editörü','Kendi görevini kur: aşamalar, tetikleyiciler, dene, kaydet ve paylaş.','Görevler → ＋ Görev editörü','—','V1.81',T('editor','v237'),'iyi','V2.37: Görevler ekranında görünür düğme; Dene / Kaydet altta sabit. 29 Ekim denemesinde dokunarak yerleştirme ve Dene çalıştı.','iyileştirilmeli','29 Ekim denemesi (telefon boyutu, dokunarak): hedef ve düşman yerleştirme, Dene çalışıyor. Ama editör zor bulunuyor (Görevler → Özel → en alttaki "＋ Yeni görev oluştur") ve Dene / Kaydet düğmeleri sağ panelin altında, kaydırmadan görünmüyor. V2.37\'de düzeltilecek.'),
 ('Görevler ve modlar','Kara ve deniz görevleri','Tank, araç ve gemi ile görevler.','Görev panosu','—','V1.99',T('groundsea'),'iyi',''),
 # ---- Kariyer
 ('Kariyer ve ilerleme','Rütbe ve tecrübe puanı','Er\'den Orgeneral\'e rütbeler, terfi töreni; rütbeyle açılan uçaklar, araçlar, görevler ve boyalar.','Ana menü → Kariyer','—','V1.67',T('career','progress'),'iyi',''),
 ('Kariyer ve ilerleme','Uçuş okulu','Adım adım dersler: kalkış, iniş, rüzgârlı iniş, helikopter, askı yükü, silah, gemiye iniş.','Kariyer → Eğitim','—','V1.78',T('school'),'iyi',''),
 ('Kariyer ve ilerleme','Sezonlar ve Harekât Kartı','Sezonlar millî günlerde başlar (18 Mart, 19 Mayıs, 30 Ağustos, 29 Ekim; ilk sezon 18 Mart 2027, o güne kadar Hazırlık Dönemi). Kariyerde kazanılan her TP sezon puanı da sayılır (millî günde 2 kat); haftalık 3 sezon görevi. Ücretsiz yolda TP, sezon amblemi ve kaplaması; Harekât Kartı yolunda yalnız sezon kaplamaları ve amblemler. Alınmamış ödüller sezon bitince verilir.','Kariyer → Harekât Kartı','—','V2.69',T('v269'),'iyi','Harekât Kartı satın alma V2.74 (Google Play) ile; şimdilik yönetici deneme için tanımlayabilir.'),
 ('Kariyer ve ilerleme','Günlük ödül','Her gün ilk girişte günlük ödül: 7 gün üst üste 50 → 150 TP, bir gün kaçarsa baştan. İstenirse ödüllü reklamla 2 kat (Reklamsız ürününde reklamsız).','Ana menü (günde bir kez)','—','V2.69',T('v269'),'iyi',''),
 ('Kariyer ve ilerleme','Filo','Oyuncuların kurduğu en çok 30 pilotluk gruplar: Teğmen rütbesinden filo kur (ad, etiket, arma, açıklama) ya da açık filoya katıl, kapalıya başvur. Komutan, yardımcı ve pilot rolleri; duyuru, başvuru onayı, pilot çıkarma, komutanlık devri. Filoda kazanılan TP filonun haftalık toplamına yazılır; 10/25/50 bin TP hedefine ulaşan filonun katkı verenleri 50/100/200 TP alır. Filo etiketi sıralamada görünür, Sıralama\'da Filolar sekmesi.','Kariyer → Filo','—','V2.70',T('v270'),'denenmeli','Birden çok gerçek hesapla denenmeli (başvuru, onay, devir).'),
 ('Kariyer ve ilerleme','Sıralama ve birlik yarışı','Bulut sıralaması: bu haftanın ve tüm zamanların en çok TP kazanan pilotları, her yarışın en iyi süreleri. Birlik yarışı: haftanın TP\'si birliklere (Hilal Kanatlar, Mavi Kanatlar, Bozkurtlar) toplanır; kazanan birlikte o hafta TP kazanan herkes 150 TP alır. Hafta Pazartesi 00:00\'da (Türkiye saati) başlar. Misafir okuyabilir, giriş yapan listeye girer.','Kariyer → Sıralama','—','V2.68',T('v268'),'iyi',''),
 ('Kariyer ve ilerleme','Ehliyet ve sertifikalar','İHA pilotu, pilot, tank sürücüsü, araç sürücüsü, kaptan belgeleri ve sınavları; belgesiz kullanım engeli.','Kariyer → Ehliyet ve Sertifikalar','—','V1.92',T('licenses'),'iyi',''),
 ('Kariyer ve ilerleme','Başarımlar, madalyalar, istatistikler','Başarımlar, madalyalar, uçuş istatistikleri, rekorlar.','Kariyer · üstteki kupa düğmesi','—','V1.79',T('progress'),'iyi',''),
 # ---- Çok oyunculu
 ('Çok oyunculu','Çevrimiçi oda','Sunucusuz P2P oda (en çok 4 kişi): işbirliği, takım savaşı, herkes herkese; boş yerleri botlar doldurur.','Ana menü → Çok Oyunculu','—','V1.24',T('net','net_ffa'),'denenmeli','29 Ekim denemesi: aynı bilgisayarda iki ayrı oyun sayfası (telefon boyutu) oda kurdu, katıldı, maç başladı, konumlar eşleşti (fark < 5 m), yazılı sohbet iki yönde çalıştı, hata yok. Bağlantı katmanı burada taklit edildi (PeerJS sunucusuna bu ortamdan erişilemiyor); internet üzerinden iki gerçek cihaz hâlâ denenmeli.'),
 ('Çok oyunculu','Karma çok oyunculu ve üs ele geçirme','Uçak, araç ve gemiler aynı maçta; üs ele geçirme modu; kule görevlisi rolü.','Çok Oyunculu → mod','—','V1.83',T('net_mix'),'denenmeli','Oda ve sohbet katmanı 29 Ekim\'de iki sayfayla doğrulandı; karma mod ve üs ele geçirme iki gerçek cihazla denenmeli.'),
 ('Çok oyunculu','Sesli ve yazılı sohbet','Bas-konuş sesli sohbet, yazılı sohbet, oyuncu çıkarma.','Çok oyunculu maçta','I bas-konuş · / sohbet','V1.62',T('net','comms'),'denenmeli','Yazılı sohbet 29 Ekim\'de doğrulandı. Sesli sohbet mikrofon ve gerçek bağlantı istiyor; yalnız iki gerçek cihazla denenebilir.'),
 # ---- Ses ve telsiz
 ('Ses ve telsiz','Müzik','Oyunun kendi bestesi: menü, sakin uçuş, çatışma, zafer, yenilgi; ara ara çalar.','Ayarlar → Ses → Müzik / Müzik sıklığı','U sesi kapat','V1.61',T('sound','v228'),'iyi',''),
 ('Ses ve telsiz','Telsiz','Kule, AWACS (Kartal Gözü), kanat adamı ve eğitmen konuşmaları; hazır mesaj menüsü, altyazı.','Uçuşta','O telsiz menüsü','V1.62',T('radio'),'iyi',''),
 # ---- Kontroller
 ('Kontroller','Dokunmatik kontroller','Serbest çubuk, gaz, ATEŞ, FLARE, TEKER, dümen; düzen düzenleyici ve hazır düzenler (Klasik, Sol el, Eğerek uç).','Telefonda kendiliğinden · Ayarlar → Kontroller → Dokunmatik','—','V1.52',T('phone','touch2','controls'),'iyi',''),
 ('Kontroller','Oyun kolu ve klavye','Tam oyun kolu desteği, tuş atama, kontrol şemaları; kısayol çakışma denetimi.','Ayarlar → Kontroller','—','V1.52',T('controls','input'),'iyi',''),
 ('Kontroller','Titreşim ve eğerek uçuş','Telefon titreşimi ve telefonu eğerek yönlendirme.','Ayarlar → Kontroller','—','V1.90',T('phone'),'iyi',''),
 # ---- Medya
 ('Fotoğraf ve tekrar','Tekrar izleme','Son uçuşu kameralar ve zaman çubuğuyla yeniden izleme.','Uçuşta','F3','V1.87',T('replay'),'iyi',''),
 ('Fotoğraf ve tekrar','Fotoğraf modu','Arayüzsüz serbest kamera ile fotoğraf.','Uçuşta','H','V1.87',T('replay'),'iyi',''),
 # ---- Grafik ve performans
 ('Grafik ve performans','Hızlı ikinci açılış','Oyun kodu ayrı bir dosyada (oyun.js): tarayıcı ve çevrimdışı önbellek derlenmiş kodu saklar, ikinci açılış daha hızlı. Her sürüm yeni adla yüklenir, eski kod kalmaz. Her şeyin tek dosyada olduğu tek-dosya.html indirme ve paylaşma için duruyor.','Kendiliğinden','—','V2.51',T('boot'),'iyi','Derleyici index.html + oyun.js + tek-dosya.html yazar; build.py --check üçünü de denetler.'),
 ('Grafik ve performans','Grafik ayarları','Otomatik / hazır ayarlar, ayrıntılı ayarlar, maliyet etiketleri, canlı fark, arama, varsayılana dön.','Ayarlar → Grafik','—','V1.57',T('gfx2','settings2','quality','settings'),'iyi',''),
 ('Grafik ve performans','Akıllı performans','Otomatik çözünürlük, kalite basamakları, eşit aralıklı 30 FPS, ısınmaya karşı sabit kalite.','Ayarlar → Grafik → Otomatik','—','V1.94',T('perf','perf2','quality'),'iyi',''),
 ('Grafik ve performans','Performans testi','2 dakikalık sabit rota, özellik maliyetleri, darboğaz, önerilen ayarlar, anonim rapor.','Ayarlar → Grafik → Sorun giderme → Performans testi','—','V2.12',T('perftest','v234'),'iyi',''),
 ('Grafik ve performans','Görüntü sorunu testi','Katmanları tek tek kapatıp görüntü hatasının kaynağını bulma.','Ayarlar → Grafik → Sorun giderme → Görüntü testi','—','V1.97',T('gfxtest','v237'),'iyi','V2.37: Performans testi ve Tanılama ile tek "Sorun giderme" ekranında.'),
 ('Grafik ve performans','Grafik tanılama','Cihaz bilgisi, derinlik, efekt durumu gibi tanılama satırları.','Ayarlar → Grafik → Sorun giderme → Tanılama','—','V1.59',T('gfxtest','v237'),'iyi','V2.37: Sorun giderme ekranında, açıkken canlı yenilenir.'),
 ('Grafik ve performans','Yükleme ekranı','Dönen 3B ay yıldız, uçak biçimli ilerleme çubuğu, ipucu kartları, oyun dilinde aşama adları, hafif yükleme sesi.','Açılışta','—','V2.20',T('boot','v238'),'iyi','V2.38: ipucu kartları, oyun dilinde aşama adları, ilk dokunuştan sonra hafif ses, menü 1,3 sn daha erken açılıyor.','iyileştirilmeli','KARAR (29 Ekim): dördü de yapılacak: ipucu kartları, oyun dilinde aşama adları, ikinci açılışın hızlanması, hafif yükleme sesi (V2.38).'),
 # ---- Hesap
 ('Hesap ve kayıt','Kendi adresi','Oyun V2.55\'ten beri kendi adresinde (ayyildiz-kizilelma-game.github.io); tarayıcı kaydı aynı GitHub hesabındaki başka uygulamalarla ortak değil, biri temizlenince öteki silinmiyor. Eski adres yeni adrese yönlendiriyor ve cihazdaki kaydı da taşıyor.','Eski adres → yeni adres','—','V2.55',T('v255'),'iyi','Taşınan kayıt yalnız yeni adreste kayıt yokken alınır; modeller ve hesaplar buluttan gelir.'),
 ('Hesap ve kayıt','Model bulut yedeği','Model Kütüphanesi\'nde içe aktarılan modeller giriş yapan oyuncu için buluta da yedeklenir; tarayıcı verisi silinse ya da başka cihazdan girilse bile girişten sonra kendiliğinden geri gelir. Yalnız cihazda olan modeller ilk girişte buluta çıkar.','Model Kütüphanesi · giriş','—','V2.53',T('v253'),'iyi','Sunucuda kurulu (21 Kasım); model başına en çok 45 MB. Sunucunun uyumaması için GitHub\'da üç günde bir çalışan iş var.'),
 ('Hesap ve kayıt','Hesabımı sil','Giriş yapmış oyuncu hesabını (giriş bilgisi dahil), profilini, bulut kaydını ve buluttaki modellerini oyunun içinden kalıcı olarak siler (iki kez basılır; V2.57\'de tam silme). Google Play şartı; web sayfası: gizlilik → Hesap silme.','Profil → Hesap','—','V2.52',T('v252'),'iyi','Sunucuda kurulu ve denendi (21 Kasım). Supabase projesi yalnız oyuna ait.'),
 ('Hesap ve kayıt','Google Play paketi','Android uygulaması (V2.62\'den beri Capacitor; oyun dosyaları APK\'nın içinde) her sürümde GitHub Actions\'ta imzalı .apk ve .aab olarak üretilir, emülatörde denenir ve indirme sayfasına konur. Geri tuşu menüleri kapatır; Google ile giriş tarayıcı sekmesinde açılıp oyuna döner. Mağaza metinleri ve yükleme rehberi docs/PLAY-STORE.md\'de.','GitHub → Actions → Android uygulaması','—','V2.52',T('setup','v262'),'iyileştirilmeli','Kalan: Play Console hesabı ve kapalı test (12 kişi, 14 gün). Google ile girişin gerçek telefonda denenmesi.'),
 ('Hesap ve kayıt','Hızlı güncelleme','Android uygulaması açılışta yeni sürüm olup olmadığına bakar; varsa "Yeni sürüm" kartı çıkar, Şimdi güncelle ile oyun dosyaları (~1,5 MB) indirilir ve uygulama birkaç saniyede yeni sürümle açılır. APK indirmek gerekmez. Yeni sürüm açılamazsa eski sürüme kendiliğinden döner; yeni sürümler telefonlara yalnız emülatör denemesi geçerse sunulur.','Uygulama açılışı','—','V2.63',T('v263'),'iyi','Emülatörde baştan sona denendi (indirme, yeniden açılma, yeni sürümde kalma).'),
 ('Hesap ve kayıt','Reklamlar','Yalnız Android uygulamasında, Google AdMob: isteğe bağlı ödüllü reklamla görev ödülünü (TP) ikiye katlama ve bir kaplama paketini 24 saat deneme; bitmiş görevden çıkarken en çok 5 dakikada bir geçiş reklamı (ilk oturumda hiç). Günlük ödülü 2 katına çıkarma ve Harekât\'ta başarısız bölümde kaldığın yerden devam (V2.69). Afiş yok. İlk açılışta kişiselleştirilmiş/kişiselleştirilmemiş seçimi, gereken ülkelerde Google izin formu. Reklamsız ürünü olan reklam görmez, ödülleri reklamsız alır.','Görev sonu · Mağaza · Mağaza → Reklam tercihleri','—','V2.62',T('v262'),'iyileştirilmeli','Şimdilik Google deneme reklamları (gelir yok). Gerçek reklam için AdMob hesabı ve kimlikleri gerekiyor.'),
 ('Hesap ve kayıt','Mağaza','Ana menüde Mağaza: Reklamsız, üç kaplama paketi (Kış Harekâtı, Mavi Vatan, Tarihî; her biri 3 kaplama) ve Destekçi paketi. Sahip olunan ürünler hesaba bağlı (bulut tablosu entitlements, cihazda önbellek). Hangarda paket kaplamaları 🛒 ile görünür, seçince mağaza açılır. Para güç satın almaz.','Ana menü → Mağaza · Hangar → Boya','—','V2.61',T('v261'),'iyileştirilmeli','Gerçek ödeme yok: satın alma V2.74 (Google Play) ile gelecek. Yönetici kendine deneme için ürün tanımlayabilir.'),
 ('Hesap ve kayıt','Hesap ve profil','Misafir ya da bulut hesabı, oyuncu kartı, birden çok profil, bulut eşitleme.','Ana menü → sağ üstteki profil','—','V1.66',T('account','pcard'),'iyi',''),
 ('Hesap ve kayıt','Kayıt ve yedek','Bütün ilerleme tek kayıtta, her oturum yedekleniyor; grafik ayarları cihaza özel.','Kendiliğinden','—','V2.26',T('depo'),'iyi',''),
 ('Hesap ve kayıt','Uygulama olarak yükleme','Ana ekrana ekleme, kısayollar, Android (Play Store) hazırlığı.','Ana menü → Uygulamayı yükle','—','V2.01',T('install'),'iyi','Tarayıcıdan ana ekrana eklenebilir; ayrıca Android uygulaması (APK) kalıcı anahtarla imzalı, tam ekran açılıyor (V2.59, Releases → Android uygulaması).'),
 ('Hesap ve kayıt','Duyurular ve sürüm notları','Yönetici duyuruları, güncellemeden sonra yenilikler şeridi, Yenilikler ekranı.','Ana menü → Yenilikler','—','V1.66',T('notes'),'iyi',''),
 # ---- Yönetici
 ('Yönetici araçları','Yönetim paneli','Duyuru yayını, görev yayını, kütüphanelere giriş (yalnız yönetici).','Ana menü → kalkan düğmesi','—','V1.68',T('account'),'iyi',''),
 ('Yönetici araçları','Model kütüphanesi','Bütün modelleri 3B inceleme, test, boya, kendi modelini yükleme (.glb .gltf .fbx .obj .stl .dae), ölçü denetimi.','Yönetim paneli → Kütüphaneler','—','V1.37',T('library','modelreg'),'iyi',''),
 ('Yönetici araçları','Ses kütüphanesi','Her sesi dinleme, kendi ses dosyasıyla değiştirme, kanal karışımı.','Yönetim paneli → Kütüphaneler','—','V1.60',T('sound'),'iyi',''),
 ('Yönetici araçları','Sistem envanteri','Gerçek Türk sistemlerinin verileri (Defence Turk kaynaklı, atıflı).','Hangar → Gerçek veriler','—','V1.86',T('envanter'),'iyi',''),
 # ---- Modeller
 ('Modeller','Uçak, helikopter, araç ve gemi modelleri','Kodla üretilmiş stilize modeller; parça birleştirme ile az çizim.','Her yerde','—','V1.37',T('modelreg','bake'),'iyileştirilmeli','Gerçeğe benzerlik zayıf; ANKA-3 +%37, Kızılelma +%18, Hürjet +%17 ölçü sapması. KARAR: model serisi V2.41\'den itibaren, her model onaya sunulur.'),
]
KEYS = ['kat','ad','ne','nereden','tus','surum','testler','durum','not']
items = [dict(zip(KEYS, f)) for f in F]
have = set(re.sub(r'\.test\.js$','',x) for x in os.listdir(os.path.join(ROOT,'tests')) if x.endswith('.test.js'))
for it in items:
    it['testler'] = [t for t in it['testler'] if t in have]
DUR = {'iyi':'✅ iyi','iyileştirilmeli':'🔧 iyileştirilmeli','birleştirilmeli':'🔀 birleştirilmeli','kaldırılmalı':'🗑 kaldırılmalı','denenmeli':'🧪 denenmeli'}
cats = []
for it in items:
    if it['kat'] not in cats: cats.append(it['kat'])
# ---- docs/OZELLIKLER.md
L = ['# Özellik envanteri', '', 'Üretildi: `python3 tools/ozellikler.py` (kaynak: aynı dosyadaki liste). Oyundaki **Rehber** ekranı da bu listeden üretilir.', '',
     '**Durum:** ✅ iyi · 🔧 iyileştirilmeli · 🔀 birleştirilmeli · 🗑 kaldırılmalı · 🧪 denenmeli (gerçek cihazda doğrulanmalı)', '']
cnt = {}
for it in items: cnt[it['durum']] = cnt.get(it['durum'],0)+1
L.append('**Özet:** %d özellik · ' % len(items) + ' · '.join('%s %d' % (DUR[k], v) for k, v in cnt.items()) + ' · testi olmayan: %d' % sum(1 for i in items if not i['testler']))
L += ['', '## Karar listesi', '', 'Aşağıdakiler senin kararını bekliyor. "iyi" durumundaki özellikler olduğu gibi kalır.', '']
n = 0
for it in items:
    if it['durum'] != 'iyi':
        n += 1; L.append('%d. **%s** (%s) — %s' % (n, it['ad'], DUR[it['durum']], it['not']))
for c in cats:
    L += ['', '## ' + c, '', '| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |', '|---|---|---|---|---|---|---|']
    for it in items:
        if it['kat'] != c: continue
        L.append('| **%s** | %s | %s | %s | %s | %s | %s |' % (it['ad'], it['ne'], it['nereden'], it['tus'], it['surum'], ', '.join(it['testler']) or '—', DUR[it['durum']]))
open(os.path.join(ROOT,'docs','OZELLIKLER.md'),'w').write('\n'.join(L)+'\n')
# ---- in-game data
pub = [{k: it[k] for k in ('kat','ad','ne','nereden','tus','surum')} for it in items if it['kat'] != 'Yönetici araçları']
open(os.path.join(ROOT,'src','js','veri','rehber-veri.js'),'w').write('/* Generated by tools/ozellikler.py — do not edit by hand. The in-game guide (ekran/rehber.js). */\nconst REHBER='+json.dumps(pub, ensure_ascii=False, separators=(',',':'))+';\n')
print('özellik:', len(items), cnt)
# ---- docs/OYUNCU-REHBERI.md (V2.40): the player's guide, same list as the in-game Rehber plus first steps and controls
G = ['# Oyuncu rehberi — Ay Yıldız: Hedef Kızıl Elma', '', 'Bu rehber `python3 tools/ozellikler.py` ile oyundaki **Rehber** ekranıyla aynı listeden üretilir. Bütün tuşlar Ayarlar → Kontroller\'de değiştirilebilir.', '',
 '## İlk adımlar', '',
 '1. **Hemen uçmak için:** Hızlı Oyun → Hemen Başla. En son kullandığın araçla tek tıkla oyuna girersin.',
 '2. **Savaşmak için:** Hızlı Oyun → Hızlı Savaş. Botlara karşı dört mod var: İt Dalaşı, Serbest Çatışma, Yer Taarruzu, Hava Hedefleri. Havada başlarsın.',
 '3. **İlerlemek için:** Kariyer. Önce Eğitim\'deki dersleri al; dersler sertifika ve madalya verir. Sonra rütbene göre açılan görevlere geç.',
 '4. **Gezmek için:** Hızlı Oyun → Üssü Gez. Yürü, araçlara ve helikopterlere bin. G ile araç çağırabilirsin.',
 '5. **Arkadaşlarla oynamak için:** Çok Oyunculu → Oda kur. Çıkan kodu arkadaşına gönder.',
 '6. **Oyun yavaşsa:** Ayarlar → Grafik → Sorun giderme → Performans testi.', '',
 '## Kontroller (klavye)', '',
 '| Araç | Temel tuşlar |', '|---|---|',
 '| **Uçak** | W/S burun · A/D yatış · Q/E dümen · R/F gaz · Shift art yakıcı · B fren · G iniş takımı · Space top · X seçili silah · N sıradaki silah · K kilit · Tab hedef değiştir · Z flare · T otomatik taksi · L piste geç · J (iki kez) fırlatma koltuğu |',
 '| **Helikopter** | W/S/A/D cyclic · R/F yüksel/alçal · Q/E pedal · Space top · X silah · Tab silah değiştir · B kanca / asker · J askı yardımı · G ya da Enter in |',
 '| **Kara aracı** | W gaz · S fren/geri · A/D direksiyon · Space el freni · Shift turbo · X ateş · C kamera · T araç değiştir · E/F/Enter in |',
 '| **Deniz aracı** | W/S hız · A/D dümen · Space top · X silah · C kamera · E/F/Enter in |',
 '| **Yaya** | W/S/A/D yürü · Shift koş · Space zıpla · E/F/Enter araca bin · G araç çağır |',
 '| **Her yerde** | Esc/P duraklat · M harita · C kamera · V kamerayı sıfırla · H fotoğraf · U ses · O telsiz · ` gece görüş/termal · F2 görev günlüğü · F3 tekrar · F4 işaret · F6 duman · F7 füzeden kaçış · F8 kanat adamı · I bas-konuş · / sohbet |', '',
 '**Dokunmatik:**',
 '- Sol tarafa dokunduğun yerde çubuk açılır.',
 '- Sağda gaz (en üstte art yakıcı), ATEŞ, FLARE, TEKER (iniş takımı) ve dümen düğmeleri var.',
 '- Silah değiştirmek için alttaki silah kutularına dokun.',
 '- Düzen Ayarlar → Kontroller → Dokunmatik → Düzeni düzenle\'den değiştirilir.', '']
for c in cats:
    if c == 'Yönetici araçları': continue
    G += ['## ' + c, '']
    for it in items:
        if it['kat'] != c: continue
        G.append('- **%s:** %s *Nereden:* %s.%s' % (it['ad'], it['ne'], it['nereden'], ('' if it['tus'] in ('—', '') else ' *Tuş:* ' + it['tus'] + '.')))
    G.append('')
open(os.path.join(ROOT,'docs','OYUNCU-REHBERI.md'),'w').write('\n'.join(G)+'\n')
