// ESTADOS GLOBAIS
let usuarioAtual = null;
let bancosMock = [
  { id: 1, nome: "Lala Finance", saldo: 2500.50, status: "Conectado", icone: "💚" },
  { id: 2, nome: "DeasBank (Parceiro)", saldo: null, status: "Em desenvolvimento", icone: "🏦" },
  { id: 3, nome: "Banco Externo 2", saldo: null, status: "Em desenvolvimento", icone: "🏦" }
];
let transacoesMock = [
  { id: 1, descricao: "Salário", valor: 3500.00, tipo: "entrada", banco: "Lala Finance", data: "2026-05-01", status: "Concluída" },
  { id: 2, descricao: "Mercado", valor: 450.75, tipo: "saida", banco: "Lala Finance", data: "2026-05-02", status: "Concluída" }
];
let dadosUsuarioMock = { divida: 1200.00, limite: 5000.00, score: 650, renda: 5000.00 };

// UTILITÁRIOS
const formatarMoeda = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarData = d => d.split('-').reverse().join('/');
function mostrarMensagem(texto, tipo = 'sucesso') {
  const not = document.getElementById('notificacao');
  not.className = `notificacao ${tipo}`;
  not.textContent = texto;
  not.classList.remove('oculto');
  setTimeout(() => not.classList.add('oculto'), 3000);
}

// NAVEGAÇÃO
function mostrarTela(idTela) {
  document.querySelectorAll('.tela, .layout-app').forEach(el => el.classList.remove('ativa'));
  if (idTela === 'layout-app') {
    document.getElementById('layout-app').classList.add('ativa');
    document.getElementById('layout-app').classList.remove('oculto');
    carregarUsuario();
    mostrarTelaInterna('tela-dashboard');
  } else {
    document.getElementById('layout-app').classList.add('oculto');
    document.getElementById(idTela).classList.add('ativa');
  }
}

function mostrarTelaInterna(idTelaInterna) {
  document.querySelectorAll('.tela-interna').forEach(el => el.classList.remove('ativa'));
  document.getElementById(idTelaInterna).classList.add('ativa');
  document.querySelectorAll('.nav-item, .nav-item-mobile').forEach(el => {
    el.classList.remove('ativa');
    if (el.dataset.tela === idTelaInterna) el.classList.add('ativa');
  });
  if(idTelaInterna === 'tela-dashboard') carregarDashboard();
  if(idTelaInterna === 'tela-bancos') carregarBancos();
  if(idTelaInterna === 'tela-transacoes') carregarTransacoes();
  if(idTelaInterna === 'tela-relatorios') gerarRelatorio();
}

document.querySelectorAll('.nav-item, .nav-item-mobile').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); mostrarTelaInterna(e.currentTarget.dataset.tela); });
});

// AUTH
document.getElementById('form-login').addEventListener('submit', e => {
  e.preventDefault();
  usuarioAtual = { nome: "Usuário", email: document.getElementById('login-email').value, cpf: "123.456.789-00", iniciais: "U" };
  mostrarMensagem("Login simulado com sucesso!");
  mostrarTela('layout-app');
});
document.getElementById('link-cadastro').addEventListener('click', e => { e.preventDefault(); mostrarTela('tela-cadastro'); });
document.getElementById('link-voltar-login').addEventListener('click', e => { e.preventDefault(); mostrarTela('tela-login'); });
const logout = () => { usuarioAtual = null; mostrarTela('tela-login'); mostrarMensagem('Sessão encerrada', 'aviso'); };
document.getElementById('btn-logout-sidebar').addEventListener('click', logout);
document.getElementById('btn-logout-topbar').addEventListener('click', logout);
document.getElementById('btn-logout-config').addEventListener('click', logout);

// CARREGAR USUARIO & DASHBOARD
function carregarUsuario() {
  document.getElementById('sidebar-nome').textContent = usuarioAtual.nome;
  document.getElementById('config-nome').textContent = usuarioAtual.nome;
  document.getElementById('config-email').textContent = usuarioAtual.email;
  document.getElementById('config-cpf').textContent = `CPF: ${usuarioAtual.cpf}`;
  document.getElementById('saudacao').textContent = `Olá, ${usuarioAtual.nome} 👋`;
}

function atualizarSaldoTotal() {
  const saldoTotal = bancosMock.filter(b => b.status === "Conectado").reduce((acc, curr) => acc + (curr.saldo || 0), 0);
  document.getElementById('saldo-total').textContent = formatarMoeda(saldoTotal);
  return saldoTotal;
}

function carregarDashboard() {
  let entradas = 0, saidas = 0;
  const mesAtual = new Date().toISOString().slice(0, 7);
  transacoesMock.forEach(t => {
    if (t.data.startsWith(mesAtual)) {
      if (['entrada', 'deposito', 'emprestimo'].includes(t.tipo)) entradas += t.valor;
      if (['saida', 'pix', 'divida'].includes(t.tipo)) saidas += t.valor;
    }
  });

  atualizarSaldoTotal();
  document.getElementById('card-receitas').textContent = formatarMoeda(entradas);
  document.getElementById('card-despesas').textContent = formatarMoeda(saidas);
  document.getElementById('card-divida').textContent = formatarMoeda(dadosUsuarioMock.divida);
  document.getElementById('card-limite').textContent = formatarMoeda(dadosUsuarioMock.limite);

  // Score
  const scorePerc = (dadosUsuarioMock.score / 1000) * 100;
  document.getElementById('score-fill').style.width = `${scorePerc}%`;
  document.getElementById('score-text-val').textContent = dadosUsuarioMock.score;

  // Lista
  const lista = document.getElementById('lista-transacoes-dashboard');
  lista.innerHTML = '';
  transacoesMock.slice(-3).reverse().forEach(t => {
    const isEntrada = ['entrada', 'deposito', 'emprestimo'].includes(t.tipo);
    lista.innerHTML += `<li class="transacao-item">
      <div><strong>${t.descricao}</strong><br><small>${t.banco}</small></div>
      <div class="transacao-valor ${isEntrada ? 'valor-entrada' : 'valor-saida'}">${isEntrada ? '+' : '-'} ${formatarMoeda(t.valor)}</div>
    </li>`;
  });
}

// OPERAÇÕES
document.getElementById('form-deposito').addEventListener('submit', e => {
  e.preventDefault();
  const valor = parseFloat(document.getElementById('op-dep-valor').value);
  transacoesMock.push({ id: Date.now(), descricao: "Depósito Manual", valor, tipo: "deposito", banco: "Lala Finance", data: new Date().toISOString().slice(0, 10), status: "Concluída" });
  bancosMock[0].saldo += valor;
  mostrarMensagem(`Depósito de ${formatarMoeda(valor)} realizado.`);
  document.getElementById('form-deposito').reset();
});

document.getElementById('form-pix').addEventListener('submit', e => {
  e.preventDefault();
  const valor = parseFloat(document.getElementById('op-pix-valor').value);
  if(valor > bancosMock[0].saldo) return mostrarMensagem("Saldo insuficiente", "erro");
  transacoesMock.push({ id: Date.now(), descricao: "Pix Enviado", valor, tipo: "pix", banco: "Lala Finance", data: new Date().toISOString().slice(0, 10), status: "Concluída" });
  bancosMock[0].saldo -= valor;
  mostrarMensagem(`Pix de ${formatarMoeda(valor)} enviado.`);
  document.getElementById('form-pix').reset();
});

document.getElementById('form-pagar-divida').addEventListener('submit', e => {
  e.preventDefault();
  const valor = parseFloat(document.getElementById('op-div-valor').value);
  if(valor > bancosMock[0].saldo) return mostrarMensagem("Saldo insuficiente", "erro");
  transacoesMock.push({ id: Date.now(), descricao: "Pagamento de Dívida", valor, tipo: "divida", banco: "Lala Finance", data: new Date().toISOString().slice(0, 10), status: "Concluída" });
  bancosMock[0].saldo -= valor;
  dadosUsuarioMock.divida -= valor;
  if(dadosUsuarioMock.divida < 0) dadosUsuarioMock.divida = 0;
  dadosUsuarioMock.score += 15; // Aumenta score ao pagar
  mostrarMensagem(`Dívida paga: ${formatarMoeda(valor)}.`);
  document.getElementById('form-pagar-divida').reset();
});

document.getElementById('form-emprestimo').addEventListener('submit', e => {
  e.preventDefault();
  const valor = parseFloat(document.getElementById('op-emp-valor').value);
  if(dadosUsuarioMock.score < 500) return mostrarMensagem("Score baixo para empréstimo", "erro");
  transacoesMock.push({ id: Date.now(), descricao: "Empréstimo Aprovado", valor, tipo: "emprestimo", banco: "Lala Finance", data: new Date().toISOString().slice(0, 10), status: "Concluída" });
  bancosMock[0].saldo += valor;
  dadosUsuarioMock.divida += valor;
  mostrarMensagem(`Empréstimo de ${formatarMoeda(valor)} aprovado!`);
  document.getElementById('form-emprestimo').reset();
});

// OPEN FINANCE
let bancoAConectar = null;
function carregarBancos() {
  const container = document.getElementById('lista-bancos');
  container.innerHTML = '';
  bancosMock.forEach(banco => {
    const isConectado = banco.status === "Conectado";
    container.innerHTML += `
      <div class="banco-card">
        <div style="display:flex; justify-content:space-between">
          <h3>${banco.icone} ${banco.nome}</h3>
          <span class="badge-status ${isConectado ? 'conectado' : 'pendente'}">${banco.status}</span>
        </div>
        <div>
          <small>Saldo</small><br>
          <strong>${isConectado ? formatarMoeda(banco.saldo) : '---'}</strong>
        </div>
        ${!isConectado 
          ? `<button class="btn btn-primario" onclick="abrirConsentimento(${banco.id})">Conectar</button>` 
          : `<button class="btn btn-secundario">Ver Detalhes</button>`}
      </div>`;
  });
}

function abrirConsentimento(id) {
  bancoAConectar = id;
  document.getElementById('modal-consentimento').classList.remove('oculto');
  document.getElementById('check-consentimento').checked = false;
  document.getElementById('btn-autorizar-conexao').disabled = true;
}

document.getElementById('check-consentimento').addEventListener('change', e => {
  document.getElementById('btn-autorizar-conexao').disabled = !e.target.checked;
});
document.getElementById('btn-fechar-consentimento').addEventListener('click', () => document.getElementById('modal-consentimento').classList.add('oculto'));
document.getElementById('btn-cancelar-consentimento').addEventListener('click', () => document.getElementById('modal-consentimento').classList.add('oculto'));

document.getElementById('btn-autorizar-conexao').addEventListener('click', () => {
  const banco = bancosMock.find(b => b.id === bancoAConectar);
  banco.status = "Conectado";
  banco.saldo = 0; // Inicia zerado, aguardando portabilidade
  document.getElementById('modal-consentimento').classList.add('oculto');
  mostrarMensagem(`${banco.nome} conectado com sucesso!`);
  carregarBancos();
});

document.getElementById('btn-importar-dados').addEventListener('click', () => {
  const conectados = bancosMock.filter(b => b.status === "Conectado" && b.id !== 1);
  if(conectados.length === 0) return mostrarMensagem("Nenhum banco parceiro conectado", "erro");
  conectados[0].saldo = 3200.00;
  dadosUsuarioMock.score += 50; // Aumenta score pelo open finance
  mostrarMensagem("Dados importados com sucesso!");
  carregarBancos();
});

// TRANSAÇÕES
document.getElementById('btn-nova-transacao').addEventListener('click', () => document.getElementById('modal-transacao').classList.remove('oculto'));
document.getElementById('btn-fechar-modal').addEventListener('click', () => document.getElementById('modal-transacao').classList.add('oculto'));
document.getElementById('btn-cancelar-modal').addEventListener('click', () => document.getElementById('modal-transacao').classList.add('oculto'));

document.getElementById('form-transacao').addEventListener('submit', e => {
  e.preventDefault();
  const valor = parseFloat(document.getElementById('t-valor').value);
  const tipo = document.getElementById('t-tipo').value;
  transacoesMock.push({
    id: Date.now(), descricao: document.getElementById('t-descricao').value, valor, tipo,
    banco: document.getElementById('t-banco').value, data: document.getElementById('t-data').value, status: "Concluída"
  });
  if(['entrada', 'deposito', 'emprestimo'].includes(tipo)) bancosMock[0].saldo += valor;
  if(['saida', 'pix', 'divida'].includes(tipo)) bancosMock[0].saldo -= valor;
  document.getElementById('modal-transacao').classList.add('oculto');
  mostrarMensagem("Transação manual adicionada");
  document.getElementById('form-transacao').reset();
  carregarTransacoes();
});

function carregarTransacoes() {
  const tipo = document.getElementById('filtro-tipo').value;
  let filtradas = [...transacoesMock];
  if (tipo) filtradas = filtradas.filter(t => t.tipo === tipo);
  filtradas.sort((a, b) => new Date(b.data) - new Date(a.data));

  const lista = document.getElementById('lista-transacoes-principal');
  lista.innerHTML = '';
  filtradas.forEach(t => {
    const isEntrada = ['entrada', 'deposito', 'emprestimo'].includes(t.tipo);
    lista.innerHTML += `<li class="transacao-item">
      <div><strong>${t.descricao}</strong> <span class="badge-trans-status">${t.status}</span><br><small>${t.banco} • ${formatarData(t.data)}</small></div>
      <div class="transacao-valor ${isEntrada ? 'valor-entrada' : 'valor-saida'}">${isEntrada ? '+' : '-'} ${formatarMoeda(t.valor)}</div>
    </li>`;
  });
}
document.getElementById('btn-filtrar').addEventListener('click', carregarTransacoes);

// RELATORIOS
function gerarRelatorio() {
  let entradas = 0, saidas = 0;
  const mesAtual = document.getElementById('relatorio-mes').value || new Date().toISOString().slice(0, 7);
  document.getElementById('relatorio-mes').value = mesAtual;
  
  transacoesMock.forEach(t => {
    if (t.data.startsWith(mesAtual)) {
      if (['entrada', 'deposito', 'emprestimo'].includes(t.tipo)) entradas += t.valor;
      if (['saida', 'pix', 'divida'].includes(t.tipo)) saidas += t.valor;
    }
  });
  document.getElementById('rel-entradas').textContent = formatarMoeda(entradas);
  document.getElementById('rel-saidas').textContent = formatarMoeda(saidas);
  document.getElementById('rel-saldo').textContent = formatarMoeda(entradas - saidas);
  
  // Gráfico simples simulação
  const container = document.getElementById('grafico-relatorio');
  container.innerHTML = `
    <div class="barra-container"><div class="barra" style="height: ${entradas > 0 ? 100 : 0}%; background-color: #1DB954;"></div><span class="barra-label">Entradas</span></div>
    <div class="barra-container"><div class="barra" style="height: ${saidas > 0 ? (saidas/entradas)*100 : 0}%; background-color: #e22134;"></div><span class="barra-label">Saídas</span></div>
  `;
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => mostrarTela('tela-login'));
