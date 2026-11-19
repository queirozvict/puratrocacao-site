// Funil do site: e-mail → PDF → popup do completo → página do completo → checkout (ou lista de espera).
// Cada passo vira uma linha na planilha (Apps Script): baixou_pdf, popup_sim, popup_nao, clicou_comprar, lista_espera.
(() => {
  const C = window.PT_CONFIG || {};
  const CHAVE = 'pt_lead';

  // ---------- memória local (só conveniência: o dado que vale está na planilha) ----------
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; } };
  const gravar = d => { try { localStorage.setItem(CHAVE, JSON.stringify({ ...ler(), ...d })); } catch {} };

  // origem: ?origem=ig-round no link da DM (vale a primeira que a pessoa trouxe)
  const url = new URL(location.href);
  const origemUrl = (url.searchParams.get('origem') || url.searchParams.get('utm_source') || '').slice(0, 60);
  if (origemUrl && !ler().origem) gravar({ origem: origemUrl });
  const origem = () => ler().origem || origemUrl || 'direto';

  // ---------- envio para a planilha ----------
  function registrar(evento, email) {
    const dados = new URLSearchParams({
      evento, email: email || ler().email || '', origem: origem(),
      pagina: location.pathname, navegador: navigator.userAgent.slice(0, 160),
    });
    if (!C.endpoint) { console.warn('[PT] endpoint vazio em config.js: evento não guardado', Object.fromEntries(dados)); return; }
    // sendBeacon sobrevive à troca de página (clique no checkout); fetch no-cors é o reserva
    const ok = navigator.sendBeacon && navigator.sendBeacon(C.endpoint, dados);
    if (!ok) fetch(C.endpoint, { method: 'POST', mode: 'no-cors', body: dados, keepalive: true }).catch(() => {});
  }

  // ---------- e-mail: validação e sugestão de domínio com erro de digitação ----------
  const RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const DOMINIOS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'yahoo.com', 'icloud.com', 'live.com', 'bol.com.br', 'uol.com.br'];
  function distancia(a, b) {
    const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }
  function sugerir(email) {
    const [u, d] = email.split('@'); if (!d) return null;
    if (DOMINIOS.includes(d)) return null;
    let melhor = null, menor = 3;
    for (const x of DOMINIOS) { const k = distancia(d, x); if (k > 0 && k < menor) { menor = k; melhor = x; } }
    return melhor ? `${u}@${melhor}` : null;
  }

  function baixarPdf() {
    const a = document.createElement('a');
    a.href = C.pdf || document.body.dataset.pdf; a.download = 'seu-primeiro-round-pura-trocacao.pdf'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ---------- página do PDF ----------
  function paginaPdf() {
    const form = document.getElementById('form-pdf');
    const input = document.getElementById('email');
    const erro = document.getElementById('erro-email');
    const sug = document.getElementById('sugestao');
    const blocoForm = document.getElementById('bloco-form');
    const blocoFeito = document.getElementById('bloco-feito');
    const dialogo = document.getElementById('oferta');

    const mostrarFeito = agora => {
      blocoForm.hidden = true; blocoFeito.hidden = false;
      document.getElementById('feito-txt').textContent = agora ? 'Seu PDF está baixando' : 'Seu PDF está liberado';
      document.getElementById('email-feito').textContent = ler().email || '';
      // navegador dentro do Instagram/TikTok às vezes não baixa: avisa como abrir fora
      if (/Instagram|FBAN|FBAV|TikTok|musical_ly|Bytedance/i.test(navigator.userAgent)) document.getElementById('dica-app').hidden = false;
    };
    const abrirOferta = () => { if (dialogo && !dialogo.open) { dialogo.showModal(); registrar('popup_visto'); } };

    if (ler().email) mostrarFeito();

    input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); erro.textContent = ''; sug.textContent = ''; });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (form.elements.site.value) return;            // robô preencheu o campo escondido
      const email = input.value.trim().toLowerCase();
      if (!RE.test(email) || email.length > 120) {
        input.setAttribute('aria-invalid', 'true');
        erro.textContent = 'Confere o e-mail: é para lá que a gente manda as novidades.';
        input.focus(); return;
      }
      const s = sugerir(email);
      if (s && form.dataset.confirmado !== email) {
        form.dataset.confirmado = email;
        sug.innerHTML = '';
        const b = document.createElement('button'); b.type = 'button'; b.textContent = s;
        b.onclick = () => { input.value = s; sug.textContent = ''; form.requestSubmit(); };
        sug.append('Você quis dizer ', b, '? Se não, toque em baixar de novo.');
        return;
      }
      const botao = form.querySelector('button[type=submit]');
      botao.disabled = true; botao.textContent = 'Preparando…';
      gravar({ email });
      registrar('baixou_pdf', email);
      baixarPdf();
      mostrarFeito(true);
      setTimeout(abrirOferta, 1200);
    });

    document.getElementById('baixar-de-novo').addEventListener('click', () => { registrar('baixou_de_novo'); baixarPdf(); });
    document.getElementById('trocar-email').addEventListener('click', () => {
      gravar({ email: '' }); blocoFeito.hidden = true; blocoForm.hidden = false;
      const b = form.querySelector('button[type=submit]'); b.disabled = false; b.textContent = 'Baixar o PDF grátis'; input.value = ''; input.focus();
    });

    // popup
    document.getElementById('oferta-sim').addEventListener('click', () => registrar('popup_sim'));
    const fechar = () => { registrar('popup_nao'); dialogo.close(); };
    document.getElementById('oferta-nao').addEventListener('click', fechar);
    document.getElementById('oferta-x').addEventListener('click', fechar);
    dialogo.addEventListener('click', e => { if (e.target === dialogo) fechar(); });   // toque fora
  }

  // ---------- página do completo ----------
  function paginaCompleto() {
    const temCheckout = !!C.checkout;
    document.querySelectorAll('[data-preco]').forEach(el => {
      el.hidden = !C.preco; if (!C.preco) return;
      el.querySelector('.por').textContent = C.preco;
      const de = el.querySelector('.de'); if (C.precoDe) de.textContent = C.precoDe; else de.hidden = true;
      const pa = el.querySelector('.parc'); if (C.parcelas) pa.textContent = C.parcelas; else pa.hidden = true;
    });
    document.querySelectorAll('[data-sem-preco]').forEach(el => { el.hidden = !!C.preco; });
    document.querySelectorAll('[data-plataforma]').forEach(el => { el.hidden = !(C.plataforma && temCheckout); if (C.plataforma) el.textContent = `Pagamento seguro pela ${C.plataforma}`; });
    document.querySelectorAll('[data-so-venda]').forEach(el => { el.hidden = !temCheckout; });
    document.querySelectorAll('[data-so-lista]').forEach(el => { el.hidden = temCheckout; });

    document.querySelectorAll('[data-comprar]').forEach(b => {
      if (temCheckout) {
        const destino = new URL(C.checkout);
        destino.searchParams.set('src', origem());            // Hotmart e Kiwify aceitam src para saber de onde veio
        b.href = destino.href;
        b.addEventListener('click', () => registrar('clicou_comprar'));
      } else {
        b.textContent = 'Quero ser avisado';
        b.href = '#lista';
        b.addEventListener('click', e => { e.preventDefault(); entrarNaLista(); });
      }
    });

    // lista de espera (sem checkout): usa o e-mail do download; sem ele, pede
    const formLista = document.getElementById('form-lista');
    const ok = document.getElementById('lista-ok');
    function entrarNaLista(email) {
      email = email || ler().email;
      if (!email) { formLista.hidden = false; document.querySelector('#lista [data-comprar]').hidden = true; document.getElementById('lista').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => formLista.querySelector('input').focus(), 350); return; }
      if (!ler().lista) registrar('lista_espera', email);
      gravar({ email, lista: true });
      formLista.hidden = true; ok.hidden = false; naLista();
      document.getElementById('lista-email').textContent = email;
      document.getElementById('lista').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // depois de entrar na lista, os botões viram confirmação (nada de pedir de novo)
    function naLista() {
      document.querySelectorAll('[data-comprar]').forEach(b => { b.textContent = 'Você está na lista ✓'; b.classList.add('claro'); });
      document.querySelector('#lista [data-comprar]').hidden = true;
    }
    if (formLista) {
      if (!temCheckout && ler().lista && ler().email) { ok.hidden = false; naLista(); document.getElementById('lista-email').textContent = ler().email; }
      formLista.addEventListener('submit', e => {
        e.preventDefault();
        if (formLista.elements.site.value) return;
        const inp = formLista.querySelector('input[type=email]');
        const email = inp.value.trim().toLowerCase();
        if (!RE.test(email)) { inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
        entrarNaLista(email);
      });
    }
    registrar('viu_completo');
  }

  // ---------- privacidade ----------
  function paginaPrivacidade() {
    const el = document.getElementById('contato');
    if (el && C.contato) { el.innerHTML = ''; const a = document.createElement('a'); a.href = 'mailto:' + C.contato; a.textContent = C.contato; el.append('pelo e-mail ', a, ' ou '); }
  }

  const p = document.body.dataset.pagina;
  if (p === 'pdf') paginaPdf();
  if (p === 'completo') paginaCompleto();
  if (p === 'privacidade') paginaPrivacidade();
})();

// ---------- animações (só enfeite: sem JS o site continua inteiro) ----------
(() => {
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // topo em cascata
  document.querySelectorAll('.h-texto > *, .h-visual, .h-form').forEach((el, i) => { el.classList.add('entra'); el.style.setProperty('--d', (0.08 * i) + 's'); });
  // o resto aparece ao rolar
  const alvos = document.querySelectorAll('section.sep .cabeca-secao, .treinos li, .cel, .fecho, .antes-depois .col, .formato .item, .res, .cartao.preco, .faq details, .dias');
  alvos.forEach(el => { el.classList.add('revela'); const irmaos = [...el.parentElement.children]; el.style.setProperty('--d', (Math.min(irmaos.indexOf(el), 6) * 0.07) + 's'); });
  if (calmo || !('IntersectionObserver' in window)) { alvos.forEach(el => el.classList.add('visto')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visto'); io.unobserve(e.target);
    if (e.target.classList.contains('dias')) encherDias(e.target);
  }), { threshold: 0.15 });
  alvos.forEach(el => io.observe(el));

  // trilha 1 → 5 → ROUND acendendo em loop
  const trilha = document.querySelectorAll('.trilha span');
  if (trilha.length) {
    let k = 0;
    setInterval(() => {
      trilha.forEach((s, i) => s.classList.toggle('aceso', i === k % (trilha.length + 2)));
      k++;
    }, 650);
  }
  // dias 1 a 6 enchendo até o 7
  function encherDias(el) {
    el.classList.add('anima');
    const ds = [...el.querySelectorAll('span:not(.luta)')];
    ds.forEach((d, i) => setTimeout(() => d.classList.add('enche'), 250 + i * 230));
  }
})();

// vídeo do topo: parado para quem pede menos movimento; volta a tocar se o navegador pausar (economia de bateria no iOS)
(() => {
  const v = document.querySelector('.heroi-img video'); if (!v) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); return; }
  const tocar = () => v.play().catch(() => {});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tocar(); });
  tocar();
})();
// segurança: se o navegador não rodar a animação de entrada (aba em segundo plano, app que trava animações), mostra tudo em 1,6 s
setTimeout(() => document.querySelectorAll('.entra').forEach(el => { el.classList.remove('entra'); el.style.opacity = 1; el.style.transform = 'none'; }), 1600);
