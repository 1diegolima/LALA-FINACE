import './style.css';
import { auth, db, dbAmigo } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, addDoc, serverTimestamp, orderBy } from "firebase/firestore";

// ESTADOS GLOBAIS
let usuarioAtual = null;
let bancosUsuario = [];
let transacoesUsuario = [];
let dadosUsuario = null;

// UTILITÁRIOS
const formatarMoeda = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarData = d => {
  if(!d) return '';
  if(d.seconds) d = new Date(d.seconds * 1000).toISOString().split('T')[0];
  return d.split('-').reverse().join('/');
};
function mostrarMensagem(texto, tipo = 'sucesso') {
  const not = document.getElementById('notificacao');
  not.className = `notificacao ${tipo}`;
  not.textContent = texto;
  not.classList.remove('oculto');
  setTimeout(() => not.classList.add('oculto'), 3000);
}

// NAVEGAÇÃO
window.mostrarTela = function(idTela) {
  document.querySelectorAll('.tela, .layout-app').forEach(el => el.classList.remove('ativa'));
  if (idTela === 'layout-app') {
    document.getElementById('layout-app').classList.add('ativa');
    document.getElementById('layout-app').classList.remove('oculto');
    if(dadosUsuario) mostrarTelaInterna('tela-dashboard');
  } else {
    document.getElementById('layout-app').classList.add('oculto');
    document.getElementById(idTela).classList.add('ativa');
  }
};
const mostrarTela = window.mostrarTela;

function mostrarTelaInterna(idTelaInterna) {
  document.querySelectorAll('.tela-interna').forEach(el => el.classList.remove('ativa'));
  document.getElementById(idTelaInterna).classList.add('ativa');
  document.querySelectorAll('.nav-item, .nav-item-mobile').forEach(el => {
    el.classList.remove('ativa');
    if (el.dataset.tela === idTelaInterna) el.classList.add('ativa');
  });
  if(idTelaInterna === 'tela-dashboard') carregarDashboard();
  if(idTelaInterna === 'tela-bancos') carregarBancos();
  if(idTelaInterna === 'tela-transacoes') carregarTransacoesUI();
  if(idTelaInterna === 'tela-relatorios') gerarRelatorio();
}
window.mostrarTelaInterna = mostrarTelaInterna;

document.querySelectorAll('.nav-item, .nav-item-mobile').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); mostrarTelaInterna(e.currentTarget.dataset.tela); });
});

// AUTH
window.fazerLogin = async function(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('emailLogin').value;
  const senha = document.getElementById('senhaLogin').value;
  console.log("Login iniciado");
  try {
    const btn = document.getElementById('btn-entrar');
    if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    console.log("Usuário autenticado:", credencial.user.uid);
    mostrarMensagem("Login realizado com sucesso!");
    document.getElementById('form-login').reset();
  } catch (error) {
    mostrarMensagem("Erro ao fazer login. Verifique suas credenciais.", 'erro');
    console.error(error);
  } finally {
    const btn = document.getElementById('btn-entrar');
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
  }
};
document.getElementById('form-login').addEventListener('submit', window.fazerLogin);

window.cadastrarUsuario = async function(e) {
  if (e) e.preventDefault();
  const nome = document.getElementById('nomeCadastro').value;
  const cpf = document.getElementById('cpfCadastro').value;
  const email = document.getElementById('emailCadastro').value;
  const senha = document.getElementById('senhaCadastro').value;
  const senhaConfirma = document.getElementById('confirmarSenhaCadastro').value;

  if (senha.length < 6) return mostrarMensagem("A senha deve ter no mínimo 6 caracteres.", "erro");
  if (senha !== senhaConfirma) return mostrarMensagem("As senhas não coincidem.", "erro");

  try {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    const uid = credencial.user.uid;

    const userRef = doc(db, "users", uid);
    const novoUser = {
      uid, nome, cpf, email,
      rendaMensal: 2500, score: 720, limite: 1200, divida: 0, saldo: 0,
      createdAt: serverTimestamp()
    };
    await setDoc(userRef, novoUser);

    const accountRef = doc(collection(db, "accounts"));
    await setDoc(accountRef, {
      userId: uid, bankId: "lala-finance", bankName: "Lala Finance",
      saldo: 0, status: "Conectado", createdAt: serverTimestamp()
    });

    const connRef = doc(collection(db, "connections"));
    await setDoc(connRef, {
      userId: uid, bankId: "lala-finance", bankName: "Lala Finance",
      status: "Conectado", consentimento: true, connectedAt: serverTimestamp()
    });

    await signOut(auth);
    mostrarMensagem("Cadastro realizado com sucesso! Faça login para continuar.");
    document.getElementById('form-cadastro').reset();
    mostrarTela('tela-login');
  } catch (error) {
    mostrarMensagem(error.message, "erro");
    console.error(error);
  }
};
document.getElementById('form-cadastro').addEventListener('submit', window.cadastrarUsuario);

document.getElementById('link-cadastro').addEventListener('click', e => { e.preventDefault(); mostrarTela('tela-cadastro'); });
document.getElementById('link-voltar-login').addEventListener('click', e => { e.preventDefault(); mostrarTela('tela-login'); });

window.fazerLogout = async function() {
  try {
    await signOut(auth);
    usuarioAtual = null; dadosUsuario = null; bancosUsuario = []; transacoesUsuario = [];
    mostrarTela('tela-login');
    mostrarMensagem('Sessão encerrada', 'aviso');
  } catch(e) { mostrarMensagem("Erro ao sair", "erro"); }
};
const realizarLogout = window.fazerLogout;
document.getElementById('btn-logout-sidebar').addEventListener('click', realizarLogout);
document.getElementById('btn-logout-topbar').addEventListener('click', realizarLogout);
document.getElementById('btn-logout-config').addEventListener('click', realizarLogout);

// OBSERVAR SESSÃO
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      usuarioAtual = user;
      console.log("Carregando dashboard para", user.uid);
      await carregarDadosCompletos(user.uid);
      mostrarTela('layout-app');
      mostrarTelaInterna('tela-dashboard');
    } catch (err) {
      console.error("Erro crítico ao carregar perfil:", err);
      mostrarMensagem("Erro interno ao carregar perfil.", "erro");
      await signOut(auth); // Força saída em caso de dados corrompidos
    }
  } else {
    usuarioAtual = null;
    mostrarTela('tela-login');
  }
});

// CARREGAMENTO DO FIRESTORE
async function carregarDadosCompletos(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if(userSnap.exists()) {
    dadosUsuario = userSnap.data();
  } else {
    // Documento básico caso não exista
    const novoUser = {
      uid, nome: usuarioAtual.email.split('@')[0], cpf: "000.000.000-00", email: usuarioAtual.email,
      rendaMensal: 2500, score: 720, limite: 1200, divida: 0, saldo: 0,
      createdAt: serverTimestamp()
    };
    await setDoc(userRef, novoUser);
    dadosUsuario = novoUser;
  }

  const qAccounts = query(collection(db, "accounts"), where("userId", "==", uid));
  const accountsSnap = await getDocs(qAccounts);
  bancosUsuario = [];
  accountsSnap.forEach(d => bancosUsuario.push({ id: d.id, ...d.data() }));

  const bancosDisponiveis = [
    { bankId: "banco-amigo", bankName: "ConexBank", icone: "🏦" }
  ];
  bancosDisponiveis.forEach(bd => {
    if(!bancosUsuario.find(b => b.bankId === bd.bankId)) {
      bancosUsuario.push({ ...bd, saldo: null, status: "Disponível" });
    }
  });

  const qTrans = query(collection(db, "transactions"), where("userId", "==", uid));
  const transSnap = await getDocs(qTrans);
  transacoesUsuario = [];
  transSnap.forEach(d => transacoesUsuario.push({ id: d.id, ...d.data() }));
  
  transacoesUsuario.sort((a, b) => {
    const tA = a.createdAt?.seconds || 0;
    const tB = b.createdAt?.seconds || 0;
    return tB - tA;
  });

  atualizarUIUsuario();
}

function atualizarUIUsuario() {
  if(!dadosUsuario) return;
  const nome = dadosUsuario.nome || (usuarioAtual && usuarioAtual.email ? usuarioAtual.email.split('@')[0] : 'Usuário');
  document.getElementById('sidebar-nome').textContent = nome;
  document.getElementById('config-nome').textContent = nome;
  document.getElementById('config-email').textContent = dadosUsuario.email || '';
  document.getElementById('config-cpf').textContent = `CPF: ${dadosUsuario.cpf || ''}`;
  document.getElementById('config-renda').textContent = `Renda Mensal: ${formatarMoeda(dadosUsuario.rendaMensal)}`;
  document.getElementById('saudacao').textContent = `Olá, ${nome.split(' ')[0]} 👋`;
}

async function atualizarSaldoDoUsuario(valorParaSomarAoSaldo, valorParaSomarADivida = 0) {
  const novoSaldo = dadosUsuario.saldo + valorParaSomarAoSaldo;
  const novaDivida = Math.max(0, dadosUsuario.divida + valorParaSomarADivida);
  await updateDoc(doc(db, "users", usuarioAtual.uid), { saldo: novoSaldo, divida: novaDivida });
  dadosUsuario.saldo = novoSaldo;
  dadosUsuario.divida = novaDivida;
  
  const contaLala = bancosUsuario.find(b => b.bankId === "lala-finance");
  if(contaLala && contaLala.id) {
    await updateDoc(doc(db, "accounts", contaLala.id), { saldo: novoSaldo });
    contaLala.saldo = novoSaldo;
  }
}

function carregarDashboard() {
  if(!dadosUsuario) return;
  let entradas = 0, saidas = 0;
  const mesAtual = new Date().toISOString().slice(0, 7);
  transacoesUsuario.forEach(t => {
    if (t.data && t.data.startsWith(mesAtual)) {
      if (['entrada', 'deposito', 'emprestimo'].includes(t.tipo)) entradas += t.valor;
      if (['saida', 'pix', 'divida', 'transferencia'].includes(t.tipo)) saidas += t.valor;
    }
  });

  document.getElementById('saldo-total').textContent = formatarMoeda(dadosUsuario.saldo);
  document.getElementById('card-receitas').textContent = formatarMoeda(entradas);
  document.getElementById('card-despesas').textContent = formatarMoeda(saidas);
  document.getElementById('card-divida').textContent = formatarMoeda(dadosUsuario.divida);
  document.getElementById('card-limite').textContent = formatarMoeda(dadosUsuario.limite);

  const scorePerc = (dadosUsuario.score / 1000) * 100;
  document.getElementById('score-fill').style.width = `${scorePerc}%`;
  document.getElementById('score-text-val').textContent = dadosUsuario.score;

  const lista = document.getElementById('lista-transacoes-dashboard');
  lista.innerHTML = '';
  transacoesUsuario.slice(0, 3).forEach(t => {
    const isEntrada = ['entrada', 'deposito', 'emprestimo'].includes(t.tipo);
    lista.innerHTML += `<li class="transacao-item">
      <div><strong>${t.descricao}</strong><br><small>${t.bankName || 'Lala Finance'}</small></div>
      <div class="transacao-valor ${isEntrada ? 'valor-entrada' : 'valor-saida'}">${isEntrada ? '+' : '-'} ${formatarMoeda(t.valor)}</div>
    </li>`;
  });
}

// OPERAÇÕES
async function criarTransacao(descricao, valor, tipo, categoria = "Geral") {
  const obj = {
    userId: usuarioAtual.uid, bankId: "lala-finance", bankName: "Lala Finance",
    descricao, valor, tipo, categoria, data: new Date().toISOString().slice(0, 10),
    status: "Concluída", createdAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, "transactions"), obj);
  transacoesUsuario.unshift({ id: docRef.id, ...obj });
}

window.realizarDeposito = async function(e) {
  if (e) e.preventDefault();
  const valor = parseFloat(document.getElementById('op-dep-valor').value);
  if(valor <= 0) return mostrarMensagem("Valor inválido", "erro");
  
  await criarTransacao("Depósito Manual", valor, "deposito");
  await atualizarSaldoDoUsuario(valor);
  mostrarMensagem(`Depósito de ${formatarMoeda(valor)} realizado.`);
  document.getElementById('form-deposito').reset();
  carregarDashboard();
};
document.getElementById('form-deposito').addEventListener('submit', window.realizarDeposito);

window.realizarPix = async function(e) {
  if (e) e.preventDefault();
  const valor = parseFloat(document.getElementById('op-pix-valor').value);
  if(valor <= 0) return mostrarMensagem("Valor inválido", "erro");
  if(valor > dadosUsuario.saldo) return mostrarMensagem("Saldo insuficiente", "erro");

  await criarTransacao("Pix Enviado", valor, "pix");
  await atualizarSaldoDoUsuario(-valor);
  mostrarMensagem(`Pix de ${formatarMoeda(valor)} enviado.`);
  document.getElementById('form-pix').reset();
  carregarDashboard();
};
document.getElementById('form-pix').addEventListener('submit', window.realizarPix);

window.pagarDivida = async function(e) {
  if (e) e.preventDefault();
  const valor = parseFloat(document.getElementById('op-div-valor').value);
  if(valor <= 0) return mostrarMensagem("Valor inválido", "erro");
  if(valor > dadosUsuario.saldo) return mostrarMensagem("Saldo insuficiente", "erro");
  if(dadosUsuario.divida <= 0) return mostrarMensagem("Você não possui dívidas.", "erro");

  const valorPago = Math.min(valor, dadosUsuario.divida);
  await criarTransacao("Pagamento de Dívida", valorPago, "divida");
  await atualizarSaldoDoUsuario(-valorPago, -valorPago);
  mostrarMensagem(`Dívida paga: ${formatarMoeda(valorPago)}.`);
  document.getElementById('form-pagar-divida').reset();
  carregarDashboard();
};
document.getElementById('form-pagar-divida').addEventListener('submit', window.pagarDivida);

window.solicitarEmprestimo = async function(e) {
  if (e) e.preventDefault();
  const valor = parseFloat(document.getElementById('op-emp-valor').value);
  if(valor <= 0) return mostrarMensagem("Valor inválido", "erro");
  if(dadosUsuario.score < 500) return mostrarMensagem("Score baixo para empréstimo", "erro");

  await criarTransacao("Empréstimo Aprovado", valor, "emprestimo");
  await addDoc(collection(db, "loans"), {
    userId: usuarioAtual.uid, valor, parcelas: 12, status: "Aprovado", createdAt: serverTimestamp()
  });
  await atualizarSaldoDoUsuario(valor, valor);
  mostrarMensagem(`Empréstimo de ${formatarMoeda(valor)} aprovado!`);
  document.getElementById('form-emprestimo').reset();
  carregarDashboard();
};
document.getElementById('form-emprestimo').addEventListener('submit', window.solicitarEmprestimo);

// OPEN FINANCE
let bancoAConectar = null;
function carregarBancos() {
  const container = document.getElementById('lista-bancos');
  container.innerHTML = '';
  bancosUsuario.forEach(banco => {
    const isConectado = banco.status === "Conectado";
    const icone = banco.icone || "🏦";
    container.innerHTML += `
      <div class="banco-card">
        <div style="display:flex; justify-content:space-between">
          <h3>${icone} ${banco.bankName}</h3>
          <span class="badge-status ${isConectado ? 'conectado' : 'pendente'}">${banco.status}</span>
        </div>
        <div>
          <small>Saldo</small><br>
          <strong>${isConectado ? formatarMoeda(banco.saldo || 0) : '---'}</strong>
        </div>
        ${!isConectado 
          ? `<button class="btn btn-primario" onclick="abrirConsentimento('${banco.bankId}')">Conectar</button>` 
          : `<div style="display:flex; gap: 0.5rem; justify-content:flex-end;">
               <button class="btn btn-secundario" style="padding: 0.5rem 1rem;" onclick="abrirDetalhesBanco('${banco.bankId}')">Ver Detalhes</button>
               <button class="btn btn-perigo" style="padding: 0.5rem 1rem;" onclick="window.desconectarBanco('${banco.bankId}', '${banco.id || ''}', '${banco.bankName || ''}')">Remover</button>
             </div>`}
      </div>`;
  });
}

window.abrirDetalhesBanco = async function(bankId) {
  if(bankId !== 'banco-amigo') {
    mostrarMensagem("Detalhes disponíveis apenas para bancos externos reais.", "aviso");
    return;
  }
  
  const modal = document.getElementById('modal-detalhes-banco');
  if(!modal) return;
  modal.classList.remove('oculto');
  
  document.getElementById('detalhes-banco-salario').textContent = "---";
  document.getElementById('detalhes-banco-saldo').textContent = "---";
  document.getElementById('detalhes-banco-score').textContent = "---";
  document.getElementById('detalhes-banco-divida').textContent = "---";

  try {
    // Aqui exibimos os dados consolidados no Lala Finance
    // Lendo apenas do banco de dados local (cache/centralizado)
    
    // Buscar Conexão Local (para dados extras consolidados)
    const qConn = query(collection(db, "connections"), where("userId", "==", usuarioAtual.uid), where("bankName", "==", "ConexBank"));
    const connSnap = await getDocs(qConn);
    let dadosConexao = null;
    if(!connSnap.empty) {
      dadosConexao = connSnap.docs[0].data();
    }
    
    // Buscar Saldo Local Importado
    const qAcc = query(collection(db, "accounts"), where("userId", "==", usuarioAtual.uid), where("bankName", "==", "ConexBank"));
    const accountsSnap = await getDocs(qAcc);
    let saldoLocalImportado = 0;
    accountsSnap.forEach(d => {
      let val = d.data().saldo;
      if(typeof val === 'string') val = val.replace(/[^\d.,-]/g, '').replace(',', '.');
      let p = parseFloat(val);
      saldoLocalImportado += (isNaN(p) ? 0 : p);
    });

    // Aqui populamos os cards do Dashboard Consolidado
    if (dadosConexao) {
      document.getElementById('detalhes-banco-salario').textContent = formatarMoeda(dadosConexao.salarioParceiro || 0);
      document.getElementById('detalhes-banco-score').textContent = dadosConexao.scoreParceiro || "N/A";
      document.getElementById('detalhes-banco-divida').textContent = formatarMoeda(dadosConexao.dividaParceira || 0);
    }
    document.getElementById('detalhes-banco-saldo').textContent = formatarMoeda(saldoLocalImportado);

  } catch(e) {
    console.error("Erro detalhes banco", e);
    mostrarMensagem("Erro ao carregar do BD Local", "erro");
  }
};

window.sincronizarBancoExterno = async function() {
  mostrarMensagem("Sincronizando com banco externo...", "aviso");
  
  try {
    // 1. Limpar dados locais anteriores
    await window.desconectarBanco('banco-amigo', true); // true = silent (sem reload completo/msg)
    
    // 2. Importar novamente (Isso acessa dbAmigo diretamente apenas nesta hora)
    await window.importarDadosDoBancoAmigo(true); // true = resync mode
    
    // 3. Atualizar modal
    await window.abrirDetalhesBanco('banco-amigo');
  } catch (error) {
    console.error(error);
  }
};

window.fecharDetalhesBanco = function() {
  document.getElementById('modal-detalhes-banco').classList.add('oculto');
};

window.desconectarBanco = async function(bankId, accountId = '', bankName = '', isSilent = false) {
  try {
    const nomeBanco = bankName || (bankId === 'banco-amigo' ? 'ConexBank' : bankId);

    // 1. Apagar connection
    const qConn = query(collection(db, "connections"), where("userId", "==", usuarioAtual.uid), where("bankName", "==", nomeBanco));
    const connSnap = await getDocs(qConn);
    const promessasConn = [];
    connSnap.forEach(d => promessasConn.push(deleteDoc(doc(db, "connections", d.id))));
    await Promise.all(promessasConn);

    // 2. Apagar account e abater saldo (com proteção contra NaN/Strings corrompidas)
    let saldoAbater = 0;
    const promessasAcc = [];
    
    const extrairNumero = (val) => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (typeof val === 'string') {
        let limpo = val.replace(/[^\d.,-]/g, '').replace(',', '.');
        let p = parseFloat(limpo);
        return isNaN(p) ? 0 : p;
      }
      return 0;
    };

    if (accountId && accountId !== 'undefined') {
      const accRef = doc(db, "accounts", accountId);
      const accSnap = await getDoc(accRef);
      if (accSnap.exists()) {
        saldoAbater += extrairNumero(accSnap.data().saldo);
        promessasAcc.push(deleteDoc(accRef));
      }
    } else {
      const qAcc = query(collection(db, "accounts"), where("userId", "==", usuarioAtual.uid), where("bankName", "==", nomeBanco));
      const accsSnap = await getDocs(qAcc);
      accsSnap.forEach(d => {
        saldoAbater += extrairNumero(d.data().saldo);
        promessasAcc.push(deleteDoc(doc(db, "accounts", d.id)));
      });
    }
    await Promise.all(promessasAcc);

    // 3. Apagar transactions
    const qTrans = query(collection(db, "transactions"), where("userId", "==", usuarioAtual.uid), where("origem", "==", "externo"), where("banco", "==", nomeBanco));
    const transSnap = await getDocs(qTrans);
    const promessasTrans = [];
    transSnap.forEach(d => promessasTrans.push(deleteDoc(doc(db, "transactions", d.id))));
    
    if (bankId && bankId !== 'undefined') {
      const qTransAntiga = query(collection(db, "transactions"), where("userId", "==", usuarioAtual.uid), where("banco", "==", bankId));
      const transAntigaSnap = await getDocs(qTransAntiga);
      transAntigaSnap.forEach(d => promessasTrans.push(deleteDoc(doc(db, "transactions", d.id))));
    }
    await Promise.all(promessasTrans);

    // 4. Atualizar Saldo do Usuário (protegido contra NaN)
    let saldoAtualUser = extrairNumero(dadosUsuario.saldo);
    const novoSaldo = saldoAtualUser - saldoAbater;
    await updateDoc(doc(db, "users", usuarioAtual.uid), { saldo: novoSaldo });
    dadosUsuario.saldo = novoSaldo;

    if (!isSilent) {
      mostrarMensagem("Banco desconectado com sucesso", "aviso");
      window.fecharDetalhesBanco();
      window.atualizarDashboard();
    }
  } catch(e) {
    console.error("Erro ao desconectar", e);
    if (!isSilent) mostrarMensagem("Erro interno: " + e.message, "erro");
  }
};

function abrirConsentimento(id) {
  bancoAConectar = id;
  document.getElementById('modal-consentimento').classList.remove('oculto');
  document.getElementById('check-consentimento').checked = false;
  document.getElementById('btn-autorizar-conexao').disabled = true;
}
window.abrirConsentimento = abrirConsentimento;

document.getElementById('check-consentimento').addEventListener('change', e => {
  document.getElementById('btn-autorizar-conexao').disabled = !e.target.checked;
});
document.getElementById('btn-fechar-consentimento').addEventListener('click', () => document.getElementById('modal-consentimento').classList.add('oculto'));
window.cancelarConexao = function() {
  document.getElementById('modal-consentimento').classList.add('oculto');
};
document.getElementById('btn-cancelar-consentimento').addEventListener('click', window.cancelarConexao);

window.autorizarConexao = async function() {
  document.getElementById('modal-consentimento').classList.add('oculto');
  
  if (bancoAConectar === 'banco-amigo') {
    await window.importarDadosDoBancoAmigo();
  } else {
    // Lógica antiga para outros bancos simulados
    const banco = bancosUsuario.find(b => b.bankId === bancoAConectar);
    if(!banco) return;

    await addDoc(collection(db, "connections"), {
      userId: usuarioAtual.uid, bankId: banco.bankId, bankName: banco.bankName,
      status: "Conectado", consentimento: true, connectedAt: serverTimestamp()
    });

    const accRef = await addDoc(collection(db, "accounts"), {
      userId: usuarioAtual.uid, bankId: banco.bankId, bankName: banco.bankName,
      saldo: 0, status: "Conectado", createdAt: serverTimestamp()
    });

    banco.status = "Conectado";
    banco.saldo = 0;
    banco.id = accRef.id;

    mostrarMensagem(`${banco.bankName} conectado com sucesso!`);
    carregarBancos();
  }
};
document.getElementById('btn-autorizar-conexao').addEventListener('click', window.autorizarConexao);

window.importarDadosDoBancoAmigo = async function(isSync = false) {
  try {
    if(!isSync) {
      mostrarMensagem("Iniciando conexão segura com o Banco Amigo...", "aviso");
      const btn = document.getElementById('btn-autorizar-conexao');
      if(btn) { btn.disabled = true; btn.textContent = 'Importando...'; }
    }

    // ATENÇÃO:
    // Este método usa acesso direto ao Firestore de outro projeto.
    // Isso é apenas para simulação.
    // FUTURA INTEGRAÇÃO: substituir por API real com autenticação.

    const NOME_BANCO_AMIGO = "ConexBank";
    
    // Evitar duplicação apenas se não for Sync
    if (!isSync) {
      const qConn = query(collection(db, "connections"), where("userId", "==", usuarioAtual.uid), where("bankName", "==", NOME_BANCO_AMIGO));
      const existConnSnap = await getDocs(qConn);
      if (!existConnSnap.empty) {
        mostrarMensagem("Conexão com este banco já existe.", "aviso");
        document.getElementById('modal-consentimento').classList.add('oculto');
        return;
      }
    }

    // Aqui verificamos se o usuário é o mesmo nos dois bancos
    const qAmigoUser = query(collection(dbAmigo, "users"), where("email", "==", usuarioAtual.email));
    const amigoUsersSnap = await getDocs(qAmigoUser);
    
    if (amigoUsersSnap.empty) {
      mostrarMensagem("Conta não encontrada no banco parceiro (email diferente ou inexistente).", "erro");
      document.getElementById('modal-consentimento').classList.add('oculto');
      return;
    }
    
    const amigoUserData = amigoUsersSnap.docs[0].data();
    const amigoUid = amigoUsersSnap.docs[0].id;
    
    const salarioParceiro = amigoUserData.rendaMensal || 0;
    const scoreParceiro = amigoUserData.score || 0;
    const dividaParceira = amigoUserData.divida || 0;

    // Aqui importamos dados do banco externo filtrando apenas o usuário correspondente
    // 1. Importar Saldo da coleção accounts do dbAmigo específica deste UID
    const qAccountsAmigo = query(collection(dbAmigo, "accounts"), where("userId", "==", amigoUid));
    const accountsAmigoSnap = await getDocs(qAccountsAmigo);
    let saldoAmigo = 0;
    
    accountsAmigoSnap.forEach(doc => {
      let s = doc.data().saldo;
      if (typeof s === 'string') s = s.replace(/[^\d.,-]/g, '').replace(',', '.');
      let p = parseFloat(s);
      if(!isNaN(p)) saldoAmigo += p;
    });

    // 2. Salvar conexão no Lala Finance com metadados do Open Finance consolidado
    await addDoc(collection(db, "connections"), {
      userId: usuarioAtual.uid,
      bankId: "banco-amigo",
      bankName: NOME_BANCO_AMIGO,
      status: "conectado",
      consentimento: true,
      sameUser: true,
      email: usuarioAtual.email,
      salarioParceiro: salarioParceiro,
      scoreParceiro: scoreParceiro,
      dividaParceira: dividaParceira,
      connectedAt: serverTimestamp()
    });

    // 3. Salvar account externa no Lala Finance
    await addDoc(collection(db, "accounts"), {
      userId: usuarioAtual.uid,
      bankId: "banco-amigo",
      bankName: NOME_BANCO_AMIGO,
      saldo: saldoAmigo,
      tipo: "externo",
      status: "Conectado",
      createdAt: serverTimestamp()
    });

    // 4. Buscar e importar transações estritamente deste usuário
    const qTransAmigo = query(collection(dbAmigo, "transactions"), where("userId", "==", amigoUid));
    const transAmigoSnap = await getDocs(qTransAmigo);
    
    // Aqui exibimos os dados consolidados no Lala Finance (salvando localmente)
    for (const d of transAmigoSnap.docs) {
      const dados = d.data();
      let v = dados.valor;
      if(typeof v === 'string') v = parseFloat(v.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if(isNaN(v)) v = 0;
      
      await addDoc(collection(db, "transactions"), {
        userId: usuarioAtual.uid,
        descricao: dados.descricao || "Transação Externa",
        valor: v,
        tipo: dados.tipo || "entrada",
        banco: NOME_BANCO_AMIGO,
        origem: "externo",
        data: dados.data || new Date().toISOString().slice(0, 10),
        status: "Concluída",
        createdAt: serverTimestamp()
      });
    }

    // 5. Atualizar Saldo Total do Usuário no Lala Finance
    let sAtual = parseFloat(dadosUsuario.saldo) || 0;
    const novoSaldo = sAtual + saldoAmigo;
    const novoScore = Math.min(1000, (parseFloat(dadosUsuario.score) || 0) + 50);
    await updateDoc(doc(db, "users", usuarioAtual.uid), { saldo: novoSaldo, score: novoScore });
    
    dadosUsuario.saldo = novoSaldo;
    dadosUsuario.score = novoScore;

    if(!isSync) {
      mostrarMensagem("Dados importados com sucesso do Banco Amigo!");
      document.getElementById('modal-consentimento').classList.add('oculto');
    } else {
      mostrarMensagem("Dados atualizados com sucesso!");
    }
    
    // Atualizar dashboard automaticamente
    if(!isSync) window.atualizarDashboard();

  } catch (error) {
    console.error("Erro ao importar Open Finance:", error);
    if (error.code === 'permission-denied') {
      mostrarMensagem("Erro: O banco do seu amigo está bloqueado (Regras de Segurança do Firestore não permitem leitura pública).", "erro");
    } else {
      mostrarMensagem("Erro ao importar dados: " + error.message, "erro");
    }
  } finally {
    if(!isSync) {
      const btn = document.getElementById('btn-autorizar-conexao');
      if(btn) { btn.disabled = false; btn.textContent = 'Autorizar conexão'; }
    }
  }
};

window.atualizarDashboard = async function() {
  await carregarDadosCompletos(usuarioAtual.uid);
  carregarDashboard();
  carregarBancos();
  carregarTransacoesUI();
};

// TRANSAÇÕES
document.getElementById('btn-nova-transacao').addEventListener('click', () => document.getElementById('modal-transacao').classList.remove('oculto'));
document.getElementById('btn-fechar-modal').addEventListener('click', () => document.getElementById('modal-transacao').classList.add('oculto'));
document.getElementById('btn-cancelar-modal').addEventListener('click', () => document.getElementById('modal-transacao').classList.add('oculto'));

window.adicionarTransacaoManual = async function(e) {
  if (e) e.preventDefault();
  const valor = parseFloat(document.getElementById('t-valor').value);
  const tipo = document.getElementById('t-tipo').value;
  const descricao = document.getElementById('t-descricao').value;
  const data = document.getElementById('t-data').value;
  const banco = document.getElementById('t-banco').value;

  if(valor <= 0) return mostrarMensagem("Valor inválido", "erro");

  const obj = {
    userId: usuarioAtual.uid, bankId: "manual", bankName: banco,
    descricao, valor, tipo, categoria: "Manual", data, status: "Concluída", createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "transactions"), obj);
  transacoesUsuario.unshift({ id: docRef.id, ...obj });

  let deltaSaldo = 0;
  if(['entrada', 'deposito', 'emprestimo'].includes(tipo)) deltaSaldo = valor;
  if(['saida', 'pix', 'divida', 'transferencia'].includes(tipo)) deltaSaldo = -valor;
  
  if(deltaSaldo !== 0) await atualizarSaldoDoUsuario(deltaSaldo);

  document.getElementById('modal-transacao').classList.add('oculto');
  mostrarMensagem("Transação manual adicionada");
  document.getElementById('form-transacao').reset();
  carregarTransacoesUI();
};
document.getElementById('form-transacao').addEventListener('submit', window.adicionarTransacaoManual);

function carregarTransacoesUI() {
  const tipo = document.getElementById('filtro-tipo').value;
  let filtradas = [...transacoesUsuario];
  if (tipo) filtradas = filtradas.filter(t => t.tipo === tipo);
  
  filtradas.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

  const lista = document.getElementById('lista-transacoes-principal');
  lista.innerHTML = '';
  filtradas.forEach(t => {
    const isEntrada = ['entrada', 'deposito', 'emprestimo'].includes(t.tipo);
    lista.innerHTML += `<li class="transacao-item">
      <div><strong>${t.descricao}</strong> <span class="badge-trans-status">${t.status}</span><br><small>${t.bankName || 'Lala Finance'} • ${formatarData(t.data)}</small></div>
      <div class="transacao-valor ${isEntrada ? 'valor-entrada' : 'valor-saida'}">${isEntrada ? '+' : '-'} ${formatarMoeda(t.valor)}</div>
    </li>`;
  });
}
window.filtrarTransacoes = carregarTransacoesUI;
document.getElementById('btn-filtrar').addEventListener('click', window.filtrarTransacoes);

// RELATORIOS
function gerarRelatorio() {
  let entradas = 0, saidas = 0;
  const mesAtual = document.getElementById('relatorio-mes').value || new Date().toISOString().slice(0, 7);
  document.getElementById('relatorio-mes').value = mesAtual;
  
  transacoesUsuario.forEach(t => {
    if (t.data && t.data.startsWith(mesAtual)) {
      if (['entrada', 'deposito', 'emprestimo'].includes(t.tipo)) entradas += t.valor;
      if (['saida', 'pix', 'divida', 'transferencia'].includes(t.tipo)) saidas += t.valor;
    }
  });
  document.getElementById('rel-entradas').textContent = formatarMoeda(entradas);
  document.getElementById('rel-saidas').textContent = formatarMoeda(saidas);
  document.getElementById('rel-saldo').textContent = formatarMoeda(entradas - saidas);
  
  const container = document.getElementById('grafico-relatorio');
  container.innerHTML = `
    <div class="barra-container"><div class="barra" style="height: ${entradas > 0 ? 100 : 0}%; background-color: #1DB954;"></div><span class="barra-label">Entradas</span></div>
    <div class="barra-container"><div class="barra" style="height: ${saidas > 0 ? (saidas/Math.max(entradas, 1))*100 : 0}%; background-color: #e22134;"></div><span class="barra-label">Saídas</span></div>
  `;
}
document.getElementById('relatorio-mes').addEventListener('change', gerarRelatorio);
