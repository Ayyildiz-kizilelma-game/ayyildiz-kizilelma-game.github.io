#!/usr/bin/env bash
# V2.62: the Android app in an emulator (GitHub Actions, android.yml). Installs the APK, opens the game, answers the ad
# notice, waits for the (test) ads to load and saves screenshots and logs to emu/. Results go out as ::notice / ::error
# lines so they can be read without downloading anything. Usage: tools/android-emulator-test.sh app.apk
set -u
APK="$1"; PKG=tr.ayyildiz.hedefkizilelma; OUT=emu; mkdir -p "$OUT"
fail=0; err(){ echo "::error title=Emülatör::$1"; fail=1; }; note(){ echo "::notice title=Emülatör::$1"; }
adb wait-for-device; adb shell settings put global window_animation_scale 0; adb shell settings put global transition_animation_scale 0
adb install -r "$APK" > "$OUT/install.txt" 2>&1 || { err "kurulum başarısız: $(tail -n 2 "$OUT/install.txt" | tr '\n' ' ')"; exit 1; }
adb logcat -c
# Android shows a one-time "Viewing full screen" tip over immersive apps: mark it as seen
adb shell settings put secure immersive_mode_confirmations confirmed
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
t0=$(date +%s)
# wait for the game's menu (the ad notice shows once the menu is up)
for i in $(seq 1 60); do sleep 3; adb logcat -d -s Capacitor/Console:* 2>/dev/null | grep -q "uygulama kabuğu" && break; done
sleep 25
adb exec-out screencap -p > "$OUT/1-acilis.png"
PID=$(adb shell pidof -s "$PKG" | tr -d '\r'); [ -n "$PID" ] && note "uygulama çalışıyor (pid $PID, $(( $(date +%s)-t0 )) sn)" || err "uygulama açık değil (çöktü mü?)"
adb exec-out uiautomator dump /dev/tty > "$OUT/ui.xml" 2>/dev/null
B=$(python3 - "$OUT/ui.xml" <<'P'
import re,sys
x=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
for m in re.finditer(r'<node [^>]*>',x):
    n=m.group(0)
    if 'kişiselleştirilmemiş' in n:
        b=re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',n)
        if b:
            a=list(map(int,b.groups())); print((a[0]+a[2])//2,(a[1]+a[3])//2); break
P
)
if [ -z "$B" ]; then   # WebView text not in the accessibility tree: the button's place in the layout (52.7 % width, 80.5 % height)
  WH=$(adb shell wm size | tail -n 1 | grep -o '[0-9]*x[0-9]*'); W=${WH%x*}; H=${WH#*x}; [ "$W" -lt "$H" ] && { t=$W; W=$H; H=$t; }
  B="$((W*527/1000)) $((H*805/1000))"; echo "konumla dokunuluyor: $B"; fi
if [ -n "$B" ]; then note "reklam bildirimi göründü; 'Yalnız kişiselleştirilmemiş' seçildi"; adb shell input tap $B; else err "reklam bildirimi bulunamadı (ekran: 1-acilis.png)"; fi
sleep 4; adb exec-out screencap -p > "$OUT/2-dokunduktan-sonra.png"
for i in $(seq 1 30); do sleep 3; adb logcat -d -s Capacitor/Console:* 2>/dev/null | grep -q "reklam hazır: rew" && break; done
adb exec-out screencap -p > "$OUT/3-sonra.png"
PID2=$(adb shell pidof -s "$PKG" | tr -d '\r'); [ -n "$PID2" ] || err "dokunduktan sonra uygulama kapandı"
adb logcat -d > "$OUT/logcat.txt"; adb logcat -d -b crash > "$OUT/crash.txt"
grep -a -i "AndroidRuntime\|FATAL\|$PKG\|Capacitor\|Ads \|UserMessaging\|ActivityManager.*ayyildiz\|ActivityTaskManager.*ayyildiz\|lowmemory\|am_kill" "$OUT/logcat.txt" | grep -v "Registering plugin" | tail -n 400 > "$OUT/kayit.txt"
grep -a "AyYildiz\]" "$OUT/logcat.txt" | sed 's/.*\[AyYildiz\]/[AyYildiz]/' | head -n 20 > "$OUT/oyun.txt"
grep -q "AdMob başladı" "$OUT/oyun.txt" && note "AdMob başladı (deneme reklamları)" || err "AdMob başlamadı: $(grep -a 'AdMob\|reklam' "$OUT/logcat.txt" | tail -n 3 | tr '\n' ' ' | cut -c1-400)"
grep -q "reklam hazır: rew" "$OUT/oyun.txt" && note "ödüllü deneme reklamı yüklendi" || err "ödüllü reklam yüklenmedi"
grep -q "reklam hazır: int" "$OUT/oyun.txt" && note "geçiş deneme reklamı yüklendi" || echo "::warning title=Emülatör::geçiş reklamı yüklenmedi"
[ -s "$OUT/crash.txt" ] && err "çökme kaydı: $(head -n 5 "$OUT/crash.txt" | tr '\n' ' ' | cut -c1-400)"
JS=$(grep -a "Capacitor/Console" "$OUT/logcat.txt" | grep -ai "error\|uncaught" | head -n 3 | tr '\n' ' ' | cut -c1-500); [ -n "$JS" ] && echo "::warning title=Emülatör JS::$JS"
exit $fail
