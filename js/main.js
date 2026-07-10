/* ═══════════════════════════════════════════════════════════════
   Pílulas da Cocriação · Captura de leads
   Configure o endpoint da sua ferramenta de e-mail marketing abaixo.
   ═══════════════════════════════════════════════════════════════ */

const FORM_CONFIG = {
  // Envio via FormSubmit (https://formsubmit.co) direto para o e-mail abaixo —
  // serviço gratuito, sem cadastro nem chave de API. Cada lead chega por
  // e-mail em infraestrutura@elainneourives.com.br.
  //
  // IMPORTANTE: no primeiro envio, o FormSubmit manda um e-mail de
  // confirmação para esse endereço — é preciso clicar no link uma única vez
  // para ativar o recebimento dos próximos leads.
  //
  // Para trocar por outra ferramenta (RD Station, ActiveCampaign, Mailchimp,
  // Make, Zapier, n8n…), basta substituir o endpoint abaixo pela URL do seu
  // webhook.
  endpoint: "https://formsubmit.co/ajax/infraestrutura@elainneourives.com.br",

  // Identificador da origem do lead, enviado junto com os dados.
  source: "lp-pilulas-da-cocriacao",
};

/* ── Máscara de telefone brasileiro: (00) 00000-0000 ─────────── */
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
    if (digits.length < 10) return "Digite seu WhatsApp com DDD, ex.: (11) 99999-9999.";
    return "";
  },
};

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
  phoneInput.addEventListener("input", () => {
    phoneInput.value = maskPhone(phoneInput.value);
  });

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

    const payload = {
      nome: form.querySelector("#nome").value.trim(),
      email: form.querySelector("#email").value.trim().toLowerCase(),
      telefone: form.querySelector("#telefone").value.replace(/\D/g, ""),
      origem: FORM_CONFIG.source,
      data: new Date().toISOString(),
      _subject: "Novo lead · Pílulas da Cocriação",
      _captcha: "false",
      _template: "table",
    };

    submitBtn.classList.add("is-loading");

    try {
      if (FORM_CONFIG.endpoint) {
        const response = await fetch(FORM_CONFIG.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } else {
        // Modo demonstração: nenhum endpoint configurado ainda
        console.info("[Pílulas da Cocriação] Lead capturado (demo):", payload);
        await new Promise((resolve) => setTimeout(resolve, 700));
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
