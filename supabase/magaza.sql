-- V2.61 Mağaza: oyuncunun sahip olduğu ürünler (kaplama paketi, reklamsız, destekçi).
-- Oyuncu yalnız kendi satırlarını OKUR; yazma yalnız yönetici (deneme) ya da sunucu (V2.63'te Google Play doğrulaması) yapar.
create table if not exists public.entitlements (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product    text not null check (product ~ '^[a-z0-9_]{2,40}$'),
  source     text not null default 'play' check (source in ('play','yonetici','hediye')),
  created_at timestamptz not null default now(),
  primary key (user_id, product)
);
alter table public.entitlements enable row level security;
drop policy if exists "urun okuma" on public.entitlements;
create policy "urun okuma" on public.entitlements for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "urun yonetici ekleme" on public.entitlements;
create policy "urun yonetici ekleme" on public.entitlements for insert to authenticated with check (public.is_admin());
drop policy if exists "urun yonetici silme" on public.entitlements;
create policy "urun yonetici silme" on public.entitlements for delete to authenticated using (public.is_admin());
grant select, insert, delete on public.entitlements to authenticated;
