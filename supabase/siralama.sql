-- V2.68 · Sıralama tabloları ve birlik yarışı
-- Haftalık TP (hafta Pazartesi 00:00 Türkiye saatinde başlar), yarış rekorları ve birliklerin haftalık toplamı.
-- Tablolara oyuncu doğrudan yazamaz: yazmak yalnız aşağıdaki işlevlerle (sınırlarla) olur. Okumak herkese açık
-- (yalnız çağrı adı, birlik, amblem ve puan; e-posta yok). Okuma işlevleri çağıranın yetkisiyle çalışır (security invoker).

create or replace function public.hafta_basi(t timestamptz default now()) returns date
language sql stable set search_path = public as $$ select date_trunc('week', t at time zone 'Europe/Istanbul')::date $$;

create table if not exists public.lb_hafta (
  user_id uuid not null references auth.users(id) on delete cascade,
  hafta date not null,
  unit text not null default 'hava',
  tp integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, hafta)
);
create index if not exists lb_hafta_sira on public.lb_hafta (hafta, tp desc);
alter table public.lb_hafta enable row level security;
drop policy if exists "haftalık okuma" on public.lb_hafta;
create policy "haftalık okuma" on public.lb_hafta for select using (true);

create table if not exists public.lb_yaris (
  user_id uuid not null references auth.users(id) on delete cascade,
  yaris text not null,
  ms integer not null,
  ucak text,
  at timestamptz not null default now(),
  primary key (user_id, yaris)
);
create index if not exists lb_yaris_sira on public.lb_yaris (yaris, ms);
alter table public.lb_yaris enable row level security;
drop policy if exists "yarış okuma" on public.lb_yaris;
create policy "yarış okuma" on public.lb_yaris for select using (true);

-- TP ekle: çağrı başına en çok 1500, haftada en çok 100 000. Birlik haftanın ilk kaydındaki birlik (hafta ortasında
-- birlik değiştirip puanı taşımak olmasın).
create or replace function public.lb_tp_ekle(n integer) returns integer
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u text; b boolean; r integer;
begin
  if uid is null then raise exception 'giriş gerekli'; end if;
  if n is null or n <= 0 then return 0; end if;
  select unit, banned into u, b from profiles where id = uid;
  if not found or b then return 0; end if;
  insert into lb_hafta (user_id, hafta, unit, tp) values (uid, hafta_basi(), coalesce(u,'hava'), least(n,1500))
  on conflict (user_id, hafta) do update set tp = least(lb_hafta.tp + least(n,1500), 100000), updated_at = now()
  returning tp into r;
  return r;
end $$;

-- Yarış rekoru: yalnız daha iyi süre kaydedilir; 5 sn – 1 saat arası.
create or replace function public.lb_yaris_kaydet(y text, sure integer, uc text default null) returns integer
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); b boolean; r integer;
begin
  if uid is null then raise exception 'giriş gerekli'; end if;
  if y is null or y !~ '^r_[a-z0-9_]{1,30}$' or sure is null or sure < 5000 or sure > 3600000 then return null; end if;
  select banned into b from profiles where id = uid;
  if not found or b then return null; end if;
  insert into lb_yaris (user_id, yaris, ms, ucak) values (uid, y, sure, left(uc,24))
  on conflict (user_id, yaris) do update set ms = excluded.ms, ucak = excluded.ucak, at = now() where excluded.ms < lb_yaris.ms;
  select ms into r from lb_yaris where user_id = uid and yaris = y;
  return r;
end $$;

-- Haftalık liste (sıra numarasıyla); h boşsa bu hafta.
create or replace function public.lb_hafta_liste(h date default null, lim integer default 50)
returns table (sira bigint, user_id uuid, callsign text, unit text, emblem text, rank integer, tp integer)
language sql stable security invoker set search_path = public as $$
  select rank() over (order by l.tp desc), l.user_id, p.callsign, l.unit, p.emblem, p.rank, l.tp
  from lb_hafta l join profiles p on p.id = l.user_id
  where l.hafta = coalesce(h, hafta_basi()) and not p.banned and l.tp > 0
  order by l.tp desc limit least(coalesce(lim,50),100) $$;

-- Tüm zamanlar (toplam TP).
create or replace function public.lb_genel_liste(lim integer default 50)
returns table (sira bigint, user_id uuid, callsign text, unit text, emblem text, rank integer, tp integer)
language sql stable security invoker set search_path = public as $$
  select rank() over (order by p.xp desc), p.id, p.callsign, p.unit, p.emblem, p.rank, p.xp
  from profiles p where not p.banned and coalesce(p.xp,0) > 0
  order by p.xp desc limit least(coalesce(lim,50),100) $$;

-- Bir yarışın en iyi süreleri.
create or replace function public.lb_yaris_liste(y text, lim integer default 20)
returns table (sira bigint, user_id uuid, callsign text, unit text, emblem text, ms integer, ucak text)
language sql stable security invoker set search_path = public as $$
  select rank() over (order by l.ms), l.user_id, p.callsign, p.unit, p.emblem, l.ms, l.ucak
  from lb_yaris l join profiles p on p.id = l.user_id
  where l.yaris = y and not p.banned
  order by l.ms limit least(coalesce(lim,20),100) $$;

-- Benim yerim: bu hafta, tüm zamanlar.
create or replace function public.lb_benim()
returns table (hafta date, hafta_sira bigint, hafta_tp integer, genel_sira bigint, genel_tp integer, unit text)
language sql stable security invoker set search_path = public as $$
  with me as (select p.id, p.xp, p.unit from profiles p where p.id = auth.uid()),
       w as (select l.tp, l.unit from lb_hafta l, me where l.user_id = me.id and l.hafta = hafta_basi())
  select hafta_basi(),
    case when (select tp from w) > 0 then (select count(*)+1 from lb_hafta l join profiles p on p.id=l.user_id where l.hafta = hafta_basi() and not p.banned and l.tp > (select tp from w)) end,
    coalesce((select tp from w),0),
    case when (select xp from me) > 0 then (select count(*)+1 from profiles p where not p.banned and p.xp > (select xp from me)) end,
    coalesce((select xp from me),0),
    coalesce((select unit from w),(select unit from me))
$$;

-- Birlik yarışı: haftanın birlik toplamları.
create or replace function public.lb_birlik(h date default null)
returns table (unit text, tp bigint, oyuncu bigint)
language sql stable security invoker set search_path = public as $$
  select l.unit, sum(l.tp), count(*) from lb_hafta l join profiles p on p.id = l.user_id
  where l.hafta = coalesce(h, hafta_basi()) and not p.banned and l.tp > 0
  group by l.unit $$;

grant execute on function public.hafta_basi(timestamptz), public.lb_hafta_liste(date,integer), public.lb_genel_liste(integer),
  public.lb_yaris_liste(text,integer), public.lb_birlik(date) to anon, authenticated;
grant execute on function public.lb_tp_ekle(integer), public.lb_yaris_kaydet(text,integer,text), public.lb_benim() to authenticated;
revoke execute on function public.lb_tp_ekle(integer), public.lb_yaris_kaydet(text,integer,text), public.lb_benim() from public, anon;
