-- V2.70 · Filolar (oyuncu grupları)
-- Bir oyuncu en çok bir filoda olur; filo en çok 30 pilot. Roller: komutan, yardımcı, pilot.
-- Okuma herkese açık (filo adı, etiketi, arması, açıklaması, üyelerin çağrı adı ve puanı); başvurular yalnız başvurana
-- ve o filonun komutan/yardımcılarına görünür. Yazma yalnız aşağıdaki işlevlerle. Önce siralama.sql kurulmuş olmalı.

create table if not exists public.filolar (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  etiket text not null,
  amblem text not null default 'hilal',
  aciklama text not null default '',
  duyuru text not null default '',
  acik boolean not null default true,
  komutan uuid references auth.users(id) on delete set null,
  kurulus timestamptz not null default now()
);
create unique index if not exists filolar_ad on public.filolar (lower(ad));
create unique index if not exists filolar_etiket on public.filolar (upper(etiket));
alter table public.filolar enable row level security;
drop policy if exists "filo okuma" on public.filolar;
create policy "filo okuma" on public.filolar for select using (true);

create table if not exists public.filo_uyeler (
  user_id uuid primary key references auth.users(id) on delete cascade,
  filo_id uuid not null references public.filolar(id) on delete cascade,
  rol text not null default 'pilot' check (rol in ('komutan','yardimci','pilot')),
  katilma timestamptz not null default now()
);
create index if not exists filo_uyeler_filo on public.filo_uyeler (filo_id);
alter table public.filo_uyeler enable row level security;
drop policy if exists "üye okuma" on public.filo_uyeler;
create policy "üye okuma" on public.filo_uyeler for select using (true);

create table if not exists public.filo_basvuru (
  user_id uuid not null references auth.users(id) on delete cascade,
  filo_id uuid not null references public.filolar(id) on delete cascade,
  at timestamptz not null default now(),
  primary key (user_id, filo_id)
);
alter table public.filo_basvuru enable row level security;
drop policy if exists "başvuru okuma" on public.filo_basvuru;
create policy "başvuru okuma" on public.filo_basvuru for select to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.filo_uyeler u where u.user_id = auth.uid() and u.filo_id = filo_basvuru.filo_id and u.rol in ('komutan','yardimci')));

-- haftalık filo katkısı: bir pilotun o filodayken kazandığı TP
create table if not exists public.lb_filo_hafta (
  filo_id uuid not null references public.filolar(id) on delete cascade,
  hafta date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  tp integer not null default 0,
  primary key (filo_id, hafta, user_id)
);
create index if not exists lb_filo_hafta_h on public.lb_filo_hafta (hafta, filo_id);
alter table public.lb_filo_hafta enable row level security;
drop policy if exists "filo haftalık okuma" on public.lb_filo_hafta;
create policy "filo haftalık okuma" on public.lb_filo_hafta for select using (true);

-- yardımcılar
create or replace function public.filo_benim_rol(f uuid) returns text
language sql stable security definer set search_path = public as $$
  select rol from filo_uyeler where user_id = auth.uid() and filo_id = f $$;
create or replace function public.filo_sayi(f uuid) returns integer
language sql stable security definer set search_path = public as $$ select count(*)::int from filo_uyeler where filo_id = f $$;

-- kur: Teğmen (rütbe 6) ve üstü; ad 3–24, etiket 2–4 harf/rakam
create or replace function public.filo_kur(ad text, etiket text, amblem text default 'hilal', aciklama text default '', acik boolean default true) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r integer; b boolean; f uuid;
begin
  if uid is null then raise exception 'giriş gerekli'; end if;
  select rank, banned into r, b from profiles where id = uid;
  if not found or b then raise exception 'profil yok'; end if;
  if coalesce(r,0) < 6 then raise exception 'filo kurmak için en az Teğmen rütbesi gerekli'; end if;
  if exists (select 1 from filo_uyeler where user_id = uid) then raise exception 'zaten bir filodasın'; end if;
  ad := btrim(regexp_replace(ad, '\s+', ' ', 'g')); etiket := upper(btrim(etiket));
  if char_length(ad) < 3 or char_length(ad) > 24 or ad !~ '^[[:alnum:] .''-]+$' then raise exception 'filo adı 3–24 harf olmalı'; end if;
  if etiket !~ '^[[:alnum:]]{2,4}$' then raise exception 'etiket 2–4 harf ya da rakam olmalı'; end if;
  if exists (select 1 from filolar where lower(filolar.ad) = lower(filo_kur.ad)) then raise exception 'bu ad alınmış'; end if;
  if exists (select 1 from filolar where upper(filolar.etiket) = filo_kur.etiket) then raise exception 'bu etiket alınmış'; end if;
  insert into filolar (ad, etiket, amblem, aciklama, acik, komutan) values (ad, etiket, left(coalesce(amblem,'hilal'),24), left(coalesce(aciklama,''),200), coalesce(acik,true), uid) returning id into f;
  insert into filo_uyeler (user_id, filo_id, rol) values (uid, f, 'komutan');
  delete from filo_basvuru where user_id = uid;
  return f;
end $$;

-- katıl: açık filoya doğrudan, kapalıya başvuru
create or replace function public.filo_katil(f uuid) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a boolean; b boolean;
begin
  if uid is null then raise exception 'giriş gerekli'; end if;
  select banned into b from profiles where id = uid; if not found or b then raise exception 'profil yok'; end if;
  if exists (select 1 from filo_uyeler where user_id = uid) then raise exception 'zaten bir filodasın'; end if;
  select acik into a from filolar where id = f; if not found then raise exception 'filo yok'; end if;
  if filo_sayi(f) >= 30 then return 'dolu'; end if;
  if a then insert into filo_uyeler (user_id, filo_id) values (uid, f); delete from filo_basvuru where user_id = uid; return 'uye'; end if;
  if (select count(*) from filo_basvuru where user_id = uid) >= 3 then raise exception 'en çok 3 filoya birden başvurabilirsin'; end if;
  insert into filo_basvuru (user_id, filo_id) values (uid, f) on conflict do nothing; return 'basvuru';
end $$;

create or replace function public.filo_basvuru_geri(f uuid) returns void
language sql security definer set search_path = public as $$ delete from filo_basvuru where user_id = auth.uid() and filo_id = f $$;

-- ayrıl: komutan ayrılırsa komutanlık en eski yardımcıya, yoksa en eski pilota geçer; kimse kalmazsa filo silinir
create or replace function public.filo_ayril() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); f uuid; r text; n uuid;
begin
  select filo_id, rol into f, r from filo_uyeler where user_id = uid; if not found then return; end if;
  delete from filo_uyeler where user_id = uid;
  if r = 'komutan' then
    select user_id into n from filo_uyeler where filo_id = f order by (rol = 'yardimci') desc, katilma limit 1;
    if n is null then delete from filolar where id = f;
    else update filo_uyeler set rol = 'komutan' where user_id = n; update filolar set komutan = n where id = f; end if;
  end if;
end $$;

create or replace function public.filo_basvuru_karar(u uuid, kabul boolean) returns text
language plpgsql security definer set search_path = public as $$
declare f uuid; r text;
begin
  select filo_id, rol into f, r from filo_uyeler where user_id = auth.uid();
  if r is null or r not in ('komutan','yardimci') then raise exception 'yetki yok'; end if;
  if not exists (select 1 from filo_basvuru where user_id = u and filo_id = f) then return 'yok'; end if;
  delete from filo_basvuru where user_id = u and filo_id = f;
  if not kabul then return 'red'; end if;
  if exists (select 1 from filo_uyeler where user_id = u) then return 'baska'; end if;
  if filo_sayi(f) >= 30 then return 'dolu'; end if;
  insert into filo_uyeler (user_id, filo_id) values (u, f); delete from filo_basvuru where user_id = u;
  return 'uye';
end $$;

-- çıkar: komutan herkesi, yardımcı pilotları
create or replace function public.filo_cikar(u uuid) returns void
language plpgsql security definer set search_path = public as $$
declare f uuid; r text; hr text;
begin
  select filo_id, rol into f, r from filo_uyeler where user_id = auth.uid();
  select rol into hr from filo_uyeler where user_id = u and filo_id = f;
  if hr is null or u = auth.uid() then raise exception 'üye yok'; end if;
  if not (r = 'komutan' or (r = 'yardimci' and hr = 'pilot')) then raise exception 'yetki yok'; end if;
  delete from filo_uyeler where user_id = u;
end $$;

-- rol: yalnız komutan; 'komutan' vermek komutanlığı devreder (eski komutan yardımcı olur)
create or replace function public.filo_rol(u uuid, rol_ text) returns void
language plpgsql security definer set search_path = public as $$
declare f uuid; r text;
begin
  select filo_id, rol into f, r from filo_uyeler where user_id = auth.uid();
  if r is distinct from 'komutan' then raise exception 'yetki yok'; end if;
  if u = auth.uid() or not exists (select 1 from filo_uyeler where user_id = u and filo_id = f) then raise exception 'üye yok'; end if;
  if rol_ = 'komutan' then
    update filo_uyeler set rol = 'yardimci' where user_id = auth.uid();
    update filo_uyeler set rol = 'komutan' where user_id = u; update filolar set komutan = u where id = f;
  elsif rol_ in ('yardimci','pilot') then update filo_uyeler set rol = rol_ where user_id = u;
  else raise exception 'rol yok'; end if;
end $$;

create or replace function public.filo_duzenle(aciklama_ text, duyuru_ text, acik_ boolean, amblem_ text) returns void
language plpgsql security definer set search_path = public as $$
declare f uuid; r text;
begin
  select filo_id, rol into f, r from filo_uyeler where user_id = auth.uid();
  if r is null or r not in ('komutan','yardimci') then raise exception 'yetki yok'; end if;
  update filolar set aciklama = left(coalesce(aciklama_, aciklama),200), duyuru = left(coalesce(duyuru_, duyuru),200),
    acik = coalesce(acik_, acik), amblem = left(coalesce(amblem_, amblem),24) where id = f;
end $$;

-- yönetici: uygunsuz filoyu sil
create or replace function public.filo_sil(f uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'yetki yok'; end if;
  delete from filolar where id = f;
  insert into admin_log (admin, action, target) values (auth.uid(), 'filo_sil', f::text);
end $$;

-- TP eklenince filo katkısına da yazılır
create or replace function public.lb_tp_ekle(n integer) returns integer
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u text; b boolean; r integer; f uuid; k integer;
begin
  if uid is null then raise exception 'giriş gerekli'; end if;
  if n is null or n <= 0 then return 0; end if;
  select unit, banned into u, b from profiles where id = uid;
  if not found or b then return 0; end if;
  k := least(n,1500);
  insert into lb_hafta (user_id, hafta, unit, tp) values (uid, hafta_basi(), coalesce(u,'hava'), k)
  on conflict (user_id, hafta) do update set tp = least(lb_hafta.tp + k, 100000), updated_at = now()
  returning tp into r;
  select filo_id into f from filo_uyeler where user_id = uid;
  if f is not null then
    insert into lb_filo_hafta (filo_id, hafta, user_id, tp) values (f, hafta_basi(), uid, k)
    on conflict (filo_id, hafta, user_id) do update set tp = least(lb_filo_hafta.tp + k, 100000);
  end if;
  return r;
end $$;

-- listeler (çağıranın yetkisiyle)
create or replace function public.filo_liste(q text default null, lim integer default 30, h date default null)
returns table (sira bigint, id uuid, ad text, etiket text, amblem text, aciklama text, acik boolean, uye integer, tp bigint)
language sql stable security invoker set search_path = public as $$
  with t as (select filo_id, sum(tp) tp from lb_filo_hafta where hafta = coalesce(h, hafta_basi()) group by filo_id),
       m as (select filo_id, count(*)::int n from filo_uyeler group by filo_id)
  select rank() over (order by coalesce(t.tp,0) desc), f.id, f.ad, f.etiket, f.amblem, f.aciklama, f.acik, coalesce(m.n,0), coalesce(t.tp,0)
  from filolar f left join t on t.filo_id = f.id left join m on m.filo_id = f.id
  where q is null or q = '' or f.ad ilike '%'||q||'%' or f.etiket ilike q||'%'
  order by coalesce(t.tp,0) desc, f.kurulus limit least(coalesce(lim,30),100) $$;

create or replace function public.filo_uyeleri(f uuid)
returns table (user_id uuid, callsign text, unit text, emblem text, rank integer, rol text, katilma timestamptz, tp integer)
language sql stable security invoker set search_path = public as $$
  select u.user_id, p.callsign, p.unit, p.emblem, p.rank, u.rol, u.katilma, coalesce(l.tp,0)
  from filo_uyeler u join profiles p on p.id = u.user_id
  left join lb_filo_hafta l on l.filo_id = u.filo_id and l.user_id = u.user_id and l.hafta = hafta_basi()
  where u.filo_id = f order by (u.rol='komutan') desc, (u.rol='yardimci') desc, coalesce(l.tp,0) desc $$;

create or replace function public.filo_basvurular()
returns table (user_id uuid, callsign text, unit text, emblem text, rank integer, at timestamptz)
language sql stable security invoker set search_path = public as $$
  select b.user_id, p.callsign, p.unit, p.emblem, p.rank, b.at from filo_basvuru b join profiles p on p.id = b.user_id
  where b.filo_id = (select filo_id from filo_uyeler where user_id = auth.uid() and rol in ('komutan','yardimci')) order by b.at $$;

-- sıralama listeleri filo etiketiyle (yeni adlar; eski uygulamalar eski işlevleri kullanmaya devam eder)
create or replace function public.lb_hafta_liste2(h date default null, lim integer default 50)
returns table (sira bigint, user_id uuid, callsign text, unit text, emblem text, rank integer, tp integer, etiket text)
language sql stable security invoker set search_path = public as $$
  select rank() over (order by l.tp desc), l.user_id, p.callsign, l.unit, p.emblem, p.rank, l.tp, f.etiket
  from lb_hafta l join profiles p on p.id = l.user_id left join filo_uyeler u on u.user_id = l.user_id left join filolar f on f.id = u.filo_id
  where l.hafta = coalesce(h, hafta_basi()) and not p.banned and l.tp > 0
  order by l.tp desc limit least(coalesce(lim,50),100) $$;
create or replace function public.lb_genel_liste2(lim integer default 50)
returns table (sira bigint, user_id uuid, callsign text, unit text, emblem text, rank integer, tp integer, etiket text)
language sql stable security invoker set search_path = public as $$
  select rank() over (order by p.xp desc), p.id, p.callsign, p.unit, p.emblem, p.rank, p.xp, f.etiket
  from profiles p left join filo_uyeler u on u.user_id = p.id left join filolar f on f.id = u.filo_id
  where not p.banned and coalesce(p.xp,0) > 0
  order by p.xp desc limit least(coalesce(lim,50),100) $$;
create or replace function public.lb_yaris_liste2(y text, lim integer default 20)
returns table (sira bigint, user_id uuid, callsign text, unit text, emblem text, ms integer, ucak text, etiket text)
language sql stable security invoker set search_path = public as $$
  select rank() over (order by l.ms), l.user_id, p.callsign, p.unit, p.emblem, l.ms, l.ucak, f.etiket
  from lb_yaris l join profiles p on p.id = l.user_id left join filo_uyeler u on u.user_id = l.user_id left join filolar f on f.id = u.filo_id
  where l.yaris = y and not p.banned
  order by l.ms limit least(coalesce(lim,20),100) $$;

grant execute on function public.filo_liste(text,integer,date), public.filo_uyeleri(uuid), public.lb_hafta_liste2(date,integer),
  public.lb_genel_liste2(integer), public.lb_yaris_liste2(text,integer) to anon, authenticated;
grant execute on function public.filo_kur(text,text,text,text,boolean), public.filo_katil(uuid), public.filo_basvuru_geri(uuid), public.filo_ayril(),
  public.filo_basvuru_karar(uuid,boolean), public.filo_cikar(uuid), public.filo_rol(uuid,text), public.filo_duzenle(text,text,boolean,text),
  public.filo_sil(uuid), public.filo_basvurular() to authenticated;
revoke execute on function public.filo_kur(text,text,text,text,boolean), public.filo_katil(uuid), public.filo_basvuru_geri(uuid), public.filo_ayril(),
  public.filo_basvuru_karar(uuid,boolean), public.filo_cikar(uuid), public.filo_rol(uuid,text), public.filo_duzenle(text,text,boolean,text),
  public.filo_sil(uuid), public.filo_basvurular(), public.filo_benim_rol(uuid), public.filo_sayi(uuid) from public, anon;

-- hesap silinince önce filodan ayrılır (komutanlık devredilir)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'giriş gerekli'; end if;
  perform public.filo_ayril();
  update public.admin_log set admin = null where admin = uid;
  update public.announcements set created_by = null where created_by = uid;
  update public.content set updated_by = null where updated_by = uid;
  delete from public.saves where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end $$;
