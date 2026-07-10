# Cartas da Cocriação · by Elainne Ourives

Landing page de captura de leads para a newsletter semanal **Cartas da
Cocriação**. Página estática (HTML + CSS + JS puro), sem dependências e sem
etapa de build — basta hospedar os arquivos.

## Estrutura da página (3 dobras)

1. **Hero + formulário** — título, proposta de valor e formulário de captura
   (nome, e-mail e WhatsApp) com validação, máscara de telefone, checkbox de
   consentimento (LGPD) e honeypot anti-spam.
2. **O que você recebe** — três cartões de benefícios e o passo a passo da
   inscrição.
3. **Quem escreve** — apresentação da Elainne Ourives com CTA final que volta
   ao formulário.

## Como publicar

Qualquer hospedagem de arquivos estáticos funciona: GitHub Pages, Vercel,
Netlify, Hostinger etc. Não há build — publique a pasta como está.

## Como conectar o formulário

Edite `js/main.js` e preencha o `endpoint` no topo do arquivo:

```js
const FORM_CONFIG = {
  endpoint: "https://sua-integracao.com/webhook", // RD Station, ActiveCampaign, Make, Zapier, n8n…
  source: "lp-cartas-da-cocriacao",
};
```

O formulário envia um `POST` com JSON neste formato:

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "telefone": "11999999999",
  "origem": "lp-cartas-da-cocriacao",
  "data": "2026-07-10T12:00:00.000Z"
}
```

Enquanto o `endpoint` estiver vazio, o formulário roda em **modo
demonstração**: valida os campos e mostra a tela de sucesso sem enviar dados
(o lead aparece no console do navegador).

## Imagens

As fotos da Elainne devem ser salvas em `assets/` — veja as instruções em
[`assets/LEIA-ME.md`](assets/LEIA-ME.md). A página tem um fundo de reserva em
CSS e continua bonita mesmo sem as fotos, mas o design final foi pensado para
elas.

## Pendências antes de ir ao ar

- [ ] Salvar as duas fotos em `assets/` (`hero-desktop.jpg` e `hero-mobile.jpg`)
- [ ] Configurar o `endpoint` do formulário em `js/main.js`
- [ ] Apontar o link da Política de Privacidade (busque `href="#"` no
      `index.html`)
