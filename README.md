# Pílulas da Cocriação · by Elainne Ourives

Landing page de captura de leads para a newsletter semanal **Pílulas da
Cocriação**. Página estática (HTML + CSS + JS puro), sem dependências e sem
etapa de build — basta hospedar os arquivos.

## Estrutura da página (3 dobras)

1. **Hero + formulário** — título, proposta de valor e formulário de captura
   (nome, e-mail e WhatsApp) com validação, seletor de país para o WhatsApp
   (Brasil por padrão, com máscara; aceita números do exterior), checkbox de
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
  "pais": "BR",
  "ddi": "55",
  "telefone": "11999999999",
  "telefone_completo": "+5511999999999",
  "origem": "lp-pilulas-da-cocriacao",
  "data": "2026-07-10T12:00:00.000Z"
}
```

### Telefone (WhatsApp) nacional e internacional

O campo de WhatsApp tem um seletor de país ao lado, com Brasil (+55) já
selecionado. Como cada campo é enviado:

- `pais`: sigla do país escolhido (`BR`, `PT`, `US`…). Fica vazio quando a
  pessoa escolhe "Outro país".
- `ddi`: código do país, sem o `+`. Também fica vazio em "Outro país".
- `telefone`: só os dígitos do número local, sem DDI. Para o Brasil, é o
  mesmo formato que a página já enviava antes (DDD + número). Em "Outro
  país", vai o número inteiro, já com o código do país.
- `telefone_completo`: número no formato internacional (E.164), pronto
  para usar em WhatsApp/CRM, ex.: `+5511999999999`, `+351912345678`.

No Brasil a validação continua exigindo DDD + número (10 ou 11 dígitos). Nos
outros países, aceita de 6 dígitos até o limite internacional de 15 dígitos
contando o DDI. Se a pessoa digitar, colar ou o navegador autopreencher um
número começando com `+` (ex.: `+351 912…`), o país é trocado sozinho no
seletor. Um código que não está na lista leva para "Outro país". Para
incluir um país novo, basta adicionar um `<option>` com `data-ddi` no
`index.html`.

Deixando o `endpoint` em branco (`""`), o formulário roda em **modo
demonstração**: valida os campos e mostra a tela de sucesso sem enviar dados
(o lead aparece no console do navegador).

### E-mail de boas-vindas para o lead

Assim que alguém se cadastra, o FormSubmit também envia automaticamente um
e-mail de boas-vindas para o **próprio lead** (recurso de autoresposta —
`_autoresponse`), usando o texto configurado em `WELCOME_EMAIL_MESSAGE` no
topo de `js/main.js`. Para editar o texto, basta alterar essa constante.

Limitações do FormSubmit nesse recurso:

- A mensagem é sempre a mesma para todo mundo — não é possível personalizar
  com o nome do lead ou usar HTML/design (texto simples apenas).
- Como o FormSubmit ainda não confirma automaticamente o recebimento desse
  e-mail específico, faça um cadastro de teste na página publicada para
  conferir se a mensagem chega e está com a formatação esperada.

Se no futuro for necessário um e-mail com o visual da marca (cores, fotos,
tipografia), o caminho é usar o webhook n8n abaixo com um nó de envio de
e-mail HTML, em vez da autoresposta do FormSubmit.

## Webhook n8n

Além do FormSubmit, cada cadastro também é enviado para um webhook do n8n,
configurado em `js/main.js`:

```js
const WEBHOOK_CONFIG = {
  url: "https://automacao-n8n-n8n.6v8bw5.easypanel.host/webhook/pilulas-cocriacao-cadastro",
};
```

O envio inclui os dados do formulário, a URL completa da página no momento
do cadastro e os parâmetros UTM da visita:

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "pais": "BR",
  "ddi": "55",
  "telefone": "11999999999",
  "telefone_completo": "+5511999999999",
  "origem": "lp-pilulas-da-cocriacao",
  "data": "2026-07-10T12:00:00.000Z",
  "pagina_url": "https://pagina-newsletter.vercel.app/?utm_source=instagram&utm_medium=social",
  "utms": {
    "utm_source": "instagram",
    "utm_medium": "social",
    "utm_campaign": "",
    "utm_term": "",
    "utm_content": ""
  }
}
```

Os dois envios (FormSubmit e webhook) acontecem em paralelo e de forma
independente — se um falhar, o outro ainda é tentado, e a tela de sucesso
só deixa de aparecer se **ambos** falharem. Deixar `WEBHOOK_CONFIG.url` em
branco (`""`) desativa esse envio.

**Importante:** o webhook precisa aceitar requisições cross-origin (CORS)
vindas do domínio desta página, já que a chamada parte diretamente do
navegador do visitante.

## Imagens

As fotos da Elainne devem ser salvas em `assets/` — veja as instruções em
[`assets/LEIA-ME.md`](assets/LEIA-ME.md). A página tem um fundo de reserva em
CSS e continua bonita mesmo sem as fotos, mas o design final foi pensado para
elas.

## Pendências antes de ir ao ar

- [ ] Clicar no link de confirmação que o FormSubmit envia para
      suporte@elainneourives.com.br assim que o primeiro lead for
      capturado (ativa o recebimento dos próximos)
