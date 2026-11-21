-- Ay Yıldız: Hedef Kızıl Elma — oyuncunun kendi oyun hesabını silmesi (V2.52, V2.54'te güvenli hâle getirildi; Google Play şartı)
-- Supabase → SQL Editor → New query → bu dosyanın tamamını yapıştır → Run. Tekrar çalıştırmak güvenlidir.
-- Oyunda Profil → Hesap → "Hesabımı sil" bu işlevi çağırır. Yalnız giriş yapmış oyuncu, yalnız KENDİ verisini silebilir.
-- V2.54: Bu Supabase projesi başka bir uygulamayla (Saha Takip) paylaşılıyor; giriş hesabı (auth.users) silinseydi o
-- uygulamanın bütün verisi de zincirleme silinirdi. Bu yüzden işlev yalnız OYUNUN verisini siler: profil ve bulut kaydı.
-- Buluttaki model dosyalarını oyun, bu işlevi çağırmadan önce depolama API'siyle siler.
-- Giriş bilgisi (e-posta ve şifre) diğer uygulama için yerinde kalır.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'giriş gerekli'; end if;
  delete from public.saves where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
