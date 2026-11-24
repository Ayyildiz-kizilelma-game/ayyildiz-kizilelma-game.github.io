# Karar raporu: three.js sürümü (V2.31)

**Durum:** oyun three.js **r128** (Mart 2021) ile çalışıyor; dosyalar `vendor/three-r128` içinde, tek dosyalık yapı (`three.min.js` + ek betikler).
**Soru:** güncel sürüme geçelim mi?
**Karar senin.** Bu rapor seçenekleri ve maliyetlerini anlatıyor.

## Güncel sürümün getirdikleri
| Özellik | Bize faydası |
|---|---|
| **BatchedMesh** (r159+) | Farklı şekilli ama aynı malzemeli parçalar tek çizimde. Şehirler ve üsler için şu anki birleştirme ve pişirme işinin büyük kısmı kendiliğinden çözülür. Çizim sayısı tahminen %30–50 azalır. |
| **Paralel / asenkron shader derleme** (`compileAsync`, KHR_parallel_shader_compile) | Açılıştaki shader ısıtma ana iş parçacığını kilitlemez. Telefonda yükleme ekranındaki takılmalar azalır. |
| **WebGPU oluşturucu** (deneysel → olgunlaşıyor) | Android'de Vulkan üzerinden daha düşük CPU maliyeti. Uzun vadeli seçenek. |
| Renk yönetimi, fiziksel ışık birimleri | Daha doğru renkler. Ama bizim için bu bir **maliyet** (aşağıda). |
| Hata düzeltmeleri, daha iyi GLTF yükleyici | Model kütüphanesinde daha çok dosya sorunsuz açılır. |

## Geçişin maliyeti
1. **Modül yapısı:** r160'tan beri tek dosyalık `three.min.js` yok, yalnız ES modülleri var. Bizim tek HTML dosyalık yayınımız için bir paketleyici (esbuild gibi) gerekir. `tools/build.py` bunu çağıracak şekilde değişir. Çevrimdışı çalışma ve `sw.js` önbelleği yeniden denenir.
2. **Işık ve renk:**
   - r152'den itibaren renkler sRGB olarak yönetiliyor, r155'ten itibaren ışık şiddetleri fiziksel birimlerde.
   - Oyunun bütün renkleri, güneş, gökyüzü ve boya paleti bugünkü görünümü tutturmak için yeniden ayarlanmalı.
   - Bu, en çok emek isteyen ve en çok gözle denetlenecek kısım.
3. **Kaldırılan API'ler:**
   - `WebGLMultisampleRenderTarget` artık yok (yerine `samples`).
   - EffectComposer ve geçişler yeni yollarında.
   - Bazı malzeme ve doku alanları değişti.
   - Oyunda bunlara dokunan yaklaşık 15–20 modül var.
4. **Test ortamı:** sahte THREE ortamı (`tests/harness.js`) yeni API'ye göre güncellenir.

**Tahmini iş:** 2–3 sürüm. Önce yalnızca derleme ve paketleme; sonra ışık ve renk ayarı (ekran görüntüleriyle karşılaştırarak); en son BatchedMesh ve asenkron derlemeyi kullanmaya başlamak.

## Seçenekler
- **A — Şimdilik r128'de kal (önerim).** Oyun bugün telefonda 60 FPS yakalıyor. Takılmaların kaynağı henüz ölçülüyor. Model serisi (V2.41+) r128 ile yapılabilir. Geçişi model serisinden sonraya, ayrı bir "Motor yenileme" dönemine bırakırız.
- **B — Model serisinden önce geç.** Yeni modeller baştan BatchedMesh'e uygun yapılır. Ama model serisi 2–3 sürüm gecikir ve ışık ve renk ayarı modellerle aynı anda değişir (karşılaştırması zor).
- **C — Doğrudan WebGPU'ya hazırlan.** En büyük kazanç, en büyük risk. Tarayıcı desteği ve three.js'in WebGPU oluşturucusu olgunlaştıkça yeniden değerlendirilir.

Not: bu rapordaki sürüm numaraları Haziran 2026 bilgisine dayanıyor. Geçiş kararı verilirse önce güncel sürüm notları yeniden okunur.


## Sonuç (V2.64, 24 Kasım 2026)

Oyuncu kararıyla (22 Kasım) geçiş yapıldı: **r128 → r187**. Oyun kodu klasik betik olarak kaldı; three.js'i kendimiz
paketliyoruz:

- `tools/three/` (`three@0.187.0`, `esbuild`): `node paketle.mjs` → `vendor/three-r187/three.min.js` (çekirdek, `window.THREE`)
  ve ihtiyaç anında yüklenen grup dosyaları (`efektler.js`, `gltf.js`, `gltf-disa.js`, `fbx.js`, `obj.js`, `stl.js`,
  `collada.js`, `draco/`). CDN yok: dosyalar oyunun parçası (Android uygulamasında da). `tek-dosya.html` çekirdeği içinde taşır.
- **r128 uyum katmanı** (`tools/three/cekirdek.js`), görünüm aynı kalsın diye:
  - renk yönetimi kapalı, çıktı doğrusal (r128'deki `LinearEncoding`);
  - ışıklar: r128 her ışığı π ile çarpıyordu; çizim sırasında oyunun ışıkları π ile çarpılıyor (yoğunluk değerleri aynı anlamda);
  - nokta ışıklarında fiziksel ters kare sönümü yok (`decay 0`);
  - düz küp ortam haritası yalnız yansıma veriyor (r187 ondan ayrıca dağınık ışık ekliyordu, metaller beyazlaşıyordu);
  - parlama (bloom) arabellekleri 8 bit (r187'de yarım kayan noktalı, parlak noktalar fazla parlıyordu);
  - çift yüzlü saydam nesneler tek geçişte çiziliyor (r150+ iki geçişte çiziyordu);
  - `InstancedMesh` r128'deki gibi ayıklamasız doğuyor ve geometrinin sınır küresini kullanıyor (oyunun kendi ayıklama
    sistemi buna dayanıyor; r187 varsayılanıyla çizim sayısı %10 artmıştı);
  - kaldırılan adlar: `WebGLMultisampleRenderTarget`, `LinearEncoding`/`sRGBEncoding`, `texture.encoding`,
    `renderer.outputEncoding`, `capabilities.isWebGL2`.
- Oyun kodunda tek değişiklik: uzak arazinin güncellenmesi (`updateRange` → `addUpdateRange`, r159'da değişti). Eski
  çağrı sessizce hata veriyordu; bütün boş `catch` blokları hata yazacak biçimde denendi, başka yutulan hata yok.
- Önce/sonra ekran görüntüleri (uçuş, şehir, gece): ortalama renk farkı ±4'ün altında. Tarayıcı denetimi (aynı rastgele
  dizi): çizim sayıları r128 ile aynı, üçgen sayısı biraz daha az (r187'de koni ağaçlar daha az üçgenli).
- WebGL1 desteği bitti (r163'ten beri); WebGL2 olmayan cihaz kalmadı sayılır.
- Sonraki adımlar: V2.65 asenkron shader derleme ve BatchedMesh, V2.66 telefon ölçümü.

## Kazanımlar (V2.65)

- **Toplu çizim (`BatchedMesh`, `performans/toplu-cizim.js`):** birleştirme sisteminin (MRG) aynı malzemeli hücreleri tek
  bir BatchedMesh'te; hücre görünürlüğü `setVisibleAt`, kamera ve gölge kamerasına göre ayıklamayı batch kendisi yapar.
  Ölçüm (tarayıcı denetimi, aynı rastgele dizi): 102 hücre → 12 çizim; uçuşta 272 → 242, ikinci uçuş görünümünde
  307 → 292, şehirde 280 → 265, ormanda 341 → 315 çizim. Görüntü aynı. Hücre bozulunca (içinde bir şey hareket edince)
  hücre batch'ten çıkıyor ve eskisi gibi tek başına çiziliyor. `?toplu=0` ile kapatılıp karşılaştırılabilir.
- **Asenkron shader ısıtma:** menüdeki ön derleme `renderer.compileAsync` ile 48'lik gruplar hâlinde; sürücü programları
  paralel derliyor (KHR_parallel_shader_compile), oyun beklemiyor. Test makinesinde 336 malzeme toplam 23 ms işlemci
  süresi (önce: kare başına 8 ms, birkaç saniye).
