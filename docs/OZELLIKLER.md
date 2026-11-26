# Özellik envanteri

Üretildi: `python3 tools/ozellikler.py` (kaynak: aynı dosyadaki liste). Oyundaki **Rehber** ekranı da bu listeden üretilir.

**Durum:** ✅ iyi · 🔧 iyileştirilmeli · 🔀 birleştirilmeli · 🗑 kaldırılmalı · 🧪 denenmeli (gerçek cihazda doğrulanmalı)

**Özet:** 80 özellik · ✅ iyi 71 · 🔧 iyileştirilmeli 5 · 🧪 denenmeli 4 · testi olmayan: 0

## Karar listesi

Aşağıdakiler senin kararını bekliyor. "iyi" durumundaki özellikler olduğu gibi kalır.

1. **İHA görünümleri** (🔧 iyileştirilmeli) — Kamera açıları V2.77, gidilebilir yer istasyonu ve yeni EO/IR kamera V2.78 ile gelecek.
2. **Filo** (🧪 denenmeli) — Birden çok gerçek hesapla denenmeli (başvuru, onay, devir).
3. **Çevrimiçi oda** (🧪 denenmeli) — 29 Ekim denemesi: aynı bilgisayarda iki ayrı oyun sayfası (telefon boyutu) oda kurdu, katıldı, maç başladı, konumlar eşleşti (fark < 5 m), yazılı sohbet iki yönde çalıştı, hata yok. Bağlantı katmanı burada taklit edildi (PeerJS sunucusuna bu ortamdan erişilemiyor); internet üzerinden iki gerçek cihaz hâlâ denenmeli.
4. **Karma çok oyunculu ve üs ele geçirme** (🧪 denenmeli) — Oda ve sohbet katmanı 29 Ekim'de iki sayfayla doğrulandı; karma mod ve üs ele geçirme iki gerçek cihazla denenmeli.
5. **Sesli ve yazılı sohbet** (🧪 denenmeli) — Yazılı sohbet 29 Ekim'de doğrulandı. Sesli sohbet mikrofon ve gerçek bağlantı istiyor; yalnız iki gerçek cihazla denenebilir.
6. **Google Play paketi** (🔧 iyileştirilmeli) — Kalan: Play Console hesabı ve kapalı test (12 kişi, 14 gün). Google ile girişin gerçek telefonda denenmesi.
7. **Reklamlar** (🔧 iyileştirilmeli) — Şimdilik Google deneme reklamları (gelir yok). Gerçek reklam için AdMob hesabı ve kimlikleri gerekiyor.
8. **Mağaza** (🔧 iyileştirilmeli) — Gerçek ödeme yok: satın alma V2.80 (Google Play) ile gelecek. Yönetici kendine deneme için ürün tanımlayabilir.
9. **Uçak, helikopter, araç ve gemi modelleri** (🔧 iyileştirilmeli) — Gerçeğe benzerlik zayıf; ANKA-3 +%37, Kızılelma +%18, Hürjet +%17 ölçü sapması. KARAR: model serisi V2.41'den itibaren, her model onaya sunulur.

## Uçuş

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Uçak seçimi ve hangar** | On Türk uçağı ve İHA arasından seçim; hangarda 3B inceleme, boya, performans çubukları ve karşılaştırma. | Hızlı Oyun → Serbest Uçuş / Sürüş · Kariyer → Hangar | — | V1.24 | picker, menu3 | ✅ iyi |
| **Uçuş modeli** | Gaz, art yakıcı, fren, iniş takımı; uçağa göre gerçek hız, tırmanma ve servis tavanı. | Her uçuşta | W/S/A/D · Q/E · R/F · Shift · B · G | V1.02 | features, realperf | ✅ iyi |
| **Taksi ve kalkış** | Hangardan piste taksi, otomatik taksi ve taksiyi atlama; kule izni. | Başlangıç yeri: Hangardan | T otomatik taksi · L taksiyi atla | V1.00 | taxi, hangar_taxi, airport | ✅ iyi |
| **Gerçekçi uçuş modeli** | Ayarlar → Uçuş → Uçuş modeli: Gerçekçi seçilince uçağın gerçek bir hız vektörü olur: hücum açısına bağlı taşıma ve stol (15°), sürükleme ve sert dönüşte enerji kaybı, tam yerçekimi, gerçek G sınırları (savaş uçağı 9, Hürjet 8, Hürkuş 7, İHA'lar 3–4,5). Kumanda G ister; KAAN, Kızılelma, Hürjet ve İHA'larda hücum açısı sınırlayıcı var, Hürkuş stola girebilir. İnsanlı uçaklarda 6,5 G üstünde görüş kararır (G-LOC). Göstergede α, G ve STALL uyarısı. | Ayarlar → Uçuş → Uçuş modeli | — | V2.72 | v272 | ✅ iyi |
| **İniş yardımı** | Piste yaklaşırken süzülüş ve merkez hattı göstergesi, istenirse otomatik iniş. | Ayarlar → Uçuş → Uçuş yardımı | — | V1.96 | assist | ✅ iyi |
| **Uçuş konforu** | Otomatik denge, türbülans ayarı, kare süresi yumuşatma. | Ayarlar → Uçuş | — | V1.84 | comfort | ✅ iyi |
| **3B kokpit** | Her uçak ve helikopterin üç kokpit düzeni var (V2.75), uçuşta 🛩 düğmesiyle ya da Ayarlar → Uçuş → Kokpit düzeni ile seçilir ve uçak başına hatırlanır. KAAN: A geniş ekran + HUD, B kask ekranı (HUD yok, ön panel), C gece kokpiti (amber ekranlar, kırmızı kabin ışığı). Hürjet: A geniş ekran, B üç ekran + ön panel, C arka koltuk (önde öğrencinin kaskı, HUD tekrar ekranı, eğitmen sayfası). Hürkuş: A askerî (HUD + üç ekran), B eğitim (yedek göstergeler), C sade (tek büyük ekran, büyük düğmeler). T129: A pilot (arka koltuk, önde nişancı), B nişancı (ön koltuk, canlı yakınlaştırılmış nişan kamerası), C gece görüş gözlüğü. T625: A iki geniş ekran + dokunmatik konsol, B dört ekran, C kapı topçusu (açık kapıdan dışarı bakış). Ekranlar düğmeli çerçeve içinde ve canlı; kafa hareketi. V2.76'dan beri kokpit kapalı bir gövde: taban, yan duvarlar, kanopi kenarları, panelin altı tabana kadar dolu, koltuk, pilotun bacakları ve elleri; helikopterlerde ayak altında küçük pencereler. | Uçuşta kamera değiştir · helikopterde kamera · 🛩 düğmesi | C | V1.89 | cockpit, v274, v275, v276 | ✅ iyi |
| **İHA görünümleri** | İHA'da kokpit kamerası yerine iki görünüm (Ayarlar → Uçuş → İHA görünümü ya da uçuşta 📺 düğmesi): Sensör (burun EO/IR kamerası) ve Yer kontrol istasyonu (operatör konsolu: bağlantı, telemetri, taktik harita, faydalı yük, masa). VR görünümü V2.75'te kaldırıldı. | İHA ile uçarken kamera (C) → 📺 | C | V2.74 | v274, v275 | 🔧 iyileştirilmeli |
| **Kamera açıları** | Tek kamera düğmesiyle (C, 📷 ya da ekrandaki 🎥 çipi) aracın bütün görünümleri sırayla gelir; çipe uzun basınca liste açılır. Uçaklarda kokpit, takip, burun, kuyruk, gövde altı ve sinematik (yandan geçiş); İHA'larda sensör / yer istasyonu, takip, burun (FPV), kuyruk, gövde altı EO/IR (yakınlaştırılmış, artı işaretli, lazer mesafeli), kanat altı (mühimmat) ve üstten taktik görünüm; helikopterlerde kokpit, takip, burun altı, kuyruk, gövde altı (kanca) ve sinematik. Kameralar modelin gerçek yüzeyine oturur; sürükleyerek her görünümde etrafa bakılır. | Uçuşta ve helikopterde | C kamera | V2.77 | v277 | ✅ iyi |
| **Tıklanabilir kokpit** | KAAN, Hürjet ve Hürkuş kokpitinde iki yan panel: iniş takımı kolu (yeşil lambalar), MASTER ARM (SAFE iken top, füze ve bomba ateşlenmez; her uçuşta yeniden ARM), fırlatma kolu (iki kez çek), flare (sayısıyla), silah seçimi (seçili silah ve sayısı), gece görüş / termal. Taktik harita ekranına dokununca ölçek 6 · 12 · 24 km. Farede üzerine gelince adı ve tuşu görünür. | Uçuşta kokpit kamerası (C) → panellere tıkla / dokun | C kamera | V2.73 | v273 | ✅ iyi |
| **Akrobasi** | Akrobasi dumanı, figür tanıyıcı ve akrobasi gösterisi görevi. | Görevler · uçuşta duman | F6 duman | V2.07 | acro | ✅ iyi |
| **Hasar, yakıt ve fırlatma koltuğu** | Parça hasarı, yakıt tüketimi, ikmal-onarım, fırlatma koltuğu. | Her uçuşta | J (iki kez) fırlatma | V1.73 | damage, service | ✅ iyi |
| **Bakım hangarı** | Yerde bakım hangarına girince silah yükleme ve onarım. | Üste bakım hangarı | — | V1.00 | service | ✅ iyi |
| **İHA uçuş bilgisayarı** | İHA'larda irtifa ve rota tutan uçuş bilgisayarı. | İHA ile uçarken | — | V1.96 | uav, assist | ✅ iyi |

## Silah ve savaş

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Silahlar ve yük ekranı** | Top, 2 bomba ve 3 füze tipi; uçağa göre yük, hazır yük grupları. | Hangar → Yük · Bakım hangarı | Space top · X silah · N sıradaki · 1–5 | V1.02 | setup, features, v230 | ✅ iyi |
| **Gerçek Türk mühimmatı** | Model serisinden geçen uçaklar gerçek mühimmat taşır: KAAN'da GÖKDOĞAN, BOZDOĞAN, SOM-J (iç silah yuvasında, kapaklar atışta açılır), HGK-82 ve NEB-84 (kanat altında). TB2 (V2.42) ve TB3'te (V2.43) MAM-L, MAM-C ve MAM-T. Akıncı'da TEBER-82, NEB-84, L-UMTAS, GÖKDOĞAN ve SOM-A (V2.44). Kızılelma'da iç silah yuvasıyla BOZDOĞAN, GÖKDOĞAN, SOM-J; kanat altında TEBER-82 ve NEB-84 (V2.45). ANKA-3'te iç yuvada TEBER-82 ve SOM-J, dış kanatta MAM-L (V2.46; model V2.50'de oyuncunun fotoğraflarıyla yenilendi). Aksungur'da TEBER-82, MAM-C ve MAM-T (V2.47). Hürjet'te TEBER-82, HGK-82, BOZDOĞAN ve GÖKDOĞAN; Hürkuş'ta MAM-L, MAM-C ve LUMTAS (V2.48). Veriler Defence Turk Sistem Envanteri'nden. | Hangar → Yük · Model Kütüphanesi → Mühimmat | X silah · 1–5 silah seç | V2.41 | v241, v242, v243, v244, v245, v246, v247, v248, v250, setup | ✅ iyi |
| **Hedef kilidi** | Füzeler için hedef kilidi, kilit uyarısı açılıp kapatılabilir. | Uçuşta | K kilit · Tab hedef değiştir | V1.02 | features | ✅ iyi |
| **Düşman uçakları ve kanat adamı** | Kırmızı Kuvvet savaş uçakları, yapay zekâ kanat adamı (Kılıç 2) ve ona emir verme. | Görev ekranı → düşman / kanat adamı | F8 kanat adamı emirleri | V1.10 | ai, wing, enemy | ✅ iyi |
| **Hava savunma ve füzeden kaçış** | SAM bataryaları, füze uyarısı, gerçekçi füze modeli, flare ve kaçış yardımı. | Görev ekranı → SAM | Z flare · F7 kaçış | V1.51 | evade, enemy | ✅ iyi |
| **Gece görüş ve termal kamera** | NVG ve FLIR görünümleri. | Uçuşta | ` (Backquote) | V1.74 | weather | ✅ iyi |

## Modeller

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Ayrıntılı helikopter, kara aracı ve gemi modelleri** | T129 ATAK (CİRİT ve L-UMTAS ile), T625 GÖKBEY, Altay, T-155 Fırtına, Pars III 8×8, Kirpi, Korkut, Hisar-A, Ada sınıfı korvet, İstif fırkateyni, TCG Anadolu ve Tuzla sınıfı hücumbot yenilendi (V2.49): eğik zırh plakaları, yol tekerlekleri ve palet bantları, nişangâhlar, uzaktan kumandalı silah istasyonları, gemilerde küpeşte, 76 mm top, can salları. Kütüphanede eski modelle karşılaştırılabilir. | Model Kütüphanesi · Kara üssü · Deniz üssü | — | V2.49 | v249 | ✅ iyi |
| **Uçak, helikopter, araç ve gemi modelleri** | Kodla üretilmiş stilize modeller; parça birleştirme ile az çizim. | Her yerde | — | V1.37 | modelreg, bake | 🔧 iyileştirilmeli |

## Kara ve deniz araçları

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Yürüyüş** | Birinci şahıs yürüme, koşma, zıplama, araçlara ve uçaklara binme. | Hızlı Oyun → Üssü Gez | WASD · Shift · Space · E bin | V1.34 | walk, indoor | ✅ iyi |
| **Kara araçları** | Arabalar, tanklar, zırhlılar, itfaiye, uçak çekici; her birinin kendi sürüşü, turbo, park etmiş araçlara binme. | Yürürken araca bin · Araç çağır | W/S/A/D · Shift turbo · T araç değiştir | V1.54 | vehicles, land, collide | ✅ iyi |
| **Deniz araçları** | Hücumbot, korvet, TCG Anadolu; makine telgrafı, dümen, gemi topları, helikopter güvertesi, kıyıya yanaşma. | Marina ve deniz üssü · Araç çağır | W/S hız · A/D dümen · Space top | V1.70 | boats, naval, groundsea | ✅ iyi |
| **Araç çağırma** | Kara, hava ve deniz aracını bulunduğun yere teslim ettirme (lojistik telsizi). | Yürürken | G araç çağır | V1.71 | call | ✅ iyi |
| **Helikopterler** | T129 ATAK ve T625 Gökbey: askı yükü, asker taşıma, kapı silahı, askı yardımı. | Hangar · üslerdeki helikopterler | R/F kolektif · B kanca · J askı yardımı | V1.55 | heli, heliops | ✅ iyi |

## Dünya

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Ada ve üsler** | 30 km'lik ada: hava üssü, deniz üssü, kara üssü, İHA adası, marina, köyler, Hilalkent ve Anadolukent, Kızıl Bölge, simge yapılar. | Harita | M harita | V1.31 | airport, naval, land, uav, marina, town, rural, south, military, landmarks | ✅ iyi |
| **Canlı dünya** | Trafik, yayalar, yer personeli, hava trafiği, martılar, ortam sesleri. | Her yerde | — | V1.42 | airlife, town | ✅ iyi |
| **Gün saati ve hava durumu** | Gün/gece, sabah sisi, yağmur, kar, fırtına, rüzgâr ve türbülans. | Ayarlar → Dünya · görev ekranı | — | V1.46 | daynight, weather | ✅ iyi |
| **Harita ve ışınlanma** | Tam ekran harita, köşe haritası, yerler listesine ışınlanma, haritaya işaret ve işaret çarkı. | Uçuşta ve yürürken | M harita · F4 işaret | V1.53 | map, comms | ✅ iyi |

## Görevler ve modlar

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Gece Görev Paketi** | Beş gece görevi (keşif, İHA avı, gece taarruzu, deniz devriyesi, refakat); gece görüş görev başında açılır, termal görüşe geçilebilir. İlk görev ücretsiz, diğerleri mağazadaki Gece Görev Paketi ile açılır. İlk tamamlamada TP bonusu, beşinde Gece Kartalı madalyası. Gece ve gece görüş yalnız bu görevler için, sonra oyuncunun ayarı geri gelir. | Kariyer → Gece Görev Paketi · Hızlı Oyun → Gece Görev Paketi | ` gece görüş / termal | V2.71 | v271 | ✅ iyi |
| **Hızlı Oyun** | Kariyerden bağımsız: hemen başla, serbest uçuş/sürüş, hızlı görev, üssü gez. Her şey açık, puan kazandırmaz. | Ana menü → Hızlı Oyun | — | V1.82 | menu2, menu3, v229 | ✅ iyi |
| **Hızlı Savaş** | Botlara karşı havada başlayan dört mod: İt Dalaşı, Serbest Çatışma, Yer Taarruzu, Hava Hedefleri. | Ana menü → Hızlı Oyun → Hızlı Savaş | — | V2.29 | v229 | ✅ iyi |
| **Görev panosu** | Bütün görevler tek ekranda: uçak, helikopter, kara, deniz, yarış; brifing, hedef takibi, görev günlüğü, görev sonu raporu. | Kariyer → Görevler · Hızlı Oyun → Hızlı Görev | F2 görev günlüğü | V1.76 | board, misui | ✅ iyi |
| **Dinamik görevler** | Her seferinde farklı, çok aşamalı görevler ve görev ortası olaylar; günlük ve haftalık görevler. | Görev panosu | — | V1.77 | dynamic, progress | ✅ iyi |
| **Harekât: Kızıl Elma** | Sekiz bölümlük hikâyeli harekât; bölümler sırayla açılır, final madalya verir. | Kariyer → Harekât | — | V1.98 | campaign | ✅ iyi |
| **Yarışlar** | Kapılı yarışlar, süre, hayalet ve sıralama tablosu. | Görev panosu → Yarışlar | — | V1.80 | races | ✅ iyi |
| **Görev editörü** | Kendi görevini kur: aşamalar, tetikleyiciler, dene, kaydet ve paylaş. | Görevler → ＋ Görev editörü | — | V1.81 | editor, v237 | ✅ iyi |
| **Kara ve deniz görevleri** | Tank, araç ve gemi ile görevler. | Görev panosu | — | V1.99 | groundsea | ✅ iyi |

## Kariyer ve ilerleme

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Rütbe ve tecrübe puanı** | Er'den Orgeneral'e rütbeler, terfi töreni; rütbeyle açılan uçaklar, araçlar, görevler ve boyalar. | Ana menü → Kariyer | — | V1.67 | career, progress | ✅ iyi |
| **Uçuş okulu** | Adım adım dersler: kalkış, iniş, rüzgârlı iniş, helikopter, askı yükü, silah, gemiye iniş. | Kariyer → Eğitim | — | V1.78 | school | ✅ iyi |
| **Sezonlar ve Harekât Kartı** | Sezonlar millî günlerde başlar (18 Mart, 19 Mayıs, 30 Ağustos, 29 Ekim; ilk sezon 18 Mart 2027, o güne kadar Hazırlık Dönemi). Kariyerde kazanılan her TP sezon puanı da sayılır (millî günde 2 kat); haftalık 3 sezon görevi. Ücretsiz yolda TP, sezon amblemi ve kaplaması; Harekât Kartı yolunda yalnız sezon kaplamaları ve amblemler. Alınmamış ödüller sezon bitince verilir. | Kariyer → Harekât Kartı | — | V2.69 | v269 | ✅ iyi |
| **Günlük ödül** | Her gün ilk girişte günlük ödül: 7 gün üst üste 50 → 150 TP, bir gün kaçarsa baştan. İstenirse ödüllü reklamla 2 kat (Reklamsız ürününde reklamsız). | Ana menü (günde bir kez) | — | V2.69 | v269 | ✅ iyi |
| **Filo** | Oyuncuların kurduğu en çok 30 pilotluk gruplar: Teğmen rütbesinden filo kur (ad, etiket, arma, açıklama) ya da açık filoya katıl, kapalıya başvur. Komutan, yardımcı ve pilot rolleri; duyuru, başvuru onayı, pilot çıkarma, komutanlık devri. Filoda kazanılan TP filonun haftalık toplamına yazılır; 10/25/50 bin TP hedefine ulaşan filonun katkı verenleri 50/100/200 TP alır. Filo etiketi sıralamada görünür, Sıralama'da Filolar sekmesi. | Kariyer → Filo | — | V2.70 | v270 | 🧪 denenmeli |
| **Sıralama ve birlik yarışı** | Bulut sıralaması: bu haftanın ve tüm zamanların en çok TP kazanan pilotları, her yarışın en iyi süreleri. Birlik yarışı: haftanın TP'si birliklere (Hilal Kanatlar, Mavi Kanatlar, Bozkurtlar) toplanır; kazanan birlikte o hafta TP kazanan herkes 150 TP alır. Hafta Pazartesi 00:00'da (Türkiye saati) başlar. Misafir okuyabilir, giriş yapan listeye girer. | Kariyer → Sıralama | — | V2.68 | v268 | ✅ iyi |
| **Ehliyet ve sertifikalar** | İHA pilotu, pilot, tank sürücüsü, araç sürücüsü, kaptan belgeleri ve sınavları; belgesiz kullanım engeli. | Kariyer → Ehliyet ve Sertifikalar | — | V1.92 | licenses | ✅ iyi |
| **Başarımlar, madalyalar, istatistikler** | Başarımlar, madalyalar, uçuş istatistikleri, rekorlar. | Kariyer · üstteki kupa düğmesi | — | V1.79 | progress | ✅ iyi |

## Çok oyunculu

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Çevrimiçi oda** | Sunucusuz P2P oda (en çok 4 kişi): işbirliği, takım savaşı, herkes herkese; boş yerleri botlar doldurur. | Ana menü → Çok Oyunculu | — | V1.24 | net, net_ffa | 🧪 denenmeli |
| **Karma çok oyunculu ve üs ele geçirme** | Uçak, araç ve gemiler aynı maçta; üs ele geçirme modu; kule görevlisi rolü. | Çok Oyunculu → mod | — | V1.83 | net_mix | 🧪 denenmeli |
| **Sesli ve yazılı sohbet** | Bas-konuş sesli sohbet, yazılı sohbet, oyuncu çıkarma. | Çok oyunculu maçta | I bas-konuş · / sohbet | V1.62 | net, comms | 🧪 denenmeli |

## Ses ve telsiz

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Müzik** | Oyunun kendi bestesi: menü, sakin uçuş, çatışma, zafer, yenilgi; ara ara çalar. | Ayarlar → Ses → Müzik / Müzik sıklığı | U sesi kapat | V1.61 | sound, v228 | ✅ iyi |
| **Telsiz** | Kule, AWACS (Kartal Gözü), kanat adamı ve eğitmen konuşmaları; hazır mesaj menüsü, altyazı. | Uçuşta | O telsiz menüsü | V1.62 | radio | ✅ iyi |

## Kontroller

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Dokunmatik kontroller** | Serbest çubuk, gaz, ATEŞ, FLARE, TEKER, dümen; düzen düzenleyici ve hazır düzenler (Klasik, Sol el, Eğerek uç). | Telefonda kendiliğinden · Ayarlar → Kontroller → Dokunmatik | — | V1.52 | phone, touch2, controls | ✅ iyi |
| **Oyun kolu ve klavye** | Tam oyun kolu desteği, tuş atama, kontrol şemaları; kısayol çakışma denetimi. | Ayarlar → Kontroller | — | V1.52 | controls, input | ✅ iyi |
| **Titreşim ve eğerek uçuş** | Telefon titreşimi ve telefonu eğerek yönlendirme. | Ayarlar → Kontroller | — | V1.90 | phone | ✅ iyi |

## Fotoğraf ve tekrar

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Tekrar izleme** | Son uçuşu kameralar ve zaman çubuğuyla yeniden izleme. | Uçuşta | F3 | V1.87 | replay | ✅ iyi |
| **Fotoğraf modu** | Arayüzsüz serbest kamera ile fotoğraf. | Uçuşta | H | V1.87 | replay | ✅ iyi |

## Grafik ve performans

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Hızlı ikinci açılış** | Oyun kodu ayrı bir dosyada (oyun.js): tarayıcı ve çevrimdışı önbellek derlenmiş kodu saklar, ikinci açılış daha hızlı. Her sürüm yeni adla yüklenir, eski kod kalmaz. Her şeyin tek dosyada olduğu tek-dosya.html indirme ve paylaşma için duruyor. | Kendiliğinden | — | V2.51 | boot | ✅ iyi |
| **Grafik ayarları** | Otomatik / hazır ayarlar, ayrıntılı ayarlar, maliyet etiketleri, canlı fark, arama, varsayılana dön. | Ayarlar → Grafik | — | V1.57 | gfx2, settings2, quality, settings | ✅ iyi |
| **Akıllı performans** | Otomatik çözünürlük, kalite basamakları, eşit aralıklı 30 FPS, ısınmaya karşı sabit kalite. | Ayarlar → Grafik → Otomatik | — | V1.94 | perf, perf2, quality | ✅ iyi |
| **Performans testi** | 2 dakikalık sabit rota, özellik maliyetleri, darboğaz, önerilen ayarlar, anonim rapor. | Ayarlar → Grafik → Sorun giderme → Performans testi | — | V2.12 | perftest, v234 | ✅ iyi |
| **Görüntü sorunu testi** | Katmanları tek tek kapatıp görüntü hatasının kaynağını bulma. | Ayarlar → Grafik → Sorun giderme → Görüntü testi | — | V1.97 | gfxtest, v237 | ✅ iyi |
| **Grafik tanılama** | Cihaz bilgisi, derinlik, efekt durumu gibi tanılama satırları. | Ayarlar → Grafik → Sorun giderme → Tanılama | — | V1.59 | gfxtest, v237 | ✅ iyi |
| **Yükleme ekranı** | Dönen 3B ay yıldız, uçak biçimli ilerleme çubuğu, ipucu kartları, oyun dilinde aşama adları, hafif yükleme sesi. | Açılışta | — | V2.20 | boot, v238 | ✅ iyi |

## Hesap ve kayıt

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Kendi adresi** | Oyun V2.55'ten beri kendi adresinde (ayyildiz-kizilelma-game.github.io); tarayıcı kaydı aynı GitHub hesabındaki başka uygulamalarla ortak değil, biri temizlenince öteki silinmiyor. Eski adres yeni adrese yönlendiriyor ve cihazdaki kaydı da taşıyor. | Eski adres → yeni adres | — | V2.55 | v255 | ✅ iyi |
| **Model bulut yedeği** | Model Kütüphanesi'nde içe aktarılan modeller giriş yapan oyuncu için buluta da yedeklenir; tarayıcı verisi silinse ya da başka cihazdan girilse bile girişten sonra kendiliğinden geri gelir. Yalnız cihazda olan modeller ilk girişte buluta çıkar. | Model Kütüphanesi · giriş | — | V2.53 | v253 | ✅ iyi |
| **Hesabımı sil** | Giriş yapmış oyuncu hesabını (giriş bilgisi dahil), profilini, bulut kaydını ve buluttaki modellerini oyunun içinden kalıcı olarak siler (iki kez basılır; V2.57'de tam silme). Google Play şartı; web sayfası: gizlilik → Hesap silme. | Profil → Hesap | — | V2.52 | v252 | ✅ iyi |
| **Google Play paketi** | Android uygulaması (V2.62'den beri Capacitor; oyun dosyaları APK'nın içinde) her sürümde GitHub Actions'ta imzalı .apk ve .aab olarak üretilir, emülatörde denenir ve indirme sayfasına konur. Geri tuşu menüleri kapatır; Google ile giriş tarayıcı sekmesinde açılıp oyuna döner. Mağaza metinleri ve yükleme rehberi docs/PLAY-STORE.md'de. | GitHub → Actions → Android uygulaması | — | V2.52 | setup, v262 | 🔧 iyileştirilmeli |
| **Hızlı güncelleme** | Android uygulaması açılışta yeni sürüm olup olmadığına bakar; varsa "Yeni sürüm" kartı çıkar, Şimdi güncelle ile oyun dosyaları (~1,5 MB) indirilir ve uygulama birkaç saniyede yeni sürümle açılır. APK indirmek gerekmez. Yeni sürüm açılamazsa eski sürüme kendiliğinden döner; yeni sürümler telefonlara yalnız emülatör denemesi geçerse sunulur. | Uygulama açılışı | — | V2.63 | v263 | ✅ iyi |
| **Reklamlar** | Yalnız Android uygulamasında, Google AdMob: isteğe bağlı ödüllü reklamla görev ödülünü (TP) ikiye katlama ve bir kaplama paketini 24 saat deneme; bitmiş görevden çıkarken en çok 5 dakikada bir geçiş reklamı (ilk oturumda hiç). Günlük ödülü 2 katına çıkarma ve Harekât'ta başarısız bölümde kaldığın yerden devam (V2.69). Afiş yok. İlk açılışta kişiselleştirilmiş/kişiselleştirilmemiş seçimi, gereken ülkelerde Google izin formu. Reklamsız ürünü olan reklam görmez, ödülleri reklamsız alır. | Görev sonu · Mağaza · Mağaza → Reklam tercihleri | — | V2.62 | v262 | 🔧 iyileştirilmeli |
| **Mağaza** | Ana menüde Mağaza: Reklamsız, üç kaplama paketi (Kış Harekâtı, Mavi Vatan, Tarihî; her biri 3 kaplama) ve Destekçi paketi. Sahip olunan ürünler hesaba bağlı (bulut tablosu entitlements, cihazda önbellek). Hangarda paket kaplamaları 🛒 ile görünür, seçince mağaza açılır. Para güç satın almaz. | Ana menü → Mağaza · Hangar → Boya | — | V2.61 | v261 | 🔧 iyileştirilmeli |
| **Hesap ve profil** | Misafir ya da bulut hesabı, oyuncu kartı, birden çok profil, bulut eşitleme. | Ana menü → sağ üstteki profil | — | V1.66 | account, pcard | ✅ iyi |
| **Kayıt ve yedek** | Bütün ilerleme tek kayıtta, her oturum yedekleniyor; grafik ayarları cihaza özel. | Kendiliğinden | — | V2.26 | depo | ✅ iyi |
| **Uygulama olarak yükleme** | Ana ekrana ekleme, kısayollar, Android (Play Store) hazırlığı. | Ana menü → Uygulamayı yükle | — | V2.01 | install | ✅ iyi |
| **Duyurular ve sürüm notları** | Yönetici duyuruları, güncellemeden sonra yenilikler şeridi, Yenilikler ekranı. | Ana menü → Yenilikler | — | V1.66 | notes | ✅ iyi |

## Yönetici araçları

| Özellik | Ne yapar | Nereden | Tuş | Sürüm | Test | Durum |
|---|---|---|---|---|---|---|
| **Yönetim paneli** | Duyuru yayını, görev yayını, kütüphanelere giriş (yalnız yönetici). | Ana menü → kalkan düğmesi | — | V1.68 | account | ✅ iyi |
| **Model kütüphanesi** | Bütün modelleri 3B inceleme, test, boya, kendi modelini yükleme (.glb .gltf .fbx .obj .stl .dae), ölçü denetimi. | Yönetim paneli → Kütüphaneler | — | V1.37 | library, modelreg | ✅ iyi |
| **Ses kütüphanesi** | Her sesi dinleme, kendi ses dosyasıyla değiştirme, kanal karışımı. | Yönetim paneli → Kütüphaneler | — | V1.60 | sound | ✅ iyi |
| **Sistem envanteri** | Gerçek Türk sistemlerinin verileri (Defence Turk kaynaklı, atıflı). | Hangar → Gerçek veriler | — | V1.86 | envanter | ✅ iyi |
