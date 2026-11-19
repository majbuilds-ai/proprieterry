/* ==========================================================================
   proprieTerry Mortgage LLC — v2 Interactive Studio & Terry AI Concierge
   ========================================================================== */

(() => {
  'use strict';

  const ROUTE_DATA = {
    'first-home': {
      code: 'ROUTE 01 // FOUNDATION PLAN',
      title: 'Buying my first home',
      consider: [
        '<strong>Liquidity beats 20% down:</strong> Keeping $25k in post-closing reserves with low-cost PMI is often safer than draining cash to hit 20%.',
        '<strong>Net-pay budgeting:</strong> Banks qualify you on gross income; we design your target payment around actual take-home comfort.',
        '<strong>Seller-funded buydowns:</strong> A $15k seller credit drops your rate 2% in Year 1—saving 3× more monthly than a $15k price reduction.'
      ],
      prepare: [
        '<strong>2 years of W-2s or tax returns:</strong> Plus 30 days of recent pay stubs (or 24 months of 1099/K-1 history).',
        '<strong>60 days of asset statements:</strong> Checking, savings, brokerage, or RSU accounts—pause large transfers before applying.',
        '<strong>Sleep-well monthly ceiling:</strong> Your target all-in monthly number and comfortable cash-to-close limit.'
      ],
      questions: [
        'What is the 5-year total cost difference between 10% down and 20% down?',
        'Can you fully underwrite my pre-approval upfront so I compete like cash?',
        'How does a seller-paid 2-1 rate buydown change my first two years?'
      ]
    },
    'next-home': {
      code: 'ROUTE 02 // EQUITY BRIDGE PLAN',
      title: 'Buying my next home',
      consider: [
        '<strong>Buy before you sell:</strong> Unlock trapped equity with a bridge or HELOC strategy so you never move twice.',
        '<strong>Mortgage recast option:</strong> Close with 10% down, then apply proceeds from your sale to lower your monthly payment without refinancing.',
        '<strong>Contingency strength:</strong> Fully underwritten approval lets listing agents trust your offer even with a home-to-sell timeline.'
      ],
      prepare: [
        '<strong>Current mortgage statement:</strong> Balance, rate, and escrow details on your existing residence.',
        '<strong>Estimated net proceeds:</strong> Target sale price minus agent fees and remaining payoff.',
        '<strong>Overlap comfort window:</strong> How many months of dual-housing reserves feel comfortable if needed.'
      ],
      questions: [
        'How does a mortgage recast work after my current home closes?',
        'Should I put 10% down now and recast, or use a bridge strategy?',
        'What reserves do underwriters require if I carry two homes briefly?'
      ]
    },
    'refinancing': {
      code: 'ROUTE 03 // RATE & TERM OPTIMIZATION',
      title: 'Refinancing',
      consider: [
        '<strong>Exact break-even math:</strong> Divide total closing costs by monthly savings—if you stay longer than break-even, the refi pays for itself.',
        '<strong>Don’t reset your clock:</strong> Match a custom 22-year or 20-year term so you don’t restart 30 years of front-loaded interest.',
        '<strong>Drop PMI early:</strong> Rising home equity often eliminates mortgage insurance completely on a new appraisal.'
      ],
      prepare: [
        '<strong>Current Note & statement:</strong> Exact interest rate, remaining term, and current principal balance.',
        '<strong>Homeowner’s insurance dec page:</strong> Helps us verify escrow transfer with zero surprises.',
        '<strong>Target hold horizon:</strong> How long you plan to keep the home or this loan.'
      ],
      questions: [
        'When rates drop, what is your exact break-even math for a streamline refi?',
        'Can we structure a custom term so I don’t restart a 30-year clock?',
        'How much equity do I need to remove PMI completely?'
      ]
    }
  };

  const PRESETS = {
    'first-home': { label: 'First Home', price: 680000, downPct: 10, rate: 6.25, term: 30, tax: 652, ins: 150, hoa: 0 },
    'default': { label: 'Signature', price: 750000, downPct: 20, rate: 6.125, term: 30, tax: 719, ins: 165, hoa: 0 },
    'next-home': { label: 'Next Home', price: 1150000, downPct: 20, rate: 6.0, term: 30, tax: 1102, ins: 245, hoa: 0 },
    'refinancing': { label: 'Refi', price: 950000, downPct: 25, rate: 5.75, term: 20, tax: 910, ins: 205, hoa: 0 }
  };

  const state = {
    route: 'first-home',
    presetLabel: 'Signature',
    price: 750000,
    downPct: 20,
    rate: 6.125,
    term: 30,
    includeOptional: true,
    propTax: 719,
    homeIns: 165,
    hoa: 0,
    pmiManual: null,
    lastCalc: null
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const fmtMoney = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const parseNum = (str) => {
    const cleaned = String(str || '').replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    return Number.isFinite(val) ? val : 0;
  };

  function announce(msg) {
    const el = $('#sr-announcer');
    if (el) el.textContent = msg;
  }

  /* ========================================================================
     1. SECTION NAVIGATION
     ======================================================================== */
  function scrollToSection(id) {
    document.dispatchEvent(new Event('section-navigation'));
    document.getElementById(id)?.scrollIntoView();
  }

  function announcePathContentChange() {
    $('.path-folio__content')?.dispatchEvent(new Event('path-content-change'));
  }

  /* ========================================================================
     2. ROUTE DOSSIER TABS
     ======================================================================== */
  function renderRoute(routeKey) {
    const data = ROUTE_DATA[routeKey];
    if (!data) return;
    const routeChanged = state.route !== routeKey;
    state.route = routeKey;

    $$('.intent-pill').forEach((pill) => {
      pill.classList.toggle('is-active', pill.dataset.heroIntent === routeKey);
    });

    $$('.path-trigger').forEach((card) => {
      const active = card.dataset.route === routeKey;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-selected', String(active));
    });

    const panel = $('#path-folio');
    if (panel) panel.setAttribute('aria-labelledby', `tab-${routeKey}`);
    $('#dossier-code').textContent = data.code;
    $('#dossier-title').textContent = data.title;
    $('#dossier-consider-list').innerHTML = data.consider.map((item) => `<li>${item}</li>`).join('');
    $('#dossier-prepare-list').innerHTML = data.prepare.map((item) => `<li>${item}</li>`).join('');
    $('#dossier-questions-list').innerHTML = data.questions.map((q) => `
      <button type="button" class="folio-q-btn" data-ask-ai="${q.replace(/"/g, '&quot;')}">
        <span>“${q}”</span>
        <strong>Ask Terry AI →</strong>
      </button>
    `).join('');

    const loadBtn = $('#dossier-load-estimator-btn');
    if (loadBtn) loadBtn.dataset.loadPreset = routeKey;
    const discussBtn = $('#dossier-discuss-btn');
    if (discussBtn) discussBtn.dataset.discussRoute = data.title;

    announce(`Selected route: ${data.title}`);
    if (routeChanged) announcePathContentChange();
  }

  $$('.intent-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const intent = pill.dataset.heroIntent;
      renderRoute(intent);
      applyPreset(intent);
    });
  });

  $$('.path-trigger').forEach((card) => {
    card.addEventListener('click', () => renderRoute(card.dataset.route));
  });

  $$('.subtab-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      const target = btn.dataset.subtab;
      $$('.subtab-pill').forEach((b) => b.classList.toggle('is-active', b === btn));
      $$('.subtab-pane').forEach((pane) => {
        const match = pane.dataset.subtabPane === target;
        pane.classList.toggle('is-active', match);
        pane.hidden = !match;
      });
      announcePathContentChange();
    });
  });

  $('#desk-open-ai-btn')?.addEventListener('click', () => openTerryAiDrawer());

  document.addEventListener('click', (e) => {
    const askBtn = e.target.closest('[data-ask-ai]');
    if (askBtn) {
      openTerryAiDrawer(askBtn.dataset.askAi);
    }
  });

  $('#dossier-load-estimator-btn')?.addEventListener('click', (e) => {
    const presetKey = e.currentTarget.dataset.loadPreset || 'first-home';
    applyPreset(presetKey);
    scrollToSection('studio');
  });

  $('#dossier-discuss-btn')?.addEventListener('click', (e) => {
    const routeTitle = e.currentTarget.dataset.discussRoute || 'Buying my first home';
    attachContextToDesk(`Route: ${routeTitle} · Current estimate ${fmtMoney(state.lastCalc?.total || 4530)}/mo`);
    scrollToSection('desk');
  });

  /* ========================================================================
     3. PAYMENT STUDIO CALCULATOR & DONUT CHART
     ======================================================================== */
  const payoffYears = $$('.payoff__year');
  let selectedPayoffYear = payoffYears.length - 1;

  function renderPayoff() {
    const years = state.lastCalc.years;
    const scale = Math.max(1, years.at(-1).principal);
    payoffYears.forEach((button, index) => {
      const { principal } = years[index];
      button.style.setProperty('--payoff-height', principal / scale);
      button.setAttribute('aria-pressed', String(index === selectedPayoffYear));
      button.setAttribute('aria-label', `Year ${index + 1}, ${fmtMoney(principal)} principal repaid`);
    });
    const { principal, balance } = years[selectedPayoffYear];
    $('#payoff-amount').textContent = fmtMoney(principal);
    $('#payoff-caption').textContent = `Repaid by year ${selectedPayoffYear + 1} · ${fmtMoney(balance)} remaining`;
  }

  payoffYears.forEach((button, index) => {
    button.addEventListener('click', () => {
      selectedPayoffYear = index;
      renderPayoff();
    });
  });

  function calculateMortgage() {
    const price = Math.max(100000, state.price);
    const downPct = Math.min(80, Math.max(3, state.downPct));
    const downDollar = Math.round(price * (downPct / 100));
    const loanAmount = Math.max(0, price - downDollar);
    const ltv = (loanAmount / price) * 100;
    const monthlyRate = (state.rate / 100) / 12;
    const months = state.term * 12;

    let pi = 0;
    if (monthlyRate > 0 && months > 0) {
      const factor = Math.pow(1 + monthlyRate, months);
      pi = loanAmount * ((monthlyRate * factor) / (factor - 1));
    } else if (months > 0) {
      pi = loanAmount / months;
    }

    const autoPmi = ltv > 80 ? Math.round((loanAmount * 0.0048) / 12) : 0;
    const pmi = state.pmiManual !== null ? state.pmiManual : autoPmi;
    const tax = state.includeOptional ? state.propTax : 0;
    const ins = state.includeOptional ? state.homeIns : 0;
    const other = state.includeOptional ? (state.hoa + pmi) : 0;
    const total = pi + tax + ins + other;

    // 5-year (60 months) amortization snapshot
    let balance = loanAmount;
    let totalInterest5Yr = 0;
    let totalPrincipal5Yr = 0;
    const years = [];
    const loopMonths = Math.min(60, months);
    for (let i = 0; i < loopMonths; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(balance, pi - interestPayment);
      totalInterest5Yr += interestPayment;
      totalPrincipal5Yr += principalPayment;
      balance -= principalPayment;
      if ((i + 1) % 12 === 0) years.push({ principal: totalPrincipal5Yr, balance });
    }

    const estApr = state.rate + 0.093;

    state.lastCalc = {
      price,
      downDollar,
      downPct,
      loanAmount,
      ltv,
      pi,
      tax,
      ins,
      hoa: state.hoa,
      pmi,
      other,
      total,
      estApr,
      years,
      totalPrincipal5Yr,
      totalInterest5Yr,
      balance5Yr: balance
    };

    renderEstimator();
    renderPayoff();
  }

  function renderEstimator() {
    const c = state.lastCalc;
    if (!c) return;

    $('#out-loan-amount').textContent = fmtMoney(c.loanAmount);
    $('#out-apr-val').textContent = `${c.estApr.toFixed(3)}%`;
    $('#out-ltv-val').textContent = `${c.ltv.toFixed(1)}%`;
    $('#out-total-monthly').textContent = fmtMoney(c.total);
    $('#out-pi-val').textContent = fmtMoney(c.pi);
    $('#out-tax-val').textContent = fmtMoney(c.tax);
    $('#out-ins-val').textContent = fmtMoney(c.ins);
    $('#out-other-val').textContent = fmtMoney(c.other);

    // Sync Hero snapshot & Terry AI greeting
    const heroTotal = $('#hero-snapshot-total');
    if (heroTotal) heroTotal.innerHTML = `${fmtMoney(c.total)}<span>/mo</span>`;
    const heroSub = $('#hero-snapshot-sub');
    if (heroSub) {
      heroSub.textContent = `${state.presetLabel} ${fmtMoney(c.price)} · ${Math.round(c.downPct)}% down · ${state.rate.toFixed(3)}%`;
    }
    const aiTotal = $('#chat-greeting-total');
    if (aiTotal) aiTotal.textContent = `${fmtMoney(c.total)}/mo`;

    // LTV badge
    const ltvBadge = $('#ltv-status-badge');
    if (ltvBadge) {
      ltvBadge.textContent = c.ltv <= 80
        ? `${c.ltv.toFixed(0)}% LTV · No Mortgage Insurance (PMI) required`
        : `${c.ltv.toFixed(0)}% LTV · Est. PMI ${fmtMoney(c.pmi)}/mo included (drops at 80% LTV)`;
    }

    // Update Donut SVG (r=84 -> circumference 527.79)
    const circ = 2 * Math.PI * 84;
    const total = Math.max(1, c.total);
    const segments = [
      { id: '#donut-seg-pi', val: c.pi },
      { id: '#donut-seg-tax', val: c.tax },
      { id: '#donut-seg-ins', val: c.ins },
      { id: '#donut-seg-other', val: c.other }
    ];

    let offset = 0;
    segments.forEach(({ id, val }) => {
      const el = $(id);
      if (!el) return;
      const len = (val / total) * circ;
      el.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${circ.toFixed(2)}`);
      el.setAttribute('stroke-dashoffset', `${(-offset).toFixed(2)}`);
      offset += len;
    });

    // Update 5-year modal numbers
    $('#modal-5yr-principal').textContent = fmtMoney(c.totalPrincipal5Yr);
    $('#modal-5yr-interest').textContent = fmtMoney(c.totalInterest5Yr);
    $('#modal-5yr-balance').textContent = fmtMoney(c.balance5Yr);
    $('#modal-5yr-apr').textContent = `${c.estApr.toFixed(3)}%`;
  }

  function syncInputsFromState() {
    $('#input-home-price').value = Math.round(state.price).toLocaleString('en-US');
    $('#slider-home-price').value = Math.min(3500000, Math.max(200000, state.price));

    const downDollar = Math.round(state.price * (state.downPct / 100));
    $('#input-down-dollar').value = downDollar.toLocaleString('en-US');
    $('#input-down-pct').value = Number(state.downPct.toFixed(1));
    $('#slider-down-pct').value = Math.min(50, Math.max(3, Math.round(state.downPct)));

    $('#input-interest-rate').value = state.rate.toFixed(3);
    $('#slider-interest-rate').value = Math.min(9, Math.max(3.5, state.rate));

    $$('input[name="loanTerm"]').forEach((r) => {
      r.checked = Number(r.value) === state.term;
    });

    $('#input-prop-tax').value = Math.round(state.propTax).toLocaleString('en-US');
    $('#input-home-ins').value = Math.round(state.homeIns).toLocaleString('en-US');
    $('#input-hoa').value = Math.round(state.hoa).toLocaleString('en-US');
    const pmiVal = state.pmiManual !== null
      ? state.pmiManual
      : (state.downPct < 20 ? Math.round((state.price * (1 - state.downPct / 100) * 0.0048) / 12) : 0);
    $('#input-pmi').value = Math.round(pmiVal).toLocaleString('en-US');
  }

  function applyPreset(key) {
    const p = PRESETS[key] || PRESETS.default;
    state.presetLabel = p.label;
    state.price = p.price;
    state.downPct = p.downPct;
    state.rate = p.rate;
    state.term = p.term;
    state.propTax = p.tax;
    state.homeIns = p.ins;
    state.hoa = p.hoa;
    state.pmiManual = null;

    $$('.preset-pill').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.estimatorPreset === key);
    });

    syncInputsFromState();
    calculateMortgage();
  }

  $$('.preset-pill').forEach((btn) => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.estimatorPreset));
  });

  $('#slider-home-price')?.addEventListener('input', (e) => {
    state.price = Number(e.target.value);
    state.propTax = Math.round((state.price * 0.0115) / 12);
    state.homeIns = Math.round((state.price * 0.00264) / 12);
    state.pmiManual = null;
    syncInputsFromState();
    calculateMortgage();
  });

  $('#input-home-price')?.addEventListener('change', (e) => {
    state.price = Math.max(100000, parseNum(e.target.value));
    state.propTax = Math.round((state.price * 0.0115) / 12);
    state.homeIns = Math.round((state.price * 0.00264) / 12);
    state.pmiManual = null;
    syncInputsFromState();
    calculateMortgage();
  });

  $('#slider-down-pct')?.addEventListener('input', (e) => {
    state.downPct = Number(e.target.value);
    state.pmiManual = null;
    syncInputsFromState();
    calculateMortgage();
  });

  $('#input-down-pct')?.addEventListener('change', (e) => {
    state.downPct = Math.min(80, Math.max(3, parseNum(e.target.value)));
    state.pmiManual = null;
    syncInputsFromState();
    calculateMortgage();
  });

  $('#input-down-dollar')?.addEventListener('change', (e) => {
    const dollars = parseNum(e.target.value);
    state.downPct = Math.min(80, Math.max(3, (dollars / Math.max(1, state.price)) * 100));
    state.pmiManual = null;
    syncInputsFromState();
    calculateMortgage();
  });

  $('#slider-interest-rate')?.addEventListener('input', (e) => {
    state.rate = Number(e.target.value);
    syncInputsFromState();
    calculateMortgage();
  });

  $('#input-interest-rate')?.addEventListener('change', (e) => {
    state.rate = Math.min(12, Math.max(2, parseNum(e.target.value)));
    syncInputsFromState();
    calculateMortgage();
  });

  $$('input[name="loanTerm"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      state.term = Number(e.target.value);
      calculateMortgage();
    });
  });

  $('#toggle-include-optional')?.addEventListener('change', (e) => {
    state.includeOptional = e.target.checked;
    calculateMortgage();
  });

  $('#input-prop-tax')?.addEventListener('change', (e) => {
    state.propTax = parseNum(e.target.value);
    calculateMortgage();
  });
  $('#input-home-ins')?.addEventListener('change', (e) => {
    state.homeIns = parseNum(e.target.value);
    calculateMortgage();
  });
  $('#input-hoa')?.addEventListener('change', (e) => {
    state.hoa = parseNum(e.target.value);
    calculateMortgage();
  });
  $('#input-pmi')?.addEventListener('change', (e) => {
    state.pmiManual = parseNum(e.target.value);
    calculateMortgage();
  });

  /* ========================================================================
     4. DIRECT TO TERRY'S DESK FORM
     ======================================================================== */
  function attachContextToDesk(summaryText) {
    $('#attached-context-summary').textContent = summaryText;
    $('#attached-estimate-payload').value = summaryText;
    $('#attached-context-banner').hidden = false;
  }

  $('#clear-context-btn')?.addEventListener('click', () => {
    $('#attached-context-banner').hidden = true;
    $('#attached-estimate-payload').value = '';
  });

  $('#send-estimate-to-terry-btn')?.addEventListener('click', () => {
    const c = state.lastCalc;
    if (!c) return;
    const summary = `${fmtMoney(c.price)} home · ${Math.round(c.downPct)}% down (${fmtMoney(c.downDollar)}) · ${state.rate.toFixed(3)}% (${state.term}-yr) → Est. ${fmtMoney(c.total)}/mo`;
    attachContextToDesk(summary);
    scrollToSection('desk');
  });

  $$('.topic-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const textarea = $('#visitor-topic');
      if (!textarea) return;
      const prefix = pill.dataset.topicInsert || '';
      if (!textarea.value.startsWith(prefix)) {
        textarea.value = prefix + textarea.value;
      }
      textarea.focus();
    });
  });

  function setFieldError(inputId, errorId, hasError) {
    const input = $(inputId);
    const err = $(errorId);
    if (!input || !err) return;
    input.setAttribute('aria-invalid', String(hasError));
    err.hidden = !hasError;
  }

  $('#talk-with-terry-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = $('#visitor-name');
    const contactEl = $('#visitor-contact');
    const topicEl = $('#visitor-topic');

    const badName = nameEl.value.trim().length < 2;
    const badContact = contactEl.value.trim().length < 5;
    const badTopic = topicEl.value.trim().length < 4;

    setFieldError('#visitor-name', '#err-visitor-name', badName);
    setFieldError('#visitor-contact', '#err-visitor-contact', badContact);
    setFieldError('#visitor-topic', '#err-visitor-topic', badTopic);

    if (badName) return nameEl.focus();
    if (badContact) return contactEl.focus();
    if (badTopic) return topicEl.focus();

    const formEl = $('#talk-with-terry-form');
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(formEl)).toString()
      }).catch(() => {});
    }

    const refCode = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    $('#contact-ref-code').textContent = `REF // ${refCode}`;
    $('#contact-success-summary').textContent = `Thank you, ${nameEl.value.trim()}. Terry Shelton will follow up via ${contactEl.value.trim()} within 2 business hours.`;

    const subject = encodeURIComponent(`proprieTerry Inquiry (${refCode})`);
    const body = encodeURIComponent(`Name: ${nameEl.value.trim()}\nContact: ${contactEl.value.trim()}\nScenario: ${$('#attached-estimate-payload').value || 'General inquiry'}\n\nNote:\n${topicEl.value.trim()}`);
    $('#direct-mailto-fallback').href = `mailto:terry@proprieterry.com?subject=${subject}&body=${body}`;

    $('#talk-with-terry-form').hidden = true;
    $('#contact-success-panel').hidden = false;
    announce('Your note has been sent to Terry’s desk.');
  });

  $('#reset-contact-form-btn')?.addEventListener('click', () => {
    $('#talk-with-terry-form').reset();
    $('#talk-with-terry-form').hidden = false;
    $('#contact-success-panel').hidden = true;
  });

  /* ========================================================================
     5. LIVING TERRY AI MASCOT CONCIERGE
     ======================================================================== */
  const aiDrawer = $('#terry-ai-drawer');
  const aiToggleBtn = $('#toggle-ai-drawer-btn');
  const heroAiBtn = $('#hero-ask-ai-btn');
  const aiMessages = $('#terry-ai-messages');
  const aiInput = $('#terry-ai-input');
  let heroConciergeInView = false;
  let aiOpener;

  function updateAiLauncher() {
    if (aiToggleBtn) aiToggleBtn.hidden = heroConciergeInView && document.activeElement !== aiToggleBtn;
  }

  if (heroAiBtn && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroConciergeInView = entry.intersectionRatio >= .6;
      updateAiLauncher();
    }, { rootMargin: '-77px 0px 0px 0px', threshold: .6 }).observe(heroAiBtn);
    aiToggleBtn?.addEventListener('blur', updateAiLauncher);
  }

  function setAiDrawerOpen(open, opener = document.activeElement) {
    if (!aiDrawer || !aiToggleBtn) return;
    if (open && aiDrawer.hidden) aiOpener = opener;
    aiDrawer.hidden = !open;
    aiToggleBtn.setAttribute('aria-expanded', String(open));
    heroAiBtn?.setAttribute('aria-expanded', String(open));
    if (open) {
      aiInput?.focus({ preventScroll: true });
    } else {
      const bounds = aiOpener?.getBoundingClientRect();
      const visible = bounds?.width > 0 && bounds.top < innerHeight && bounds.bottom > 77;
      (visible ? aiOpener : heroConciergeInView ? heroAiBtn : aiToggleBtn)?.focus({ preventScroll: true });
    }
  }

  function openTerryAiDrawer(initialPrompt) {
    setAiDrawerOpen(true);
    if (initialPrompt) {
      handleAiQuestion(initialPrompt);
    }
  }

  aiToggleBtn?.addEventListener('click', () => setAiDrawerOpen(aiDrawer.hidden, aiToggleBtn));
  $('#close-ai-drawer-btn')?.addEventListener('click', () => setAiDrawerOpen(false));
  heroAiBtn?.addEventListener('click', () => setAiDrawerOpen(aiDrawer.hidden, heroAiBtn));

  function appendChatMessage(text, isUser = false) {
    if (!aiMessages) return;
    const msg = document.createElement('div');
    msg.className = `chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--bot'}`;
    if (isUser) {
      msg.innerHTML = `<div class="chat-msg__bubble"><p></p></div>`;
      msg.querySelector('p').textContent = text;
    } else {
      msg.innerHTML = `
        <img src="./assets/terry-mascot.png" alt="" width="30" height="49" class="chat-msg__avatar">
        <div class="chat-msg__bubble"><p>${text}</p></div>
      `;
    }
    aiMessages.appendChild(msg);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  function buildAiReply(query) {
    const q = query.toLowerCase();
    const c = state.lastCalc;
    const totalStr = c ? fmtMoney(c.total) : '$4,530';
    const piStr = c ? fmtMoney(c.pi) : '$3,646';
    const loanStr = c ? fmtMoney(c.loanAmount) : '$600,000';

    if (q.includes('10%') || q.includes('20%')) {
      const price = c ? c.price : 750000;
      const diffCash = fmtMoney(price * 0.1);
      return `On a <strong>${fmtMoney(price)}</strong> home, 10% down keeps <strong>${diffCash}</strong> in your pocket at closing. Even with low-cost PMI, keeping liquidity often wins over a 5-year horizon—and PMI drops automatically once you reach 80% LTV.`;
    }
    if (q.includes('pre-approval') || q.includes('24')) {
      return `We issue <strong>fully underwritten pre-approvals in ~24 hours</strong>—reviewed by an actual underwriter before you make an offer, so Terry can call the listing agent personally to back you like cash.`;
    }
    if (q.includes('buydown')) {
      return `A <strong>seller-funded 2-1 buydown</strong> uses seller credits to lower your effective rate by 2% in Year 1 and 1% in Year 2—often saving 3× more monthly cash flow than an equivalent price cut.`;
    }
    if (q.includes('recast')) {
      return `With a <strong>mortgage recast</strong>, you can buy your next home with 10% down, then apply proceeds from your current home sale to reduce your principal and re-calculate a lower monthly payment—without refinancing.`;
    }
    if (q.includes('payment') || q.includes('estimate') || q.includes('explain')) {
      return `Your current scenario models a <strong>${loanStr}</strong> loan at <strong>${state.rate.toFixed(3)}%</strong> (${state.term}-yr). Principal &amp; Interest is <strong>${piStr}/mo</strong>, bringing your estimated total to <strong>${totalStr}/mo</strong>.`;
    }
    return `Great question! Right now your Payment Studio is modeled at <strong>${totalStr}/mo</strong> (${fmtMoney(c?.price || 750000)} price, ${Math.round(c?.downPct || 20)}% down). Want to book a 15-minute screen-share with Terry at <strong>248-420-6969</strong> to walk through exact options?`;
  }

  function handleAiQuestion(text) {
    const clean = text.trim();
    if (!clean) return;
    appendChatMessage(clean, true);
    setTimeout(() => {
      appendChatMessage(buildAiReply(clean), false);
    }, 240);
  }

  $('#terry-ai-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!aiInput) return;
    const val = aiInput.value;
    aiInput.value = '';
    handleAiQuestion(val);
  });

  aiInput?.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
  });

  $$('.chat-prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => handleAiQuestion(chip.dataset.chatPrompt || chip.textContent));
  });

  // Simulated voice button
  const voiceBtn = $('#voice-mic-toggle-btn');
  const voiceLabel = $('#voice-mic-status-label');
  let listening = false;
  voiceBtn?.addEventListener('click', () => {
    listening = !listening;
    voiceBtn.classList.toggle('is-listening', listening);
    voiceBtn.setAttribute('aria-pressed', String(listening));
    voiceLabel.textContent = listening ? 'Listening… tap to finish' : 'Tap to speak with Terry AI';
    if (!listening) {
      handleAiQuestion('Explain my current monthly payment estimate.');
    }
  });

  /* ========================================================================
     6. NATIVE <dialog> MODALS & .ICS DOWNLOAD
     ======================================================================== */
  const schedulerDialog = $('#scheduler-dialog');
  const assumptionsDialog = $('#assumptions-dialog');

  $('#header-book-btn')?.addEventListener('click', () => schedulerDialog?.showModal());
  $('#hero-book-btn')?.addEventListener('click', () => schedulerDialog?.showModal());
  $('#open-scheduler-btn')?.addEventListener('click', () => schedulerDialog?.showModal());
  $('#footer-scheduler-btn')?.addEventListener('click', () => schedulerDialog?.showModal());

  $('#open-assumptions-btn')?.addEventListener('click', () => assumptionsDialog?.showModal());
  $('#footer-assumptions-btn')?.addEventListener('click', () => assumptionsDialog?.showModal());

  $('#scheduler-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const slot = $('input[name="callSlot"]:checked')?.value || 'Tomorrow • 10:00 AM PT';
    const name = $('#sched-name').value.trim();
    const contact = $('#sched-contact').value.trim();
    if (!name || !contact) return;

    const schedFormEl = $('#scheduler-form');
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(schedFormEl)).toString()
      }).catch(() => {});
    }

    $('#scheduler-success-title').textContent = `${slot} held for ${name}`;
    $('#scheduler-form').hidden = true;
    $('#scheduler-success').hidden = false;
  });

  function downloadIcs(title) {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//proprieTerry Mortgage LLC//Studio//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      'DESCRIPTION:Direct 1-on-1 Mortgage Architecture Call with Terry Shelton (NMLS #420420) · 248-420-6969',
      'DTSTART:20261114T180000Z',
      'DTEND:20261114T181500Z',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proprieTerry-15min-call.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  $('#download-ics-btn')?.addEventListener('click', () => downloadIcs('proprieTerry Mortgage Strategy Call'));
  $('#scheduler-download-ics')?.addEventListener('click', () => downloadIcs('15-Min Intro Call with Terry Shelton'));

  // Initialize
  applyPreset('default');
})();
