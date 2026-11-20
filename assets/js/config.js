// Tudo o que muda no site sem mexer no resto do código fica aqui.
window.PT_CONFIG = {
  // URL do Apps Script publicado como app da Web (termina em /exec). Ver site/LEIA-ME.md.
  // Vazio = o site funciona, mas os e-mails NÃO são guardados (só aparece um aviso no console).
  endpoint: 'https://script.google.com/macros/s/AKfycbxxulM0XkeBM9lyIsREX_CIn3gTwJKOJ4kfydEP89ZmHjs-Rv0PngHEXg0OA3cCrsqU-w/exec',

  // Link do checkout (Hotmart, Kiwify...). Vazio = a página do completo vira lista de espera
  // ("Quero ser avisado"), usando o e-mail que a pessoa já deu no download.
  checkout: 'https://pay.kiwify.com.br/kcSosUh',
  plataforma: 'Kiwify',          // ex.: 'Kiwify' ou 'Hotmart' (aparece em "pagamento seguro pela ...")

  // Preço. Vazio = não mostra preço (fica "preço de lançamento para quem está na lista").
  preco: 'R$ 16,99',                 // ex.: 'R$ 27'
  precoDe: 'R$ 39,99',               // ex.: 'R$ 54' (riscado). Deixe vazio se não houver.
  parcelas: '',              // ex.: 'ou 3x de R$ 9,90'

  instagram: 'https://www.instagram.com/puratrocacao/',
  contato: '',               // e-mail para pedidos de exclusão de dados (LGPD). Vazio = só a DM do Instagram.
};
