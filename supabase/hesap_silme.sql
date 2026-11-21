-- Ay Yıldız: Hedef Kızıl Elma — oyuncunun kendi hesabını tamamen silmesi (V2.52; V2.57'de tam silme; Google Play şartı)
-- Supabase → SQL Editor → New query → bu dosyanın tamamını yapıştır → Run. Tekrar çalıştırmak güvenlidir.
-- Oyunda Profil → Hesap → "Hesabımı sil" bu işlevi çağırır. Yalnız giriş yapmış oyuncu, yalnız KENDİ hesabını silebilir:
-- bulut kaydı ve profil silinir, yönetici kayıtlarındaki adı boşaltılır, en son giriş hesabının kendisi (auth.users) silinir.
-- Buluttaki model dosyalarını oyun, bu işlevi çağırmadan önce depolama API'siyle siler.
-- Bu Supabase projesi yalnız oyuna aittir (V2.55'te Saha Takip artıkları kaldırıldı), başka uygulamanın verisi etkilenmez.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'giriş gerekli'; end if;
  update public.admin_log set admin = null where admin = uid;
  update public.announcements set created_by = null where created_by = uid;
  update public.content set updated_by = null where updated_by = uid;
  delete from public.saves where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
