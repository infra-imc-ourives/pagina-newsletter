# Pílulas da Cocriação · by Elainne Ourives

Landing page de captura de leads para a newsletter semanal **Pílulas da
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

## Como o formulário está conectado

Por padrão, o formulário envia os leads via [FormSubmit](https://formsubmit.co)
diretamente para **suporte@elainneourives.com.br** — serviço gratuito,
sem cadastro nem chave de API, configurado em `js/main.js`:

```js
const FORM_CONFIG = {
  endpoint: "https://formsubmit.co/ajax/suporte@elainneourives.com.br",
  source: "lp-pilulas-da-cocriacao",
};
```

**Ativação obrigatória (uma única vez):** no primeiro lead recebido, o
FormSubmit envia um e-mail de confirmação para o endereço acima — é preciso
clicar no link desse e-mail para autorizar o recebimento dos próximos leads.
Sem esse clique, os envios seguintes são descartados silenciosamente.

Cada lead chega por e-mail em formato de tabela, com nome, e-mail e telefone.
Para trocar por outra ferramenta (RD Station, ActiveCampaign, Mailchimp,
Make, Zapier, n8n…), basta substituir o `endpoint` pela URL do seu webhook —
o formulário envia um `POST` com JSON neste formato:

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "telefone": "11999999999",
  "origem": "lp-pilulas-da-cocriacao",
  "data": "2026-07-10T12:00:00.000Z"
}
```

Deixando o `endpoint` em branco (`""`), o formulário roda em **modo
demonstração**: valida os campos e mostra a tela de sucesso sem enviar dados
(o lead aparece no console do navegador).

## Imagens

As fotos da Elainne devem ser salvas em `assets/` — veja as instruções em
[`assets/LEIA-ME.md`](assets/LEIA-ME.md). A página tem um fundo de reserva em
CSS e continua bonita mesmo sem as fotos, mas o design final foi pensado para
elas.

## Pendências antes de ir ao ar

- [ ] Clicar no link de confirmação que o FormSubmit envia para
      suporte@elainneourives.com.br assim que o primeiro lead for
      capturado (ativa o recebimento dos próximos)
- [ ] Salvar as duas fotos em `assets/` (`hero-desktop.jpg` e `hero-mobile.jpg`)
- [ ] Apontar o link da Política de Privacidade (busque `href="#"` no
      `index.html`)
