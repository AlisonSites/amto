-- =====================================================================
-- AMTO - Associação Macauense de Taekwondo
-- Schema completo do banco de dados (Supabase / PostgreSQL)
-- Execute este arquivo inteiro no SQL Editor do painel do Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSÕES
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 2. TABELAS
-- ---------------------------------------------------------------------

create table if not exists public.unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.faixas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ordem int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null unique,
  faixa_id uuid references public.faixas(id) on delete set null,
  login text not null unique,
  senha text,              -- campo transitório: nunca persiste em texto puro (ver trigger hash_senha)
  senha_hash text not null,
  unidade_id uuid references public.unidades(id) on delete restrict,
  perfil text not null check (perfil in ('admin', 'professor')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  foto_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
  foto_url text,
  nome_completo text not null,
  data_nascimento date not null,
  cpf text not null unique,
  rg text,
  nome_pai text,
  nome_mae text,
  primeiro_contato text not null,
  segundo_contato text,
  data_inicio date not null default current_date,
  responsavel_financeiro boolean not null default false,
  unidade_id uuid not null references public.unidades(id) on delete restrict,
  faixa_id uuid references public.faixas(id) on delete set null,
  login text not null unique,
  senha text,               -- campo transitório: nunca persiste em texto puro (ver trigger hash_senha)
  senha_hash text not null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now()
);

create table if not exists public.exames (
  id uuid primary key default gen_random_uuid(),
  data_exame date not null,
  descricao text,
  created_at timestamptz not null default now()
);

create table if not exists public.exame_inscricoes (
  id uuid primary key default gen_random_uuid(),
  exame_id uuid not null references public.exames(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  faixa_atual_id uuid references public.faixas(id) on delete set null,
  unidade_id uuid references public.unidades(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (exame_id, aluno_id)
);

-- Índices para as buscas e joins mais comuns
create index if not exists idx_usuarios_unidade on public.usuarios(unidade_id);
create index if not exists idx_usuarios_faixa on public.usuarios(faixa_id);
create index if not exists idx_alunos_unidade on public.alunos(unidade_id);
create index if not exists idx_alunos_faixa on public.alunos(faixa_id);
create index if not exists idx_exame_inscricoes_exame on public.exame_inscricoes(exame_id);
create index if not exists idx_exame_inscricoes_aluno on public.exame_inscricoes(aluno_id);

-- ---------------------------------------------------------------------
-- 3. AUTENTICAÇÃO CUSTOMIZADA (login/senha em tabela própria)
-- ---------------------------------------------------------------------
-- Esta aplicação NÃO usa o sistema de Auth nativo do Supabase (auth.users),
-- pois o cadastro pede campos literais "login" e "senha" nas tabelas de
-- negócio. Em vez disso, a senha é hasheada com bcrypt (pgcrypto) antes de
-- ser salva, e o login é validado por uma função RPC. Veja o aviso de
-- segurança no README para detalhes sobre essa escolha.

create or replace function public.hash_senha()
returns trigger
language plpgsql
as $$
begin
  if NEW.senha is not null and NEW.senha <> '' then
    NEW.senha_hash := crypt(NEW.senha, gen_salt('bf'));
  end if;
  NEW.senha := null; -- nunca persiste a senha em texto puro
  return NEW;
end;
$$;

drop trigger if exists trg_hash_senha_usuarios on public.usuarios;
create trigger trg_hash_senha_usuarios
  before insert or update on public.usuarios
  for each row execute function public.hash_senha();

drop trigger if exists trg_hash_senha_alunos on public.alunos;
create trigger trg_hash_senha_alunos
  before insert or update on public.alunos
  for each row execute function public.hash_senha();

-- Função de login: recebe login + senha em texto puro, verifica contra o
-- hash salvo e retorna os dados da sessão (sem nunca expor o hash).
create or replace function public.fazer_login(p_login text, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario public.usuarios%rowtype;
  v_aluno public.alunos%rowtype;
begin
  select * into v_usuario from public.usuarios where login = p_login limit 1;
  if found then
    if v_usuario.status <> 'ativo' then
      return jsonb_build_object('sucesso', false, 'mensagem', 'Usuário inativo. Contate o administrador.');
    end if;
    if crypt(p_senha, v_usuario.senha_hash) = v_usuario.senha_hash then
      return jsonb_build_object(
        'sucesso', true,
        'tipo', v_usuario.perfil,
        'id', v_usuario.id,
        'nome', v_usuario.nome,
        'login', v_usuario.login,
        'unidade_id', v_usuario.unidade_id,
        'foto_url', v_usuario.foto_url,
        'faixa_id', v_usuario.faixa_id,
        'cpf', v_usuario.cpf
      );
    end if;
    return jsonb_build_object('sucesso', false, 'mensagem', 'Login ou senha inválidos.');
  end if;

  select * into v_aluno from public.alunos where login = p_login limit 1;
  if found then
    if v_aluno.status <> 'ativo' then
      return jsonb_build_object('sucesso', false, 'mensagem', 'Cadastro inativo. Contate sua unidade.');
    end if;
    if crypt(p_senha, v_aluno.senha_hash) = v_aluno.senha_hash then
      return jsonb_build_object(
        'sucesso', true,
        'tipo', 'aluno',
        'id', v_aluno.id,
        'nome', v_aluno.nome_completo,
        'login', v_aluno.login,
        'unidade_id', v_aluno.unidade_id,
        'foto_url', v_aluno.foto_url,
        'faixa_id', v_aluno.faixa_id,
        'cpf', v_aluno.cpf
      );
    end if;
    return jsonb_build_object('sucesso', false, 'mensagem', 'Login ou senha inválidos.');
  end if;

  return jsonb_build_object('sucesso', false, 'mensagem', 'Login ou senha inválidos.');
end;
$$;

grant execute on function public.fazer_login(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
-- Como a aplicação usa autenticação própria (não há JWT do Supabase com a
-- identidade do usuário), não é possível restringir linhas por usuário a
-- nível de banco. As políticas abaixo liberam o acesso ao papel "anon"
-- (usado pela chave anônima) e a separação de permissões por perfil
-- (admin/professor/aluno) é controlada na camada da aplicação React.
-- Os campos de senha são protegidos separadamente via GRANT de colunas
-- (seção 5), então mesmo com RLS permissivo o hash nunca é exposto.

alter table public.unidades enable row level security;
alter table public.faixas enable row level security;
alter table public.usuarios enable row level security;
alter table public.alunos enable row level security;
alter table public.exames enable row level security;
alter table public.exame_inscricoes enable row level security;

drop policy if exists unidades_acesso on public.unidades;
create policy unidades_acesso on public.unidades for all to anon using (true) with check (true);

drop policy if exists faixas_acesso on public.faixas;
create policy faixas_acesso on public.faixas for all to anon using (true) with check (true);

drop policy if exists usuarios_acesso on public.usuarios;
create policy usuarios_acesso on public.usuarios for all to anon using (true) with check (true);

drop policy if exists alunos_acesso on public.alunos;
create policy alunos_acesso on public.alunos for all to anon using (true) with check (true);

drop policy if exists exames_acesso on public.exames;
create policy exames_acesso on public.exames for all to anon using (true) with check (true);

drop policy if exists exame_inscricoes_acesso on public.exame_inscricoes;
create policy exame_inscricoes_acesso on public.exame_inscricoes for all to anon using (true) with check (true);

-- ---------------------------------------------------------------------
-- 5. PROTEÇÃO DE COLUNAS SENSÍVEIS (senha / senha_hash)
-- ---------------------------------------------------------------------
-- Revoga o acesso amplo padrão e concede apenas as colunas necessárias,
-- garantindo que "senha_hash" nunca possa ser lido via API por anon.

revoke all on public.usuarios from anon, authenticated;
grant select (id, nome, cpf, faixa_id, login, unidade_id, perfil, status, foto_url, created_at)
  on public.usuarios to anon, authenticated;
grant insert (nome, cpf, faixa_id, login, senha, unidade_id, perfil, status, foto_url)
  on public.usuarios to anon, authenticated;
grant update (nome, cpf, faixa_id, login, senha, unidade_id, perfil, status, foto_url)
  on public.usuarios to anon, authenticated;
grant delete on public.usuarios to anon, authenticated;

revoke all on public.alunos from anon, authenticated;
grant select (
  id, foto_url, nome_completo, data_nascimento, cpf, rg, nome_pai, nome_mae,
  primeiro_contato, segundo_contato, data_inicio, responsavel_financeiro,
  unidade_id, faixa_id, login, status, created_at
) on public.alunos to anon, authenticated;
grant insert (
  foto_url, nome_completo, data_nascimento, cpf, rg, nome_pai, nome_mae,
  primeiro_contato, segundo_contato, data_inicio, responsavel_financeiro,
  unidade_id, faixa_id, login, senha, status
) on public.alunos to anon, authenticated;
grant update (
  foto_url, nome_completo, data_nascimento, cpf, rg, nome_pai, nome_mae,
  primeiro_contato, segundo_contato, data_inicio, responsavel_financeiro,
  unidade_id, faixa_id, login, senha, status
) on public.alunos to anon, authenticated;
grant delete on public.alunos to anon, authenticated;

grant all on public.unidades to anon, authenticated;
grant all on public.faixas to anon, authenticated;
grant all on public.exames to anon, authenticated;
grant all on public.exame_inscricoes to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. STORAGE (bucket público "alunos" para fotos)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('alunos', 'alunos', true)
on conflict (id) do update set public = true;

drop policy if exists "amto_alunos_select" on storage.objects;
create policy "amto_alunos_select" on storage.objects
  for select using (bucket_id = 'alunos');

drop policy if exists "amto_alunos_insert" on storage.objects;
create policy "amto_alunos_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'alunos');

drop policy if exists "amto_alunos_update" on storage.objects;
create policy "amto_alunos_update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'alunos');

drop policy if exists "amto_alunos_delete" on storage.objects;
create policy "amto_alunos_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'alunos');

-- ---------------------------------------------------------------------
-- 7. DADOS INICIAIS (seed)
-- ---------------------------------------------------------------------

insert into public.faixas (nome, ordem) values
  ('Branca', 1),
  ('Amarela', 2),
  ('Amarela ponta verde', 3),
  ('Verde', 4),
  ('Verde ponta azul', 5),
  ('Azul', 6),
  ('Azul ponta vermelha', 7),
  ('Vermelha', 8),
  ('Vermelha ponta preta', 9),
  ('Preta', 10)
on conflict do nothing;

insert into public.unidades (nome, cidade) values
  ('Sede AMTO', 'Macau')
on conflict do nothing;

-- Usuário administrador padrão.
-- Login: admin   |   Senha: admin123
-- IMPORTANTE: altere esta senha no primeiro acesso (tela "Perfil").
insert into public.usuarios (nome, cpf, login, senha, perfil, status)
values ('Administrador AMTO', '00000000000', 'admin', 'admin123', 'admin', 'ativo')
on conflict (login) do nothing;

-- =====================================================================
-- FIM DO SCRIPT
-- =====================================================================
