# Android uygulaması

> Google Play'e yükleme rehberi, mağaza metinleri, formlar ve AdMob hesabı: [PLAY-STORE.md](PLAY-STORE.md).

## V2.62'den beri: Capacitor

Uygulama bir **Capacitor** uygulamasıdır: oyun dosyaları APK'nın içindedir ve sistemin WebView'ında çalışır (V2.52–V2.61
arasında Chrome'u açan bir TWA kabuğuydu). Geçişin nedeni gelir yolu: AdMob reklamları (V2.62) ve Google Play satın
alımları (V2.64) yerel eklenti ister. Alan adı gerekmez.

| Parça | Nerede |
|---|---|
| Capacitor ve eklenti sürümleri (`@capacitor/*` 8.x, `@capacitor-community/admob`) | `android-app/package.json`, `package-lock.json` |
| Uygulama ayarı (paket adı `tr.ayyildiz.hedefkizilelma`, `https://localhost`, konsol kaydı) | `android-app/capacitor.config.json` |
| Web dosyalarını kopyalama ve yerel projeyi düzenleme | `tools/android-hazirla.py` (`www`, `yerel`) |
| Derleme, emülatör denemesi, indirme sayfası | `.github/workflows/android.yml`, `tools/android-emulator-test.sh` |
| Oyun tarafı | `src/js/ag/uygulama.js` (geri tuşu, Google ile giriş), `src/js/ag/guncelleme.js` (hızlı güncelleme), `src/js/ag/reklam.js` (reklamlar, izin) |

Android projesi (`android-app/android/`) depoda tutulmaz: iş akışı her seferinde `npx cap add android` ile sıfırdan kurar
ve `android-hazirla.py yerel` ile şunları yapar:

- sürüm adı/kodu `VERSION`'dan (V2.62 → 262), imza GitHub Secrets'tan;
- yatay ekran (`sensorLandscape`), sistem çubukları gizli tam ekran, ekran açık kalır, çentik altına çizim;
- Google ile giriş dönüş bağlantısı `tr.ayyildiz.hedefkizilelma://giris`;
- AdMob uygulama kimliği (şimdilik Google'ın deneme kimliği; gerçeği `ADMOB_APP_ID` ile);
- simgeler (`icons/icon-maskable-512.png` uyarlanabilir simge, `icon-512.png` eski simge) ve koyu açılış ekranı.

Bilgisayarda denemek için (Android Studio ve SDK gerekir):

```bash
cd android-app && npm ci && cd ..
python3 tools/android-hazirla.py www
(cd android-app && npx cap add android)
python3 tools/android-hazirla.py yerel V2.62
(cd android-app && npx cap open android)
```

### Hızlı güncelleme (V2.63)

Oyun dosyaları APK'nın içinde olduğu için her sürüm normalde yeni APK isterdi. V2.63'ten beri:

- `android.yml` her sürümde oyun dosyalarını `AyYildiz-www-<sürüm>.zip` (~1,5 MB) ve `guncelleme.json` (sürüm, zip adresi,
  boyut, SHA-256, `enAzKod`, başlık, notlar) olarak "android" indirme sayfasına koyar — **yalnız emülatör denemesi
  geçerse**; bozuk bir sürüm telefonlara hiç sunulmaz.
- Uygulama açılınca (ve bir saatten uzun arka planda kaldıktan sonra) `guncelleme.json`'u okur. Daha yeni sürüm varsa
  "Yeni sürüm" kartı çıkar; **Şimdi güncelle** zip'i indirir (SHA-256 denetimiyle), uygulama birkaç saniyede yeni sürümle
  yeniden açılır. İlerleme ve ayarlar aynı yerde kalır.
- Geçişi `@capgo/capacitor-updater` eklentisi yapar: kendi sunucumuz (GitHub indirme sayfası), elle mod, Capgo sunucusu
  ve istatistik yok (`statsUrl: ""`). Yeni sürüm 20 saniye içinde "hazırım" demezse (`notifyAppReady`) eski sürüme döner.
- Yerel parça değişirse (yeni eklenti) `tools/android-hazirla.py` içindeki `EN_AZ_KOD` artırılır; daha eski uygulamalara
  kart "Yeni APK'yı indir" der. Yeni APK kurulunca uygulama her zaman kendi içindeki dosyalarla başlar.
- Emülatör denemesi: `tools/android-emulator-guncelleme.sh` bir deneme paketini (sürümü V99.0 diye değiştirilmiş aynı
  dosyalar, geçici "guncelleme-denemesi" indirme sayfası) indirip kurar, yeni sürümde kaldığını denetler.

### Google ile giriş

Google, WebView içinde girişe izin vermez. Uygulama girişi tarayıcı sekmesinde (Custom Tab) açar; Supabase oyunun web
adresine `?uyg=giris` ile döner, o sayfa anahtarları yalnız bu paketin alabildiği bir `intent://` bağlantısıyla uygulamaya
verir, uygulama oturumu açar. Supabase ayarlarında ek bir adres gerekmez (oyunun adresi zaten izinli). E-posta ile giriş
doğrudan çalışır.

### Reklamlar (V2.62)

Kurallar ROADMAP → Gelir planı'nda. Teknik olarak: ilk açılışta oyunun kendi bildirimi (kişiselleştirilmiş ya da değil),
sonra Google UMP izin formu (yalnız gereken ülkelerde), sonra AdMob. V2.62 yalnız **deneme reklam birimlerini** kullanır
(`ADS.test`). Tarayıcıda akışı denemek için adrese `?reklam=dene` eklenir: reklam yerine 3 saniyelik bir perde çıkar.

## Telefon özellikleri (V1.90)

- **Eğerek uç:** Ayarlar → Kontroller → *Eğerek uç*; *Sıfırla* düğmesi o anki tutuşu düz uçuş kabul eder.
- **Titreşim:** Ayarlar → Erişilebilirlik → *Kumanda titreşimi*.
- **Kayıt yedeği:** Ayarlar → Kontroller → *Kayıt yedeği*. Hesap açanların ilerlemesi zaten bulutta saklanır.

## Web uygulaması (PWA)

Oyun tarayıcıda da bir PWA'dır (`manifest.webmanifest` + `sw.js`): Chrome'da **⋮ → Ana ekrana ekle** ile tam ekran ve
çevrimdışı çalışır. Simgeler `icon.svg`'den üretilir (`icon-*.png`, `icons/`).
