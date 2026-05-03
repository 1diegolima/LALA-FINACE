# 💚 Lala Finance

> Sistema acadêmico de Open Finance — Protótipo funcional

---

## 📌 Objetivo

O **Lala Finance** é um protótipo de banco digital desenvolvido como projeto acadêmico de Open Finance. O sistema simula um dashboard financeiro completo e está preparado para futura integração com Firebase e com APIs de bancos externos de outros grupos.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Uso |
|---|---|
| HTML5 semântico | Estrutura das páginas |
| CSS3 puro | Estilo, animações e responsividade |
| JavaScript puro (ES6+) | Lógica, navegação e dados simulados |
| Firebase *(futuro)* | Autenticação, banco de dados e hosting |

**Sem frameworks, sem bibliotecas externas.**

---

## 🚀 Como abrir o projeto no navegador

1. Clone ou baixe o repositório
2. Abra a pasta `/lala-finance` no seu explorador de arquivos
3. Dê dois cliques em **`index.html`**
4. O projeto abrirá diretamente no seu navegador padrão

> Não é necessário servidor local, build ou instalação de dependências.

---

## ✅ Funcionalidades simuladas (dados fictícios)

- [x] Login e cadastro de usuário (dados em memória)
- [x] Dashboard com saldo consolidado e resumo financeiro
- [x] Lista de transações com filtros por tipo, banco e data
- [x] Adição manual de transações
- [x] Tela "Meus Bancos" com status dos bancos conectados
- [x] Relatórios mensais com gráfico de barras em HTML/CSS/JS
- [x] Tela de Configurações com dados do usuário
- [x] Logout e navegação entre telas via JavaScript

---

## 🔮 Funcionalidades futuras com Firebase

| Funcionalidade | Módulo Firebase |
|---|---|
| Login e cadastro reais | Firebase Authentication |
| Persistência de transações | Firestore Database |
| Armazenamento de perfil | Firestore Database |
| Deploy online | Firebase Hosting |
| Regras de segurança | Firestore Security Rules |

O arquivo **`firebase-config.js`** já está estruturado e comentado para receber as credenciais do projeto quando o Firebase for integrado.

---

## 🔗 Integração futura com APIs de Bancos Externos

O sistema está preparado para se conectar com **2 bancos externos** desenvolvidos por outros grupos do projeto acadêmico.

### Onde as integrações serão feitas

**No arquivo `script.js`:**

```javascript
// FUTURA INTEGRAÇÃO: aqui será feita a chamada para a API do Banco Externo 1
// FUTURA INTEGRAÇÃO: aqui será feita a chamada para a API do Banco Externo 2
```

### Fluxo planejado

```
Lala Finance ──── (OAuth/API REST) ──── Banco Externo 1
Lala Finance ──── (OAuth/API REST) ──── Banco Externo 2
```

1. O usuário clica em "Conectar banco" na tela **Meus Bancos**
2. O sistema redireciona para autenticação OAuth do banco parceiro
3. Após autorização, os dados são trazidos via API e exibidos no dashboard consolidado

---

## 📁 Estrutura de arquivos

```
lala-finance/
├── index.html          → Estrutura HTML de todas as telas
├── style.css           → Todos os estilos organizados por seção
├── script.js           → Toda a lógica, dados simulados e funções
├── firebase-config.js  → Reservado para configuração do Firebase
└── README.md           → Este arquivo
```

---

## 👤 Usuário de teste

```
Email: lala@email.com
Senha: 123456
```

*(Ou crie uma nova conta pela tela de Cadastro — os dados ficam em memória durante a sessão)*

---

## 📚 Projeto Acadêmico — Open Finance

Este projeto faz parte de um ecossistema acadêmico com 3 bancos digitais:

| Banco | Status |
|---|---|
| **Lala Finance** | ✅ Desenvolvido |
| Banco Externo 1 | 🔄 Em desenvolvimento (outro grupo) |
| Banco Externo 2 | 🔄 Em desenvolvimento (outro grupo) |
