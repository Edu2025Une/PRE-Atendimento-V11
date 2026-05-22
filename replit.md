# PRE-Atendimento V9 — Replit Execution Rules

## 🚫 REGRA PRINCIPAL (CRÍTICA)

Este projeto utiliza **EXCLUSIVAMENTE SUPABASE** como banco de dados.

QUALQUER tentativa de substituir isso está ERRADA.

---

## ❌ PROIBIDO (SEM EXCEÇÃO)

O Replit Agent NÃO PODE:

- usar Replit Database
- usar PostgreSQL interno do Replit
- instalar `postgresql-16`
- criar banco local (SQLite, Postgres local, etc)
- migrar banco para qualquer outro provider
- usar Prisma, Drizzle, Neon ou qualquer ORM alternativo
- criar fallback de banco
- criar mocks de banco de dados
- alterar estrutura de persistência
- alterar lógica de autenticação existente

Se tentar qualquer uma dessas ações → está incorreto.

---

## 🔐 VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS

O backend NÃO deve iniciar sem:

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_POSTGRES_URL
- SUPABASE_JWT_SECRET
- GLOBAL_API_KEY

### Regra:

Se faltar qualquer variável:

→ PARAR execução  
→ Mostrar erro claro  
→ NÃO criar fallback  
→ NÃO tentar corrigir automaticamente  

---

## 🧠 ARQUITETURA (NÃO ALTERAR)

Backend:
- Node.js + Express + TypeScript
- Arquivo principal: `src/server.ts`

Frontend:
- SPA servida pelo Express
- `public/index.html`
- `public/dashboard.html`

Banco:
- Supabase PostgreSQL (pooler)

API externa:
- Evolution GO
- URL configurada pelo administrador no painel (sem rota padrão)

---

## 🔒 SEGURANÇA (OBRIGATÓRIO)

Isolamento em duas camadas:

- `tenant_id`
- `created_by`

Regras:

- usuário comum → apenas seus dados
- admin → acesso total

Aplicado em:

- listagem
- criação
- status
- QR code
- connect
- disconnect
- delete
- purge

---

## 🗂 ESTRUTURA DO PROJETO

src/
  server.ts
  services/
    evolutionGo.ts
    instanceService.ts
    authService.ts
    supabase.ts
  db/
    migrate.ts
    migrations/

public/
  index.html
  dashboard.html

docs/
  evolution-go-endpoints.md

---

## ⚙️ EXECUÇÃO

Instalação:

pnpm install

Execução:

pnpm run dev

Porta obrigatória:

PORT=5000

---

## 🚨 COMPORTAMENTO DO AGENT

O Agent deve:

- NÃO alterar layout
- NÃO alterar frontend
- NÃO alterar rotas
- NÃO refatorar código
- NÃO instalar libs desnecessárias
- NÃO alterar `.replit`
- NÃO rodar migrations destrutivas
- NÃO inventar arquitetura

---

## 🔁 LÓGICA DE STATUS

Valores válidos:

- creating
- active
- connected
- inactive
- error

Regra:

APENAS `connected` = conectado

---

## 📡 EVOLUTION GO (REGRAS)

- create → usa GLOBAL_API_KEY
- connect → usa token da instância
- status → usa token da instância
- qr → polling

Importante:

- create usa `name`
- delete usa UUID
- QR retorna `Qrcode` e `Code`

---

## 🧪 DEBUG

Se houver erro:

NÃO:

- mudar banco
- criar fallback
- trocar provider
- alterar estrutura

FAZER:

1. mostrar erro
2. indicar variável faltante
3. aguardar instrução

---

## 🎯 OBJETIVO FINAL

Executar o projeto:

- com Supabase
- sem alterações estruturais
- sem substituições automáticas
- mantendo comportamento original

---

## Regras críticas de banco e autenticação

Este projeto NÃO deve migrar para PostgreSQL do Replit.

Arquitetura oficial do projeto:

- Banco principal: Supabase PostgreSQL
- Autenticação: Supabase Auth
- Backend: Node.js / Express
- Configurações da Evolution API: salvas por tenant no Supabase

É proibido:

- Migrar banco do Supabase para Replit PostgreSQL
- Usar PostgreSQL interno do Replit
- Ativar módulo postgresql do Replit
- Criar DATABASE_URL do Replit
- Substituir Supabase Auth por autenticação própria
- Remover Supabase Auth
- Rodar migrations contra banco local do Replit
- Criar tabelas locais no Replit
- Alterar login, cadastro ou reset de senha para banco local

Variáveis obrigatórias:

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- PUBLIC_APP_URL

Migrations:

- Devem rodar somente contra o Supabase
- Devem usar SUPABASE_SERVICE_ROLE_KEY
- Nunca usar DATABASE_URL do Replit

Deploy no Replit:

- Não aceitar sugestão automática de migração para Replit PostgreSQL
- Não executar plano automático com "Migrate the database from Supabase to Replit's PostgreSQL"
- Não alterar o auth service para banco local
- Apenas ajustar workflow/deploy para iniciar o app Node.js corretamente

Resultado esperado:

- Projeto sobe pelo GitHub no Replit
- Continua usando Supabase como fonte única de verdade
- Nenhum banco local do Replit é criado
- Auth continua Supabase Auth
- Evolution API continua usando configuração por tenant salva no Supabase
