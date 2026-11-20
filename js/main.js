/* ═══════════════════════════════════════════════════════════════
   Pílulas da Cocriação · Captura de leads
   Configure o endpoint da sua ferramenta de e-mail marketing abaixo.
   ═══════════════════════════════════════════════════════════════ */

const FORM_CONFIG = {
  // Envio via FormSubmit (https://formsubmit.co) direto para o e-mail abaixo —
  // serviço gratuito, sem cadastro nem chave de API. Cada lead chega por
  // e-mail em suporte@elainneourives.com.br.
  //
  // IMPORTANTE: no primeiro envio, o FormSubmit manda um e-mail de
  // confirmação para esse endereço — é preciso clicar no link uma única vez
  // para ativar o recebimento dos próximos leads.
  //
  // Para trocar por outra ferramenta (RD Station, ActiveCampaign, Mailchimp,
  // Make, Zapier, n8n…), basta substituir o endpoint abaixo pela URL do seu
  // webhook.
  endpoint: "https://formsubmit.co/ajax/suporte@elainneourives.com.br",

  // Identificador da origem do lead, enviado junto com os dados.
  source: "lp-pilulas-da-cocriacao",
};

// E-mail de boas-vindas enviado automaticamente ao lead (autoresposta
// do FormSubmit) assim que ele se cadastra. É uma mensagem única e
// estática — o FormSubmit não permite personalizar com o nome do lead.
const WELCOME_EMAIL_MESSAGE =
  "Seja muito bem-vinda(o) às Pílulas da Cocriação! " +
  "A partir de agora, toda semana você vai receber uma pílula exclusiva " +
  "da Elainne Ourives direto no seu e-mail: reflexões, práticas e " +
  "provocações para elevar sua frequência e cocriar a vida que você merece. " +
  "Fique de olho na sua caixa de entrada (e dê uma espiadinha na aba de " +
  "promoções ou no spam, só por garantia) — sua primeira pílula está a caminho. " +
  "Com carinho, Equipe Elainne Ourives.";

// Webhook do n8n: recebe cada lead cadastrado com os dados do
// formulário, a URL da página e os parâmetros UTM da visita.
// IMPORTANTE: o webhook precisa aceitar requisições cross-origin
// (CORS) vindas do domínio desta página para que o navegador
// consiga entregar os dados.
const WEBHOOK_CONFIG = {
  url: "https://automacao-n8n-n8n.6v8bw5.easypanel.host/webhook/pilulas-cocriacao-cadastro",
};

/* ── Parâmetros UTM presentes na URL da visita ────────────────── */
function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const utms = {};
  utmKeys.forEach((key) => {
    utms[key] = params.get(key) || "";
  });
  return utms;
}

/* ── Telefone: país selecionado e formatação ──────────────────── */
// Número internacional tem no máximo 15 dígitos contando o DDI (E.164).
const MAX_INTL_DIGITS = 15;

function getSelectedCountry(select) {
  const option = select.options[select.selectedIndex];
  return { code: option.value, ddi: option.dataset.ddi || "" };
}

function isBrazil(select) {
  return getSelectedCountry(select).code === "BR";
}

// Se a pessoa digita/cola/autopreenche um número começando com "+",
// identifica o DDI, troca o país no seletor e deixa só o número local.
function detectCountryFromPlus(select, value) {
  const digits = value.replace(/\D/g, "");
  const options = Array.from(select.options).filter((opt) => opt.dataset.ddi);
  // DDIs mais longos primeiro (ex.: +351 antes de +35…); +1 cai em EUA
  options.sort((a, b) => b.dataset.ddi.length - a.dataset.ddi.length);
  const match = options.find((opt) => digits.startsWith(opt.dataset.ddi));
  if (!match) return null;
  return { option: match, rest: digits.slice(match.dataset.ddi.length) };
}

// Máscara de telefone brasileiro: (00) 00000-0000
function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Demais países: só dígitos e separadores comuns, sem passar de 15 dígitos
function sanitizeIntlPhone(value, ddi) {
  const allowed = value.replace(/[^\d\s().-]/g, "");
  const maxDigits = MAX_INTL_DIGITS - ddi.length;
  let count = 0;
  let result = "";
  for (const char of allowed) {
    if (/\d/.test(char)) {
      if (count >= maxDigits) break;
      count += 1;
    }
    result += char;
  }
  return result;
}

/* ── Validações ──────────────────────────────────────────────── */
const validators = {
  nome(value) {
    if (value.trim().length < 2) return "Digite seu nome para receber as pílulas.";
    return "";
  },
  email(value) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(value.trim())) return "Digite um e-mail válido, ex.: nome@email.com.";
    return "";
  },
  telefone(value) {
    const digits = value.replace(/\D/g, "");
    const select = document.getElementById("pais");
    const { code, ddi } = getSelectedCountry(select);

    if (code === "BR") {
      if (digits.length < 10) return "Digite seu WhatsApp com DDD, ex.: (11) 99999-9999.";
      return "";
    }
    if (code === "OUTRO") {
      if (!value.trim().startsWith("+") || digits.length < 8 || digits.length > MAX_INTL_DIGITS) {
        return "Digite o número completo com o código do país, ex.: +351 912 345 678.";
      }
      return "";
    }
    if (digits.length < 6 || digits.length + ddi.length > MAX_INTL_DIGITS) {
      return "Digite um número de WhatsApp válido para o país selecionado.";
    }
    return "";
  },
};

// Monta os campos de telefone enviados no lead
function buildPhoneData(select, value) {
  const { code, ddi } = getSelectedCountry(select);
  const digits = value.replace(/\D/g, "");
  if (code === "OUTRO") {
    return { pais: "", ddi: "", telefone: digits, telefone_completo: `+${digits}` };
  }
  return { pais: code, ddi, telefone: digits, telefone_completo: `+${ddi}${digits}` };
}

function setFieldError(input, message) {
  const field = input.closest(".field");
  if (!field) return;
  const errorEl = field.querySelector(".field__error");
  if (message) {
    field.classList.add("field--invalid");
    if (errorEl) errorEl.textContent = message;
  } else {
    field.classList.remove("field--invalid");
    if (errorEl) errorEl.textContent = "";
  }
}

/* ── Formulário ──────────────────────────────────────────────── */
function initForm() {
  const form = document.getElementById("lead-form");
  const success = document.getElementById("form-success");
  const submitBtn = document.getElementById("submit-btn");
  if (!form) return;

  const phoneInput = form.querySelector("#telefone");
  const countrySelect = form.querySelector("#pais");
  const ddiDisplay = form.querySelector("#ddi-display");

  function formatPhoneInput() {
    const { code, ddi } = getSelectedCountry(countrySelect);
    if (code === "BR") {
      phoneInput.value = maskPhone(phoneInput.value);
    } else if (code === "OUTRO") {
      // Sempre começa com "+", seguido de dígitos e separadores
      const rest = sanitizeIntlPhone(phoneInput.value, "").trimStart();
      phoneInput.value = phoneInput.value.trim() ? `+${rest}` : "";
    } else {
      phoneInput.value = sanitizeIntlPhone(phoneInput.value, ddi);
    }
  }

  function updateCountryUi() {
    const { code, ddi } = getSelectedCountry(countrySelect);
    ddiDisplay.textContent = code === "OUTRO" ? "+ ?" : `+${ddi}`;
    if (code === "BR") {
      phoneInput.placeholder = "(00) 00000-0000";
      phoneInput.inputMode = "numeric";
    } else if (code === "OUTRO") {
      phoneInput.placeholder = "+00 000 000 0000";
      phoneInput.inputMode = "tel";
    } else {
      phoneInput.placeholder = "Número com código de área";
      phoneInput.inputMode = "numeric";
    }
  }

  phoneInput.addEventListener("input", () => {
    // Número digitado, colado ou autopreenchido com "+DDI": ajusta o país
    // sozinho. Enquanto o DDI ainda está incompleto (ex.: "+35"), deixa o
    // texto como está; com 4+ dígitos sem DDI conhecido, vai para "Outro".
    if (phoneInput.value.trim().startsWith("+") && getSelectedCountry(countrySelect).code !== "OUTRO") {
      const detected = detectCountryFromPlus(countrySelect, phoneInput.value);
      const digitCount = phoneInput.value.replace(/\D/g, "").length;
      if (detected && detected.rest.length > 0) {
        countrySelect.value = detected.option.value;
        phoneInput.value = detected.rest;
        updateCountryUi();
      } else if (!detected && digitCount >= 4) {
        countrySelect.value = "OUTRO";
        updateCountryUi();
      } else {
        return;
      }
    }
    formatPhoneInput();
  });

  countrySelect.addEventListener("change", () => {
    updateCountryUi();
    if (getSelectedCountry(countrySelect).code === "OUTRO") {
      phoneInput.value = "";
    } else {
      formatPhoneInput();
    }
    if (phoneInput.closest(".field").classList.contains("field--invalid")) {
      setFieldError(phoneInput, validators.telefone(phoneInput.value));
    }
    phoneInput.focus();
  });

  updateCountryUi();

  // Revalida o campo assim que a pessoa corrige
  ["nome", "email", "telefone"].forEach((name) => {
    const input = form.querySelector(`#${name}`);
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("field--invalid")) {
        setFieldError(input, validators[name](input.value));
      }
    });
  });

  const consent = form.querySelector("#consent");
  consent.addEventListener("change", () => {
    consent.closest(".consent").classList.remove("consent--invalid");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // honeypot preenchido = bot
    if (form.querySelector("#website").value) return;

    let firstInvalid = null;
    ["nome", "email", "telefone"].forEach((name) => {
      const input = form.querySelector(`#${name}`);
      const message = validators[name](input.value);
      setFieldError(input, message);
      if (message && !firstInvalid) firstInvalid = input;
    });

    if (!consent.checked) {
      consent.closest(".consent").classList.add("consent--invalid");
      if (!firstInvalid) firstInvalid = consent;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const leadData = {
      nome: form.querySelector("#nome").value.trim(),
      email: form.querySelector("#email").value.trim().toLowerCase(),
      ...buildPhoneData(countrySelect, phoneInput.value),
      origem: FORM_CONFIG.source,
      data: new Date().toISOString(),
    };

    submitBtn.classList.add("is-loading");

    const requests = [];

    if (FORM_CONFIG.endpoint) {
      const formSubmitPayload = {
        ...leadData,
        _subject: "Novo lead · Pílulas da Cocriação",
        _captcha: "false",
        _template: "table",
        // Autoresposta: e-mail de boas-vindas enviado automaticamente
        // para o próprio lead (endereço no campo "email" acima).
        _autoresponse: WELCOME_EMAIL_MESSAGE,
      };
      requests.push(
        fetch(FORM_CONFIG.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(formSubmitPayload),
        }).then((response) => {
          if (!response.ok) throw new Error(`FormSubmit HTTP ${response.status}`);
        })
      );
    }

    if (WEBHOOK_CONFIG.url) {
      const webhookPayload = {
        ...leadData,
        pagina_url: window.location.href,
        utms: getUtmParams(),
      };
      requests.push(
        fetch(WEBHOOK_CONFIG.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        }).then((response) => {
          if (!response.ok) throw new Error(`Webhook n8n HTTP ${response.status}`);
        })
      );
    }

    try {
      if (requests.length === 0) {
        // Modo demonstração: nenhum endpoint configurado ainda
        console.info("[Pílulas da Cocriação] Lead capturado (demo):", leadData);
        await new Promise((resolve) => setTimeout(resolve, 700));
      } else {
        const results = await Promise.allSettled(requests);
        results.forEach((result) => {
          if (result.status === "rejected") {
            console.error("[Pílulas da Cocriação] Falha ao enviar lead:", result.reason);
          }
        });
        if (results.every((result) => result.status === "rejected")) {
          throw new Error("Todos os envios do lead falharam");
        }
      }

      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      console.error("[Pílulas da Cocriação] Falha ao enviar lead:", error);
      alert(
        "Não conseguimos concluir sua inscrição agora. " +
          "Verifique sua conexão e tente novamente em instantes."
      );
    } finally {
      submitBtn.classList.remove("is-loading");
    }
  });
}

/* ── Animações de entrada (respeita reduced motion) ──────────── */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

/* ── CTA final: rola até o formulário e foca o primeiro campo ── */
function initScrollTop() {
  document.querySelectorAll(".js-scroll-top").forEach((link) => {
    link.addEventListener("click", () => {
      setTimeout(() => {
        const nome = document.getElementById("nome");
        if (nome && !document.getElementById("lead-form").hidden) {
          nome.focus({ preventScroll: true });
        }
      }, 800);
    });
  });
}

/* ── Barra de progresso de rolagem ────────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;

  let ticking = false;
  function update() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = `${progress}%`;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
  update();
}

/* ── Parallax sutil na foto do hero (desktop, sem reduced motion) ── */
function initHeroParallax() {
  const heroBg = document.querySelector(".hero__bg");
  const hero = document.querySelector(".hero");
  if (!heroBg || !hero) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = window.matchMedia("(min-width: 961px)").matches;
  if (reduceMotion || !isDesktop) return;

  let ticking = false;
  function update() {
    const heroHeight = hero.offsetHeight;
    const progress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
    heroBg.style.translate = `0 ${progress * 50}px`;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}

/* ── Brilho que acompanha o cursor nos cartões de benefícios ──── */
function initCardGlow() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    });
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
initForm();
initReveal();
initScrollTop();
initScrollProgress();
initHeroParallax();
initCardGlow();
