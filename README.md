# 💚 Lala Finance

> Sistema acadêmico de Open Finance — Protótipo funcional com Firebase

---

## 📌 Objetivo

O **Lala Finance** é uma aplicação de banco digital desenvolvida como projeto acadêmico de Open Finance. O sistema possui um dashboard financeiro completo integrado ao **Firebase (Authentication e Firestore)** para persistência de dados real, e está preparado para conexão simulada e futura integração com APIs de bancos externos de outros grupos.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Uso |
|---|---|
| HTML5 semântico | Estrutura das páginas |
| CSS3 puro | Estilo, animações e responsividade (Tema escuro inspirado no Spotify) |
| JavaScript (ES6 Modules) | Lógica, navegação e integração de dados |
| Firebase Auth (NPM) | Autenticação (Login, Cadastro e Sessão) |
| Firebase Firestore (NPM) | Banco de dados NoSQL (Usuários, Transações, Contas, Conexões) |

**Sem frameworks (React, Angular), sem bibliotecas externas (Bootstrap, Tailwind).**

---

## ⚙️ Como configurar o Firebase

Para que o projeto funcione localmente com banco de dados real, você deve configurar o seu Firebase:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Crie um novo projeto (ex: `Lala Finance`).
3. Ative o **Authentication** com provedor de **E-mail/Senha**.
4. Ative o **Firestore Database** em modo de teste.
5. Adicione um App Web nas configurações do projeto para obter suas chaves.
6. Abra o arquivo **`src/firebase-config.js`** no repositório.
7. Substitua os valores `"COLE_AQUI"` na constante `firebaseConfig` pelas suas credenciais reais.

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEUDOMINIO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  // ...
};
```

---

## 🚀 Como executar localmente

O projeto agora utiliza o **Vite** como ferramenta de build e servidor de desenvolvimento local, além de usar pacotes NPM.

1. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2. Clone ou baixe o repositório.
3. Abra a pasta `/LALA-FINACE` no seu terminal.
4. Instale as dependências:
   ```bash
   npm install
   ```
5. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
6. Acesse o endereço local exibido no terminal (geralmente `http://localhost:3000`).

Outros comandos úteis:
- `npm run build`: Gera a versão otimizada para produção.
- `npm run preview`: Testa a versão de produção localmente.

---

## ✅ Funcionalidades Implementadas

- **Autenticação Real**: Login, Cadastro (com validações de senha) e Logout via Firebase Auth.
- **Sessão Persistente**: O usuário continua logado ao recarregar a página (`onAuthStateChanged`).
- **Banco de Dados Real**: Leitura e gravação no Firestore para:
  - Dados do Usuário (score, renda, limite, dívida, saldo total).
  - Contas bancárias.
  - Histórico de Transações.
  - Conexões Open Finance.
- **Dashboard Dinâmico**: Os cards, saldo e movimentações recentes buscam dados em tempo real do Firestore.
- **Operações Financeiras**: Depósito, Pix, Pagamento de Dívida e Empréstimo, atualizando saldos e gerando registro de transação.
- **Relatórios**: Geração de totais e gráfico simples baseados nas transações reais efetuadas no mês.

---

## 🔄 Open Finance (Simulado)

O sistema possui um fluxo de **Open Finance** que simula a conexão com bancos parceiros:

1. Modal de consentimento detalhando o compartilhamento de dados.
2. Aprovação grava uma nova "Conexão" e uma "Conta" no Firestore.
3. Importação simulada adiciona saldo à conta conectada, injeta uma transação de entrada e eleva o Score do usuário.
4. O código já possui marcações (`// FUTURA INTEGRAÇÃO`) indicando onde as APIs REST reais dos bancos parceiros devem ser chamadas.

---

## 📁 Estrutura de arquivos

```
lala-finance/
├── index.html            → Estrutura HTML
├── package.json          → Dependências (Vite, Firebase) e Scripts
├── vite.config.js        → Configuração do Vite
├── README.md             → Este arquivo
└── src/
    ├── main.js           → Lógica principal (Auth, Firestore, UI)
    ├── style.css         → Estilos da aplicação (identidade visual)
    └── firebase-config.js→ Inicialização do Firebase
```
