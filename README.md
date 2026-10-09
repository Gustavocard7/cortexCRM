# Cortex CRM 🧠

Sistema CRM Web completo, funcional e profissional desenvolvido para a **Cortex**, construído com **React 18**, **TypeScript**, **Tailwind CSS** e preparado para integração com **Supabase** (PostgreSQL, Auth e Row Level Security).

---

## 🌟 Regra de Ouro da Cortex

> **Nenhuma lead fica sem próxima ação definida.**
>
> O sistema enforça essa regra de forma irrestrita:
> 1. **No Frontend:** Validação nos formulários de cadastro e edição de leads.
> 2. **Na Camada de Negócio:** Tratamento e bloqueio com exceção caso `next_action_date` ou `next_action_description` estejam vazios.
> 3. **No Banco de Dados:** Triggers e constraints PostgreSQL `NOT NULL`.
> 4. **No Dashboard e Kanban:** Alertas visuais imediatos para ações vencidas ou agendadas para o dia.

---

## 🚀 Funcionalidades & Páginas

1. **Visão Geral (Dashboard):** KPIs em tempo real (leads ativos, taxa de conversão, pipeline total, faturamento), gráficos de evolução de vendas e funil, timeline de atividades e cards de alerta da Regra de Ouro.
2. **Funil de Vendas (Kanban):** Drag & drop completo entre estágios com somatório financeiro por coluna e alertas visuais de prazo.
3. **Leads:** Gestão comercial com busca instantânea, status comercial (Ativo, Ganho, Perdido) e próxima ação obrigatória.
4. **Acompanhamentos (Follow-ups):** Filtragem por Hoje, Atrasados, Próximos 7 Dias e Todos, com priorização e agendamento contínuo.
5. **Demonstrações:** Agendamento de demos técnicas com link de videoconferência, duração e registro de feedbacks.
6. **Propostas:** Elaboração de propostas comerciais com envio, aceitação, rejeição e conversão em contrato.
7. **Vendas e Financeiro:** Receita líquida, receita recorrente (MRR), ticket médio, distribuição por modalidade de pagamento (PIX, transferência) e histórico.
8. **Desempenho Comercial:** Ranking de vendedores com pódio (Ouro, Prata, Bronze), taxa de conversão individual e receita gerada.
9. **Configurações:** Edição de perfil do usuário, gestão de equipe e **personalização total dos estágios do funil** (nome, cor e ordem).

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 18, TypeScript, Vite
- **Estilo:** Tailwind CSS com tema escuro profissional customizado (`cortex-*`, `dark-*`)
- **Visualização de Dados:** Recharts
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Ícones:** Lucide React
- **Banco de Dados & Autenticação:** Supabase (PostgreSQL + RLS + Auth) com motor local resiliente sincronizado em tempo real

---

## 💻 Como Rodar o Projeto

### Pré-requisitos
- Node.js 18+ instalado

### Instalação & Execução
```bash
# Instalar dependências
pnpm install # ou npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Ou rodar o servidor de produção
node serve.cjs
```
Acesse no navegador: `http://localhost:3000` (ou `http://localhost:5173` no modo Vite).

---

## 🗄️ Integração com Supabase

1. Copie o arquivo de variáveis de ambiente:
```bash
cp .env.example .env
```
2. Preencha as credenciais do seu projeto Supabase no arquivo `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```
3. Execute o script SQL contido em `supabase/migrations/001_initial_schema.sql` no **SQL Editor** do seu dashboard Supabase para provisionar todas as tabelas, triggers e permissões de segurança RLS.

---

## 👤 Acesso Administrador

- **Perfil:** Administrador Cortex
- **E-mail padrão:** `adm@cortex.com`
- **Senha padrão:** `cortex123` (ou acesso rápido com 1 clique na tela de login)
