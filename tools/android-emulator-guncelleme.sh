#!/usr/bin/env bash
# V2.63: the quick update in an emulator. A test build of the app reads its update file from a temporary download page
# (version V99.0, same game files) and updates without asking. Checks: the update downloads, the app restarts on it, and
# it stays on it (the updater goes back to the old version when the new one does not start). Usage: script app-debug.apk
set -u
APK="$1"; PKG=tr.ayyildiz.hedefkizilelma; OUT=emu; mkdir -p "$OUT"
fail=0; err(){ echo "::error title=Hızlı güncelleme::$1"; fail=1; }; note(){ echo "::notice title=Hızlı güncelleme::$1"; }
adb uninstall "$PKG" > /dev/null 2>&1
adb install -r "$APK" > "$OUT/install2.txt" 2>&1 || { err "deneme paketi kurulamadı: $(tail -n 2 "$OUT/install2.txt" | tr '\n' ' ')"; exit 1; }
adb shell settings put secure immersive_mode_confirmations confirmed
adb logcat -c; adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
log(){ adb logcat -d -s Capacitor/Console:* 2>/dev/null | grep -a "AyYildiz\]" | sed 's/.*\[AyYildiz\]/[AyYildiz]/'; }
for i in $(seq 1 80); do sleep 3; log | grep -q "paket: 99.0" && break
  # the launcher of the slow emulator may die and take the app with it: open it again
  [ -z "$(adb shell pidof -s "$PKG" | tr -d '\r')" ] && adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1; done
log > "$OUT/guncelleme.txt"
if grep -q "paket: 99.0" "$OUT/guncelleme.txt"; then note "güncelleme indirildi ve uygulama yeni sürümle açıldı ($(grep -m1 'güncelleme: sunucuda' "$OUT/guncelleme.txt" | cut -c1-120))"
else err "güncelleme olmadı: $(tail -n 6 "$OUT/guncelleme.txt" | tr '\n' ' ' | cut -c1-500)"; fi
sleep 35   # longer than appReadyTimeout (20 s): a broken update would be rolled back by now
adb exec-out screencap -p > "$OUT/5-guncellendi.png"
log > "$OUT/guncelleme.txt"
LAST=$(grep "paket:" "$OUT/guncelleme.txt" | tail -n 1)
echo "$LAST" | grep -q "paket: 99.0" && note "yeni sürümde kaldı: $LAST" || err "yeni sürümde kalmadı (geri dönüldü?): $LAST"
grep -q "sürüm hazır: V99.0" "$OUT/guncelleme.txt" && note "yeni sürüm hazır bildirdi (geri dönüş yok)" || err "yeni sürüm hazır bildirmedi"
exit $fail
