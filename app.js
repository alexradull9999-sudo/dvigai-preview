(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reduceMotion.matches;
  let engine = null;
  const motionButton = $('.motion-toggle');
  function updateMotion() {
    document.body.classList.toggle('motion-paused', motionPaused);
    document.documentElement.classList.toggle('motion-off', motionPaused);
    motionButton.setAttribute('aria-pressed', String(motionPaused));
    motionButton.disabled = reduceMotion.matches;
    motionButton.textContent = reduceMotion.matches ? 'Анимация отключена в системе' : motionPaused ? 'Анимация: выключена' : 'Анимация: включена';
    if (motionPaused && engine) { engine.destroy(); engine = null; }
    if (!motionPaused && !engine && window.ScrollCraft) engine = window.ScrollCraft.mount(document.body);
    window.dispatchEvent(new CustomEvent('dvigai:motion', { detail: { paused: motionPaused, systemReduced: reduceMotion.matches } }));
  }
  motionButton.addEventListener('click', () => { motionPaused = !motionPaused; updateMotion(); });
  reduceMotion.addEventListener('change', () => { motionPaused = reduceMotion.matches; updateMotion(); });
  updateMotion();

  const menu = $('#mobile-nav');
  const menuButton = $('.menu-toggle');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Открыть меню'); }
  menuButton.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    menuButton.setAttribute('aria-expanded', String(!menu.hidden));
    menuButton.setAttribute('aria-label', menu.hidden ? 'Открыть меню': 'Закрыть меню');
  });
  $$('a', menu).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });

  let leadContext = '';

  const caseData = {
    sanatera: { category: 'МЕДИЦИНА / САНАТЕРА', title: 'Рост через экономику бизнеса.', result: 'Чистая месячная прибыль: ≈ 3,5 → 7 млн ₽ за год.', blocks: [
      ['Что было в фокусе', 'Связать привлечение пациентов, расходы и повторные обращения с результатом всего бизнеса.'],
      ['Какие направления меняли', ['Работа с сегментами аудитории и рекламными каналами.', 'Повышение эффективности расходов.', 'Реактивация базы и повторные обращения.', 'Работа с колл-центром и путь пациента до обращения.']],
      ['Как читать результат', 'Показатель относится к чистой прибыли бизнеса с учётом расходов и налогов. Это результат в период совместной работы, а не эффект одной рекламной кампании.'] ] },
    institute: { category: 'ОБРАЗОВАНИЕ / ИНСТИТУТ МИЛТОНА ЭРИКСОНА', title: 'Соединить предложение с продажами.', result: 'Месячный оборот: 1,8 → ≈ 5 млн ₽ примерно за 3 месяца.', blocks: [
      ['Исходная ситуация', 'Реклама в Яндекс Директе уже работала. Задача требовала работы с системой привлечения и продаж, а не запуска одного канала с нуля.'],
      ['Что вошло в работу', ['Уточнение офферов и продуктовые посадочные страницы.', 'Работа с действующей рекламой и SEO.', 'CRM и связь маркетинга с продажами.']],
      ['Как читать результат', 'Это месячный оборот бизнеса, а не чистая прибыль и не результат запуска одного курса. Период изменения: примерно три месяца.'] ] },
    b2b: { category: 'СЛОЖНЫЙ ТЕХНИЧЕСКИЙ B2B / NDA', title: 'Управлять длинным путём к сделке.', result: 'Квалифицированное обращение → продажа → маржа.', blocks: [
      ['Задача', 'Выстроить маркетинг сложного технического продукта с длинным циклом сделки.'],
      ['Логика управления', ['Разделять все обращения и квалифицированные лиды.', 'Связывать маркетинг с движением сделок в продажах.', 'Оценивать результаты с учётом выручки, маржи и длительности цикла.']],
      ['О конфиденциальности', 'Название компании и идентифицирующие детали не раскрываются. Здесь показан подход к проекту без закрытых данных.'] ] }
  };
  const caseDialog = $('#case-dialog');
  const leadDialog = $('#lead-dialog');
  const returnFocus = new WeakMap();
  function openDialog(dialog, trigger) {
    returnFocus.set(dialog, trigger);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('is-dialog-open');
  }
  function closeDialog(dialog) { dialog.close(); }
  [caseDialog, leadDialog].forEach(dialog => {
    $('.dialog-close', dialog).addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) {
        document.body.classList.remove('is-dialog-open');
        const target = returnFocus.get(dialog);
        if (target?.isConnected && !target.closest('dialog:not([open])')) target.focus({preventScroll:true});
      }
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(dialog);
    });
  });
  $$('[data-case]').forEach(button => button.addEventListener('click', () => {
    const data = caseData[button.dataset.case];
    $('#dialog-category').textContent = data.category;
    $('#dialog-title').textContent = data.title;
    $('#dialog-result').textContent = data.result;
    const target = $('#dialog-content'); target.replaceChildren();
    data.blocks.forEach(([heading, content]) => {
      const h3 = document.createElement('h3'); h3.textContent = heading; target.append(h3);
      if (Array.isArray(content)) { const ul = document.createElement('ul'); content.forEach(text => { const li = document.createElement('li'); li.textContent = text; ul.append(li); }); target.append(ul); }
      else { const p = document.createElement('p'); p.textContent = content; target.append(p); }
    });
    openDialog(caseDialog, button);
  }));

  const form = $('#lead-form');
  const phone = $('#lead-phone');
  const messenger = $('#lead-messenger');
  const review = $('#lead-review');
  const labels = {telegram:'Telegram',max:'MAX',phone:'По телефону'};
  let preparedLead = '';
  let deliveryReady = false;
  let checkingDelivery = false;
  let sendingLead = false;
  let leadSent = false;
  const deliveryNote = $('#delivery-note');
  const submitLabel = $('.submit-label', form);
  const leadError = $('#lead-error');
  function updateDelivery() {
    submitLabel.textContent = sendingLead ? 'Отправляем…' : checkingDelivery ? 'Подождите…' : deliveryReady ? 'Отправить заявку' : 'Проверить заявку';
    $('.lead-submit', form).disabled = checkingDelivery || sendingLead;
    deliveryNote.textContent = deliveryReady
      ? 'Заявка поступит команде «Двигай» в Telegram. Ответим выбранным вами способом.'
      : 'Это демонстрационная копия. Заявки не отправляются.';
  }
  function checkDelivery() {
    deliveryReady = false;
    checkingDelivery = false;
    updateDelivery();
  }
  let activeMethod = 'telegram';
  const messengerDrafts = {telegram:'',max:''};
  function selectMethod() {
    const method = $('input[name="contactMethod"]:checked', form).value;
    if (activeMethod !== 'phone') messengerDrafts[activeMethod] = messenger.value;
    messenger.value = method === 'phone' ? '' : messengerDrafts[method];
    activeMethod = method;
    $('#messenger-field').hidden = method === 'phone';
    messenger.disabled = method === 'phone';
    messenger.placeholder = method === 'max' ? 'Ссылка на профиль MAX' : '@username';
  }
  $$('input[name="contactMethod"]').forEach(input => input.addEventListener('change',selectMethod));
  function openLead(trigger, context) {
    if (context && !sendingLead && !leadSent) leadContext = context;
    $('#lead-context').textContent = leadContext;
    $('#lead-context').hidden = !leadContext;
    if (!leadSent) { form.hidden = false; review.hidden = true; }
    openDialog(leadDialog, trigger?.closest('#mobile-nav') ? menuButton : trigger);
    if (leadSent) $('#review-title').focus({preventScroll:true});
    else if (!sendingLead) phone.focus({preventScroll:true});
    checkDelivery();
  }
  $('#lead-form .lead-fields').disabled = false;
  $$('[data-lead-open]').forEach(button => {button.disabled = false;});
  $$('a[href="#contact"]:not(.journey-step),[data-lead-open]').forEach(trigger => {
    trigger.setAttribute('aria-haspopup','dialog');
    trigger.setAttribute('aria-controls','lead-dialog');
    trigger.addEventListener('click',event => {
      event.preventDefault();
      const context = trigger.dataset.format ? 'Интересует: '+trigger.dataset.format : '';
      openLead(trigger,context);
    });
  });
  $('.dialog-cta').addEventListener('click', () => {
    const trigger = returnFocus.get(caseDialog);
    const context = 'Похожая задача. Кейс: '+$('#dialog-category').textContent;
    closeDialog(caseDialog);
    openLead(trigger,context);
  });
  phone.addEventListener('input',()=>phone.setCustomValidity(''));
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if (sendingLead || checkingDelivery) return;
    leadError.hidden = true;
    const value=phone.value.trim(), digits=value.replace(/\D/g,'');
    const valid=/^\+?[\d\s()–-]+$/.test(value)&&digits.length>=10&&digits.length<=15;
    phone.setCustomValidity(valid?'':'Укажите номер телефона: от 10 до 15 цифр, с кодом страны.');
    if(!form.reportValidity()) return;
    const method=$('input[name="contactMethod"]:checked',form).value;
    const rows=[['Телефон',value],['Способ связи',labels[method]]];
    if(method!=='phone'&&messenger.value.trim()) rows.push(['Профиль',messenger.value.trim()]);
    if(leadContext) rows.push(['Задача',leadContext]);
    const summary=$('#lead-summary'); summary.replaceChildren();
    rows.forEach(([key,text])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=text;div.append(dt,dd);summary.append(div);});
    preparedLead='Двигай. Заявка на обсуждение маркетинга\n\n'+rows.map(([key,text])=>key+': '+text).join('\n');
    // Public review copy: no network request or lead storage.
    $('#review-title').textContent = leadSent ? 'Заявка отправлена.' : 'Заявка подготовлена.';
    $('#review-note').textContent = leadSent
      ? 'Заявка поступила в Telegram команды «Двигай». Свяжемся с вами выбранным способом.'
      : 'Это пример заявки. Данные не отправлялись.';
    $('#edit-lead').textContent = leadSent ? 'Новая заявка' : 'Изменить данные';
    form.hidden=true;review.hidden=false;$('#review-title').focus({preventScroll:true});leadDialog.scrollTop=0;
  });
  $('#edit-lead').addEventListener('click',()=>{leadSent=false;review.hidden=true;form.hidden=false;leadError.hidden=true;phone.focus({preventScroll:true});checkDelivery();});
  $('#download-lead').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob(['\uFEFF'+preparedLead],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='dvigai-request.txt';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  selectMethod();
})();
