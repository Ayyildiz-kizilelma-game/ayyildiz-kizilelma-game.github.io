# Google Play'e yükleme rehberi (V2.52)

> **V2.62'den beri uygulama Capacitor ile yapılıyor** (önceden TWA). Oyun dosyaları APK'nın içinde, sistemin WebView'ında
> çalışır. Neden: AdMob reklamları ve Google Play satın alımları ancak böyle çalışır, alan adı da gerekmez. Sonuç: her oyun
> sürümünde yeni bir APK/AAB üretilir (iş akışı `VERSION` değişince kendiliğinden çalışır) ve Play'e yeni paket yüklenir.

Hazır olanlar:

| Ne | Nerede |
|---|---|
| Android paketi üreten iş akışı | GitHub → Actions → **Android uygulaması** (`.github/workflows/android.yml`): derler, emülatörde dener, APK'yı indirme sayfasına koyar |
| Uygulama ayarları | `android-app/` (Capacitor, eklenti sürümleri) ve `tools/android-hazirla.py` (paket adı, yatay tam ekran, simgeler, giriş bağlantısı, AdMob kimliği) |
| Mağaza görselleri | `docs/play-store/` (öne çıkan görsel 1024×500, 5 ekran görüntüsü 1600×900) |
| Gizlilik politikası | https://ayyildiz-kizilelma-game.github.io/privacy.html |
| Hesap silme (Play şartı) | Oyunda Profil → Hesap → **Hesabımı sil** · web: `privacy.html#hesap-silme` · sunucu: `supabase/hesap_silme.sql` |

Senin yapman gerekenler aşağıda. Geliştirici hesabını açmak, ödeme, kimlik doğrulama ve Play Console'daki gönderimler
senin hesabınla yapılır.

## 1. Google Play geliştirici hesabı

1. https://play.google.com/console → Google hesabınla gir → **Kişisel** hesap.
2. Tek seferlik kayıt ücretini öde (25 ABD doları) ve kimlik doğrulamasını tamamla (birkaç gün sürebilir).
3. **Önemli:** yeni kişisel hesaplarda uygulama doğrudan herkese açılamaz. Önce **kapalı test**: en az **12 test kullanıcısı**
   uygulamayı **14 gün** boyunca yüklü tutmalı. Sonra Play Console'dan üretime geçiş başvurusu yapılır. Test kullanıcılarını
   (arkadaşlar, aile) şimdiden belirle; Gmail adresleri gerekecek.

## 2. İmza anahtarı (bir kez)

Paketin imza anahtarı **yükleme anahtarıdır**; Google, uygulamayı kendi anahtarıyla yeniden imzalar (Play App Signing).
Anahtarı kendi bilgisayarında üret ve **yedekle**:

```bash
keytool -genkeypair -keystore android.keystore -alias ayyildiz -keyalg RSA -keysize 2048 -validity 10000
# şifre sorar; ad-soyad alanına "Ay Yildiz" yazman yeterli
base64 -w0 android.keystore > keystore.txt     # macOS: base64 -i android.keystore -o keystore.txt
```

GitHub → depo → **Settings → Secrets and variables → Actions → New repository secret**:

| Ad | Değer |
|---|---|
| `ANDROID_KEYSTORE_B64` | `keystore.txt` dosyasının içeriği |
| `ANDROID_KEYSTORE_PASSWORD` | anahtar deposu şifresi |
| `ANDROID_KEY_PASSWORD` | anahtar şifresi (genelde aynı) |

> Secrets eklenmeden iş akışı yine çalışır ama geçici bir **deneme anahtarı** kullanır: çıkan `.apk` telefonda denenebilir,
> Play'e yüklenemez. `android.keystore` ve şifreyi asla depoya koyma.

## 3. Paketi üret

Her oyun sürümünde (`VERSION` değişince) **Actions → Android uygulaması** kendiliğinden çalışır; elle de *Run workflow* ile
çalıştırılabilir. ~15 dakika sürer:

1. Android projesini sıfırdan kurar (`npx cap add android` + `tools/android-hazirla.py`), imzalı `.apk` ve `.aab` derler.
2. APK'yı bir Android emülatöründe açar: uygulama açılıyor mu, reklam bildirimi görünüyor mu, deneme reklamları yükleniyor
   mu, çökme var mı. Sonuçlar işin özetinde yazılır.
3. APK'yı ve emülatör ekran görüntülerini **Releases → "Android uygulaması"** sayfasına koyar
   (`releases/download/android/AyYildiz-<sürüm>.apk`). Telefona oradan kurulur; aynı anahtar ve paket adıyla imzalı olduğu
   için eski sürümün (V2.59 TWA dahil) üstüne kurulur.

Telefondaki uygulama (V2.63 ve sonrası) yeni sürümü açılışta kendisi bulur ve APK indirmeden günceller
(**Hızlı güncelleme**, ayrıntı: ANDROID.md). Play'e çıkınca da bu sürer; Play mağazası yalnız uygulamanın kendisini günceller.

Play'e yüklenecek `.aab` işin sayfasında **Artifacts → android-play** içindedir. Sürüm kodu `VERSION`'dan gelir
(V2.62 → 262); her Play paketinde artmalı.

> **TWA'dan geçişte:** misafir kaydı (giriş yapmadan oynanan ilerleme) Chrome'da kalır, uygulamaya geçmez. Giriş yapan
> oyuncunun ilerlemesi buluttan gelir. Google ile giriş uygulamada tarayıcı sekmesinde açılır ve oyuna geri döner.

## 4. Play Console'da uygulama

**Uygulama oluştur:** ad *Ay Yıldız: Hedef Kızıl Elma*, varsayılan dil Türkçe, **Oyun**, **Ücretsiz**.

**Mağaza girişi**:

- **Kısa açıklama** (80 karakter):
  `KAAN, Hürjet, Bayraktar, ANKA-3 ile uç; Altay, ATAK, TCG Anadolu ile savaş.`
- **Tam açıklama**:

```
Ay Yıldız: Hedef Kızıl Elma, Türk hava, kara ve deniz sistemleriyle oynanan bir uçuş ve harekât oyunu.

UÇ
• TUSAŞ KAAN, Hürjet, Hürkuş, ANKA, ANKA-3, Aksungur; Baykar Bayraktar TB2, TB3, Akıncı ve Kızılelma.
• Her uçak gerçek boyutlarıyla, ayrıntılı modeliyle ve gerçek Türk mühimmatıyla: GÖKDOĞAN, BOZDOĞAN, SOM-J,
  MAM-L, MAM-C, TEBER-82, LUMTAS… İç silah yuvaları atışta açılır, TB3'ün kanatları katlanır.
• Kalkış, iniş, havada ikmal, akrobasi, gece uçuşu, değişen hava.

SAVAŞ VE GÖREV
• Harekât: Kızıl Elma hikâyeli kampanyası, kariyer ve rütbeler.
• Hızlı oyun, görev panosu, görev editörü, yarışlar.
• Çok oyunculu: arkadaşlarınla aynı gökyüzünde, bas-konuş sesli sohbet.

KARADA VE DENİZDE
• T129 ATAK ve T625 GÖKBEY helikopterleri; Altay, Fırtına, Pars, Kirpi, Korkut, Hisar.
• TCG Anadolu, Ada korveti, İstif fırkateyni, hücumbotlar; araçları sür, gemileri yönet.

TELEFONA UYGUN
• Dokunmatik kumanda ya da eğerek uçuş, titreşim, otomatik grafik ayarı.
• İnternetsiz de oynanır. Para güç satın almaz: reklamlar isteğe bağlı ödüllü reklamlardır.

Model Kütüphanesi'nde bütün araçları 3B olarak incele. Sistem bilgileri Defence Turk Sistem Envanteri'nden atıfla alınmıştır.
Bu oyun hobi amaçlı, bağımsız bir projedir; adı geçen şirketlerle resmî bir bağı yoktur.
```

- **Uygulama simgesi:** `icon-512.png`
- **Öne çıkan görsel:** `docs/play-store/feature-graphic-1024x500.png`
- **Telefon ekran görüntüleri:** `docs/play-store/ekran-1.png … ekran-5.png` (en az 2)
- **Kategori:** Oyun → Simülasyon. **Etiketler:** Uçuş simülasyonu, Askerî.
- **İletişim:** bir e-posta adresi ister (Play'de görünür; istersen ayrı bir adres aç).

## 5. AdMob hesabı (gerçek reklam için)

V2.62'deki reklamlar Google'ın **deneme reklamlarıdır**: gelir getirmez, ama her şeyin çalıştığını gösterir. Gerçek reklam için:

1. https://admob.google.com → Google hesabınla gir → hesap aç (ödeme ve vergi bilgileri sende).
2. **Uygulamalar → Uygulama ekle** → Android → (Play'de yayında değilse "Hayır") → ad: *Ay Yıldız*.
3. Çıkan **uygulama kimliğini** (`ca-app-pub-…~…`) ve iki **reklam birimi** oluşturup kimliklerini bana gönder:
   *Ödüllü* ve *Geçiş (interstitial)*. Bunlar gizli bilgi değildir, uygulamanın içine yazılır.
4. **Gizlilik ve mesajlaşma → GDPR**: Avrupa için izin mesajını oluştur ve yayınla (uygulama bu formu kendisi gösterir).
5. Play'de yayına çıkınca `app-ads.txt` dosyası gerekecek; içeriğini AdMob verir, ben oyunun adresine koyarım.

## 6. Uygulama içeriği formları

Play Console → **Politika → Uygulama içeriği**:

- **Gizlilik politikası:** `https://ayyildiz-kizilelma-game.github.io/privacy.html`
- **Reklamlar:** **Evet**, reklam içeriyor (AdMob; ödüllü ve seyrek geçiş reklamı, afiş yok).
- **Uygulama erişimi:** Bütün işlevler kısıtlamasız (hesap isteğe bağlı, misafir olarak oynanır).
- **İçerik derecelendirmesi (IARC anketi):** kategori *Oyun*. Şiddet: gerçekçi olmayan askerî araç çatışması, insan
  karakter yok, kan yok. Kullanıcı etkileşimi: **Evet** (çok oyunculu sohbet ve sesli sohbet). Konum paylaşımı: Hayır.
  Dijital satın alma: V2.67'den sonra **Evet** (kozmetik ürünler). Beklenen sonuç: PEGI 7–12 / Herkes 10+.
- **Hedef kitle:** **13 yaş ve üstü** seç. Çok oyunculu sohbet olduğu için 13 yaş altını seçmek Aileler politikasının
  ek şartlarını getirir.
- **Veri güvenliği:**
  - Veri toplanıyor mu? **Evet** (yalnız hesap açanlar ve rapor gönderenler için). Aktarımda şifreleniyor mu? **Evet** (HTTPS).
    Kullanıcı silme isteyebilir mi? **Evet**, uygulama içinden ve `privacy.html#hesap-silme`.
  - **Kişisel bilgiler → E-posta adresi:** toplanır, isteğe bağlı. Amaç: hesap yönetimi.
  - **Kişisel bilgiler → Kullanıcı kimlikleri** (çağrı adı): toplanır, isteğe bağlı. Amaç: hesap yönetimi, uygulama işlevleri.
  - **Uygulama etkinliği → Oyun içi ilerleme** (rütbe, istatistik, kayıt): toplanır, isteğe bağlı. Amaç: uygulama işlevleri.
  - **Dosyalar ve belgeler** (oyuncunun içe aktardığı 3B model dosyaları, V2.53): toplanır, isteğe bağlı. Amaç: uygulama işlevleri (yedek).
  - **Uygulama bilgileri ve performansı → Teşhis** (performans raporu): toplanır, isteğe bağlı, anonim. Amaç: analiz.
  - **Ses** (sesli sohbet): yalnız bas-konuş sırasında diğer oyunculara anlık iletilir, kaydedilmez. Formda
    *geçici olarak işleniyor* seçeneğini işaretle.
  - **Cihaz veya diğer kimlikler → Reklam kimliği** (V2.62): Google AdMob SDK'sı toplar ve Google ile **paylaşılır**.
    Amaç: reklam veya pazarlama, sahtecilik önleme. Kişiselleştirilmemiş seçenek uygulamada var.
  - **Konum → Yaklaşık konum** ve **Uygulama etkinliği**: AdMob SDK'sı reklam için işleyebilir; Google'ın SDK veri
    güvenliği sayfasındaki cevapları kullan (https://developers.google.com/admob/android/privacy/play-data-disclosure).
  - Oyunun kendi verileri için üçüncü taraflarla paylaşım: **Yok**. Veriler Supabase (barındırma hizmeti) üzerinde tutulur. Barındırma hizmeti
    sağlayıcısı "paylaşım" sayılmaz.
- **Hesap silme:** web bağlantısı `https://ayyildiz-kizilelma-game.github.io/privacy.html#hesap-silme`.
  Oyun içi silme hesabı tamamen siler: giriş hesabı, profil, bulut kaydı ve bulut modelleri (V2.57). Formda
  "kullanıcı hesabın silinmesini isteyebilir" ve "hesap silme web bağlantısı" seçenekleri bununla karşılanır.
- **Devlet uygulaması / finans / sağlık:** Hayır. **Haber uygulaması:** Hayır.

## 7. Kapalı test → üretim

1. **Test et ve yayınla → Kapalı test → Kanal oluştur** → test kullanıcılarının e-posta listesini ekle.
2. **Yeni sürüm oluştur** → `app-release-bundle.aab` yükle → sürüm notu (CHANGELOG'dan kısa bir özet) → incelemeye gönder.
3. Testçiler katılım bağlantısıyla uygulamayı kurar. 12 kişi, 14 gün boyunca kurulu tutmalı.
4. 14 gün dolunca **Üretim erişimi için başvur** → sorulara kısa cevaplar (testçilerden ne öğrendin, neyi düzelttin).
5. Onaydan sonra **Üretim → Yeni sürüm** → aynı `.aab` (ya da yenisi) → yayınla.

## Sonraki sürümler

V2.62'den beri her oyun sürümü yeni bir paket demektir: iş akışı `VERSION` değişince APK ve `.aab` üretir; Play'e yeni
`.aab` yüklenir. Web sürümü (GitHub Pages) her zamanki gibi anında güncellenir.
