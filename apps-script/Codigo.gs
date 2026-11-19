/**
 * Recebe os eventos do site e guarda numa planilha Google da Pura Trocação.
 * Instalação (site/LEIA-ME.md): script.google.com → Novo projeto → colar este arquivo → rodar criarPlanilha() uma vez
 * → Implantar como app da Web. Funciona solto (sem abrir pela planilha), o que evita o erro "Não foi possível abrir o arquivo"
 * de quando há mais de uma conta Google logada no navegador.
 *
 * Abas criadas sozinhas:
 *  - "Contatos": 1 linha por e-mail (a lista que vale para exportar e mandar e-mail).
 *  - "Eventos":  1 linha por ação (baixou_pdf, popup_sim, clicou_comprar...), para medir o funil.
 */

// Sem envio de e-mail de propósito: assim o script só pede acesso às planilhas, nunca ao Gmail.

const EVENTOS = ['baixou_pdf', 'baixou_de_novo', 'popup_visto', 'popup_sim', 'popup_nao', 'viu_completo', 'clicou_comprar', 'lista_espera'];
const COLUNAS_CONTATO = ['email', 'primeiro_contato', 'origem', 'ultimo_evento', 'ultima_vez', 'baixou_pdf', 'popup_sim', 'viu_completo', 'lista_espera', 'clicou_comprar'];
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  const p = (e && e.parameter) || {};
  const evento = String(p.evento || '');
  let email = String(p.email || '').trim().toLowerCase().slice(0, 120);
  if (/^[=+\-@]/.test(email)) email = '';                  // nada que a planilha leia como fórmula
  if (p.site || EVENTOS.indexOf(evento) < 0) return resposta('ignorado');
  const origem = limpa(p.origem, 60), pagina = limpa(p.pagina, 80), navegador = limpa(p.navegador, 160);

  const trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    const agora = new Date();
    aba('Eventos', ['data', 'evento', 'email', 'origem', 'pagina', 'navegador'])
      .appendRow([agora, evento, RE_EMAIL.test(email) ? email : '', origem, pagina, navegador]);

    if (!RE_EMAIL.test(email)) return resposta('ok');
    const c = aba('Contatos', COLUNAS_CONTATO);
    const achado = c.getRange('A:A').createTextFinder(email).matchEntireCell(true).findNext();
    let linha;
    if (!achado) {
      c.appendRow([email, agora, origem, evento, agora]);
      linha = c.getLastRow();
    } else {
      linha = achado.getRow();
      c.getRange(linha, 4, 1, 2).setValues([[evento, agora]]);
    }
    const col = COLUNAS_CONTATO.indexOf(evento === 'baixou_de_novo' ? 'baixou_pdf' : evento);
    if (col >= 5) c.getRange(linha, col + 1).setValue(true);

  } finally {
    trava.releaseLock();
  }
  return resposta('ok');
}

function doGet() { return resposta('Pura Trocação: coletor ativo'); }

// Rode UMA vez pelo editor (selecione criarPlanilha e clique em Executar). Cria a planilha e guarda o endereço.
function criarPlanilha() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('PLANILHA_ID');
  if (!id) {
    id = SpreadsheetApp.create('Leads · Pura Trocação').getId();
    props.setProperty('PLANILHA_ID', id);
  }
  const pl = SpreadsheetApp.openById(id);
  aba('Contatos', COLUNAS_CONTATO);
  aba('Eventos', ['data', 'evento', 'email', 'origem', 'pagina', 'navegador']);
  const inicial = pl.getSheetByName('Página1') || pl.getSheetByName('Sheet1');
  if (inicial && pl.getSheets().length > 1) pl.deleteSheet(inicial);
  Logger.log('Planilha pronta: ' + pl.getUrl());
}

function planilha() {
  const id = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  if (id) return SpreadsheetApp.openById(id);
  const ativa = SpreadsheetApp.getActiveSpreadsheet();       // se o script foi aberto pela planilha
  if (ativa) return ativa;
  throw new Error('Rode criarPlanilha() uma vez no editor.');
}

function aba(nome, cabecalho) {
  const pl = planilha();
  let a = pl.getSheetByName(nome);
  if (!a) {
    a = pl.insertSheet(nome);
    a.appendRow(cabecalho);
    a.setFrozenRows(1);
    a.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold');
  }
  return a;
}

// texto que vai para a planilha: corta e impede que vire fórmula (=, +, -, @ no começo)
function limpa(v, max) {
  const s = String(v || '').slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function resposta(t) { return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.TEXT); }
