#!/usr/bin/env python3
"""V2.62 Android app (Capacitor): prepares the web files and patches the generated Android project.

  python3 tools/android-hazirla.py www            copy the built game into android-app/www (+ Capacitor runtime)
  python3 tools/android-hazirla.py yerel VERSION  after `npx cap add android`: package id, version, full screen,
                                                  landscape, sign-in link, AdMob app id, icons, splash, signing
  python3 tools/android-hazirla.py paket VERSION URL   V2.63 quick update: zip of www + guncelleme.json for the
                                                  download page (URL = where the zip will be)
  python3 tools/android-hazirla.py test ADRES     emulator test build only: www reads its update file from ADRES and
                                                  updates without asking

The Android project itself is not kept in the repo: GitHub Actions (.github/workflows/android.yml) creates it from scratch
each time with `npx cap add android` and this script, so the same steps always give the same app. Nothing here holds
passwords: signing reads the keystore path and passwords from environment variables at build time."""
import os, re, sys, shutil, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPDIR = os.path.join(ROOT, 'android-app')
WWW = os.path.join(APPDIR, 'www')
PKG = 'tr.ayyildiz.hedefkizilelma'
# Google's test AdMob app id (V2.62). The real id comes with the AdMob account (then also the ad unit ids in ag/reklam.js).
ADMOB_APP_ID = os.environ.get('ADMOB_APP_ID') or 'ca-app-pub-3940256099942544~3347511713'
BG = '#0a1220'
# The oldest app (version code) that can take a quick update of the game files. Raise it when the native part changes
# (a new Capacitor plugin, a manifest change the game code relies on): older apps are then offered the new APK instead.
EN_AZ_KOD = 263
SITE_FILES = ['index.html', 'oyun.js', 'manifest.webmanifest', 'privacy.html', 'version.json', 'icon-192.png', 'icon-512.png']
SITE_DIRS = ['icons', 'assets', 'vendor']


def www():
    if os.path.isdir(WWW):
        shutil.rmtree(WWW)
    os.makedirs(WWW)
    for f in SITE_FILES:
        shutil.copy2(os.path.join(ROOT, f), os.path.join(WWW, f))
    for d in SITE_DIRS:
        if os.path.isdir(os.path.join(ROOT, d)):
            shutil.copytree(os.path.join(ROOT, d), os.path.join(WWW, d))
    core = os.path.join(APPDIR, 'node_modules', '@capacitor', 'core', 'dist', 'capacitor.js')
    shutil.copy2(core, os.path.join(WWW, 'capacitor.js'))
    p = os.path.join(WWW, 'index.html')
    h = open(p, encoding='utf-8').read()
    # the Capacitor runtime must be there before the game code (ag/uygulama.js reads window.Capacitor)
    m = re.search(r'<script[^>]*src="oyun\.js[^"]*"', h)
    if not m:
        sys.exit('index.html: oyun.js betiği bulunamadı')
    h = h[:m.start()] + '<script src="capacitor.js"></script>\n' + h[m.start():]
    h = h.replace('<link rel="manifest" href="manifest.webmanifest">', '')
    open(p, 'w', encoding='utf-8').write(h)
    n = sum(len(fs) for _, _, fs in os.walk(WWW))
    print('www hazır: %d dosya' % n)


def sub(path, old, new, count=1):
    s = open(path, encoding='utf-8').read()
    if old not in s:
        sys.exit('%s: beklenen metin yok: %r' % (os.path.relpath(path, APPDIR), old[:70]))
    s = s.replace(old, new, count)
    open(path, 'w', encoding='utf-8').write(s)


def icons(res):
    from PIL import Image
    mask = Image.open(os.path.join(ROOT, 'icons', 'icon-maskable-512.png')).convert('RGBA')
    full = Image.open(os.path.join(ROOT, 'icon-512.png')).convert('RGBA')
    bg = mask.getpixel((4, 4))
    dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
    for d, k in dens.items():
        dd = os.path.join(res, 'mipmap-' + d)
        os.makedirs(dd, exist_ok=True)
        leg = round(48 * k)
        full.resize((leg, leg), Image.LANCZOS).save(os.path.join(dd, 'ic_launcher.png'))
        # round legacy icon: the maskable art inside a circle
        r = mask.resize((leg, leg), Image.LANCZOS)
        circ = Image.new('L', (leg, leg), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(circ).ellipse((0, 0, leg - 1, leg - 1), fill=255)
        rr = Image.new('RGBA', (leg, leg), (0, 0, 0, 0)); rr.paste(r, (0, 0), circ)
        rr.save(os.path.join(dd, 'ic_launcher_round.png'))
        # adaptive foreground: 108 dp canvas; the maskable art at 90 dp so its 80 % safe zone fills the visible 72 dp
        fg = round(108 * k); art = round(90 * k)
        c = Image.new('RGBA', (fg, fg), (0, 0, 0, 0))
        c.paste(mask.resize((art, art), Image.LANCZOS), ((fg - art) // 2, (fg - art) // 2))
        c.save(os.path.join(dd, 'ic_launcher_foreground.png'))
    with open(os.path.join(res, 'values', 'ic_launcher_background.xml'), 'w') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#%02x%02x%02x</color>\n</resources>\n' % bg[:3])
    # adaptive icon xml: use the foreground png (not the template's vector drawable)
    for name in ('ic_launcher.xml', 'ic_launcher_round.xml'):
        with open(os.path.join(res, 'mipmap-anydpi-v26', name), 'w') as f:
            f.write('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
                    '    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
                    '    <monochrome android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n')
    v24 = os.path.join(res, 'drawable-v24', 'ic_launcher_foreground.xml')
    if os.path.exists(v24):
        os.remove(v24)
    # splash: dark background with the icon in the middle, every density and orientation
    for p in glob.glob(os.path.join(res, 'drawable*', 'splash.png')):
        w, h = Image.open(p).size
        sp = Image.new('RGB', (w, h), BG)
        s = max(48, min(w, h) // 4)
        ic = full.resize((s, s), Image.LANCZOS)
        sp.paste(ic, ((w - s) // 2, (h - s) // 2), ic)
        sp.save(p)


def yerel(version):
    A = os.path.join(APPDIR, 'android')
    app = os.path.join(A, 'app')
    v = version.strip().lstrip('V')
    major, minor = v.split('.')
    code = int(major) * 100 + int(minor)   # 2.62 → 262, same rule as the TWA packages, so it installs over them
    g = os.path.join(app, 'build.gradle')
    sub(g, 'versionCode 1', 'versionCode %d' % code)
    sub(g, 'versionName "1.0"', 'versionName "%s"' % v)
    # signing from environment variables (GitHub secrets); without them gradle signs nothing and CI uses its own key
    sub(g, '    buildTypes {', '''    signingConfigs {
        release {
            if (System.getenv("AYY_KEYSTORE")) {
                storeFile file(System.getenv("AYY_KEYSTORE"))
                storePassword System.getenv("AYY_KEYSTORE_PASSWORD")
                keyAlias System.getenv("AYY_KEY_ALIAS") ?: "ayyildiz"
                keyPassword System.getenv("AYY_KEY_PASSWORD") ?: System.getenv("AYY_KEYSTORE_PASSWORD")
            }
        }
    }
    buildTypes {''')
    sub(g, '            minifyEnabled false', '            minifyEnabled false\n            if (System.getenv("AYY_KEYSTORE")) signingConfig signingConfigs.release')
    # manifest: landscape game, sign-in link (tr.ayyildiz.hedefkizilelma://giris), AdMob app id
    m = os.path.join(app, 'src', 'main', 'AndroidManifest.xml')
    sub(m, 'android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"\n            android:resizeableActivity="false"')
    sub(m, '''                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>''', '''                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="%s" android:host="giris" />
            </intent-filter>''' % PKG)
    sub(m, '        <provider', '''        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="%s"/>

        <provider''' % ADMOB_APP_ID)
    # full screen (no status or navigation bar), drawn under the camera cutout
    java = os.path.join(app, 'src', 'main', 'java')
    old = glob.glob(os.path.join(java, '**', 'MainActivity.java'), recursive=True)
    for f in old:
        os.remove(f)
    nd = os.path.join(java, *PKG.split('.'))
    os.makedirs(nd, exist_ok=True)
    open(os.path.join(nd, 'MainActivity.java'), 'w').write('''package %s;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/* Ay Yıldız: the game fills the whole screen; system bars come back for a moment with a swipe. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        hideBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    private void hideBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
''' % PKG)
    res = os.path.join(app, 'src', 'main', 'res')
    st = os.path.join(res, 'values', 'strings.xml')
    s = open(st, encoding='utf-8').read()
    s = re.sub(r'<string name="app_name">[^<]*</string>', '<string name="app_name">Ay Yıldız</string>', s)
    s = re.sub(r'<string name="title_activity_main">[^<]*</string>', '<string name="title_activity_main">Ay Yıldız</string>', s)
    open(st, 'w', encoding='utf-8').write(s)
    sty = os.path.join(res, 'values', 'styles.xml')
    sub(sty, '<item name="android:background">@null</item>', '<item name="android:background">@null</item>\n        <item name="android:windowBackground">@color/ayy_bg</item>')
    with open(os.path.join(res, 'values', 'ayy_colors.xml'), 'w') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ayy_bg">%s</color>\n</resources>\n' % BG)
    icons(res)
    print('Android projesi hazır: %s %s (kod %d), AdMob %s' % (PKG, v, code, 'DENEME' if '3940256099942544' in ADMOB_APP_ID else 'gerçek'))


def notlar(version):
    v = 'V' + version.strip().lstrip('V')
    txt = open(os.path.join(ROOT, 'CHANGELOG.md'), encoding='utf-8').read()
    m = re.search(r'^## ' + re.escape(v) + r' — [^\n]*?(?:· ([^\n]*))?\n(.*?)(?=^## |\Z)', txt, re.S | re.M)
    if not m:
        return '', []
    clean = lambda t: re.sub(r'\*\*|`', '', t).strip()
    items = [clean(l[2:]) for l in m.group(2).splitlines() if l.startswith('- ')]
    items = [i if len(i) <= 160 else i[:157].rsplit(' ', 1)[0] + '…' for i in items]
    return clean(m.group(1) or ''), items[:4]


def paket(version, url):
    import zipfile, json, hashlib
    v = version.strip().lstrip('V')
    out = os.path.join(ROOT, 'AyYildiz-www-%s.zip' % v)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for base, _, files in os.walk(WWW):
            for f in sorted(files):
                full = os.path.join(base, f)
                z.write(full, os.path.relpath(full, WWW))
    baslik, items = notlar(v)
    man = {'surum': 'V' + v, 'zip': url, 'boyut': os.path.getsize(out), 'enAzKod': EN_AZ_KOD,
           'sha256': hashlib.sha256(open(out, 'rb').read()).hexdigest(), 'baslik': baslik, 'notlar': items}
    with open(os.path.join(ROOT, 'guncelleme.json'), 'w', encoding='utf-8') as f:
        json.dump(man, f, ensure_ascii=False, indent=1)
    print('paket: %s (%.1f MB), guncelleme.json: %s' % (os.path.basename(out), man['boyut'] / 1048576, baslik))


def test(adres):
    p = os.path.join(WWW, 'index.html')
    h = open(p, encoding='utf-8').read()
    inj = '<script>window.AYY_GUNCELLEME_ADRES=%s;window.AYY_GUNCELLEME_OTO=1;</script>\n' % json_str(adres)
    h = h.replace('<script src="capacitor.js"></script>', inj + '<script src="capacitor.js"></script>', 1)
    open(p, 'w', encoding='utf-8').write(h)
    print('deneme: güncelleme adresi', adres)


def deneme_json(zp, url, out):
    import json, hashlib
    json.dump({'surum': 'V99.0', 'zip': url, 'boyut': os.path.getsize(zp), 'enAzKod': 0,
               'sha256': hashlib.sha256(open(zp, 'rb').read()).hexdigest(), 'baslik': 'Deneme güncellemesi',
               'notlar': ['Emülatör denemesi']}, open(out, 'w', encoding='utf-8'), ensure_ascii=False)


def json_str(s):
    import json
    return json.dumps(s)


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('www', 'yerel', 'paket', 'test', 'deneme-json'):
        sys.exit(__doc__)
    if sys.argv[1] == 'www':
        www()
    elif sys.argv[1] == 'paket':
        paket(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == 'deneme-json':
        deneme_json(sys.argv[2], sys.argv[3], sys.argv[4])
    elif sys.argv[1] == 'test':
        test(sys.argv[2])
    else:
        yerel(sys.argv[2] if len(sys.argv) > 2 else open(os.path.join(ROOT, 'VERSION')).read())
