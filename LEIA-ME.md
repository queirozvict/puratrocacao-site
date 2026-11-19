# Site do funil: PDF grátis → completo

Site estático (HTML, CSS e JS, sem build), feito para o celular, porque quem chega vem do link da DM.

| Página | O que faz |
|---|---|
| `index.html` | Pede o e-mail, baixa o PDF e, 1,2 s depois, abre o popup "Um round você já tem. Agora vem a luta." → **Quero ver** leva para `completo/`. |
| `completo/` | Página do "Do primeiro treino à luta". **Com** link de checkout: mostra o preço, e o botão leva para a Hotmart ou Kiwify. **Sem** link: vira lista de espera ("Quero ser avisado"), usando o e-mail do download. |
| `privacidade/` | O que guardamos e para quê (LGPD). |

Tudo o que muda fica em **`assets/js/config.js`**: endpoint da planilha, checkout, plataforma, preço e contato.

## 1. Guardar os e-mails (planilha Google, grátis)
1. Abra **script.google.com** e confira, no avatar do canto superior direito, se está na conta Google da Pura Trocação. Se houver várias contas logadas e der "Não foi possível abrir o arquivo", use uma janela anônima só com essa conta.
2. Clique em **Novo projeto** e dê o nome "Funil Pura Trocação". Apague o que estiver no editor, cole o `apps-script/Codigo.gs` inteiro e salve (Ctrl+S).
3. No menu de funções, ao lado de "Executar", escolha **criarPlanilha** e clique em **Executar**. Autorize: em "Google não verificou este app", clique em Avançado → Acessar (o app é seu). No registro de execução aparece o link da planilha "Leads · Pura Trocação", que já sai criada no seu Drive com as abas.
4. Clique em **Implantar → Nova implantação**. Na engrenagem, escolha **App da Web**. Em "Executar como", escolha **Eu**. Em "Quem pode acessar", escolha **Qualquer pessoa**. Clique em Implantar.
5. Copie a URL que termina em `/exec` e cole em `endpoint` no `assets/js/config.js`.
6. Teste: abra o site, baixe o PDF com o seu e-mail e veja a linha aparecer na planilha.

- **Contatos** tem uma linha por e-mail: primeiro contato, origem e colunas ✓ para baixou_pdf, popup_sim, viu_completo, lista_espera e clicou_comprar. É a lista que você exporta para mandar o aviso de lançamento (Arquivo → Fazer download → CSV, e importa no Brevo ou no MailerLite, que são grátis até alguns milhares de contatos).
- **Eventos** tem uma linha por ação, para medir o funil: quantos baixaram, quantos viram o popup, quantos disseram sim e quantos clicaram em comprar.
- Se você mudar o `Codigo.gs` depois, use **Implantar → Gerenciar implantações → editar → Nova versão**. Assim a URL continua a mesma.
- O script não manda e-mail: por isso ele só pede acesso às planilhas (Google Sheets), não ao Gmail.

## 2. Publicar (grátis)
O mais simples é o **Cloudflare Pages** ou o **Netlify**: arraste a pasta `site/` (Netlify Drop) ou ligue ao GitHub com a pasta `site` como raiz. Os dois dão HTTPS e aceitam domínio próprio. O GitHub Pages também serve, porque todos os caminhos são relativos.
Depois de ter o endereço final:
- troque `og:image` em `index.html` e `completo/index.html` por um endereço completo (`https://.../assets/img/capa.jpg`), para a prévia do link sair com imagem no WhatsApp e no Instagram;
- troque `LINK_PDF` no `Codigo.gs`, se ligar o envio por e-mail.

## 3. Ligar no funil
- **ManyChat (DM do Instagram):** o botão BAIXAR O PDF aponta para `https://SEU-SITE/?origem=ig-round`.
- **YouTube** (comentário fixado): `?origem=yt`. **TikTok** (link na bio): `?origem=tt`.
- A `origem` vai para a planilha e, no checkout, como `src` (Hotmart e Kiwify mostram de onde veio a venda).
- Quando o checkout existir: cole o link em `checkout`, o nome em `plataforma` e o preço em `preco` (e, se quiser, `precoDe` e `parcelas`). A página sai sozinha do modo lista de espera. Quem entrou na lista você avisa pelo e-mail.

## Testar no computador
`python -m http.server 8787 --directory site` e abra `http://localhost:8787/?origem=teste`. Sem `endpoint`, nada é guardado e o console avisa.

## Cuidados
- O link do PDF é público. Quem tiver o endereço direto baixa sem dar o e-mail, mas isso é raro, porque o link que circula é o da página.
- Se o Apps Script cair, a pessoa baixa o PDF mesmo assim e o e-mail se perde (escolha de propósito: não travar quem quer o PDF).
- O texto de privacidade é um modelo simples; não é parecer jurídico.
