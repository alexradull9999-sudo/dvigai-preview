import { QUESTIONS, METHODS } from './quiz-data.mjs';
import { recommend } from './quiz-recommendations.mjs';

const root = document.querySelector('#growth-quiz');
if (root) mount(root);

function mount(root) {
  const $ = selector => root.querySelector(selector);
  const answers = Array(QUESTIONS.length).fill(null);
  let step = 0, sending = false, method = 'telegram', fingerprint = '', submissionId = '';
  const contacts = { telegram: '', max: '', whatsapp: '' };
  const question = $('#quiz-question-panel'), contactPanel = $('#quiz-contact-panel'), resultPanel = $('#quiz-result');
  const options = $('#quiz-options'), next = $('#quiz-next'), back = $('#quiz-back');
  const form = $('#quiz-form'), contact = $('#quiz-contact'), consent = $('#quiz-consent'), error = $('#quiz-error');
  const panelHeading = () => step < 5 ? $('#quiz-question-title') : $('#quiz-contact-title');
  function signal(name) { window.dispatchEvent(new CustomEvent('dvigai:quiz', { detail: { event: name, step: step + 1 } })); }
  function animate(panel) {
    panel.classList.remove('quiz-enter');
    void panel.offsetWidth;
    panel.classList.add('quiz-enter');
  }
  function progress(completed = false) {
    $('#quiz-status').textContent = completed ? 'Ваш первый шаг' : step < 5 ? `Вопрос ${step + 1} из 5` : '5 ответов · последний шаг';
    $('#quiz-progress').style.width = `${Math.min(100, (step + 1) * 20)}%`;
    [...root.querySelectorAll('.quiz-route li')].forEach((dot, i) => {
      dot.classList.toggle('is-done', i < step || completed);
      dot.classList.toggle('is-current', i === step && !completed);
      if (i === step && !completed) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
    });
  }
  function render(focus = true) {
    question.hidden = step >= 5; contactPanel.hidden = step < 5; resultPanel.hidden = true;
    progress();
    if (step < 5) {
      const q = QUESTIONS[step];
      $('#quiz-question-title').textContent = q.title;
      $('#quiz-question-note').textContent = q.note;
      options.replaceChildren();
      q.options.forEach((title, i) => {
        const label = document.createElement('label'); label.className = 'quiz-option';
        const input = document.createElement('input'); input.type = 'radio'; input.name = 'quiz-answer'; input.value = String(i); input.checked = answers[step] === i;
        const text = document.createElement('span'); text.textContent = title;
        label.append(input, text); options.append(label);
        input.addEventListener('change', () => { answers[step] = i; next.disabled = false; signal('answer'); });
      });
      back.hidden = step === 0; $('#quiz-back-space').hidden = step > 0;
      next.disabled = answers[step] === null;
      next.replaceChildren(document.createTextNode(step === 4 ? 'К рекомендациям ' : 'Далее '));
      const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true'); next.append(arrow);
    }
    animate(step < 5 ? question : contactPanel);
    if (focus) panelHeading().focus({ preventScroll: true });
    // Move only when the new question would otherwise be above the visible viewport.
    if (focus && root.getBoundingClientRect().top < -80) $('.quiz-main').scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  next.addEventListener('click', () => { if (answers[step] === null) return; step++; render(); signal(step === 5 ? 'contact' : 'next'); });
  back.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
  $('#quiz-contact-back').addEventListener('click', () => { if (!sending) { step = 4; render(); } });
  function clearError() { error.hidden = true; contact.setCustomValidity(''); contact.removeAttribute('aria-invalid'); }
  function selectMethod() {
    contacts[method] = contact.value;
    method = form.querySelector('input[name="quiz-method"]:checked').value;
    contact.value = method === 'telegram' ? '@demo_contact' : '+7 (000) 000-00-00';
    const telegram = method === 'telegram';
    $('#quiz-contact-label').textContent = telegram ? 'Telegram: @username или телефон' : `Номер телефона в ${METHODS[method]}`;
    $('#quiz-contact-help').textContent = 'Демонстрация: реальные контакты вводить не нужно.';
    contact.type = telegram ? 'text' : 'tel'; contact.inputMode = telegram ? 'text' : 'tel';
    contact.autocomplete = telegram ? 'off' : 'tel'; contact.placeholder = telegram ? '@username или +7…' : '+7 (___) ___-__-__';
    clearError();
  }
  form.querySelectorAll('input[name="quiz-method"]').forEach(input => input.addEventListener('change', selectMethod));
  contact.addEventListener('input', clearError);
  consent.addEventListener('change', clearError);
  function showError(message) { error.textContent = message; error.hidden = false; error.focus(); }
  function showResult(result) {
    question.hidden = contactPanel.hidden = true; resultPanel.hidden = false;
    progress(true);
    $('#quiz-receipt').textContent = `Пример результата · данные не отправлялись`;
    for (const [id, key] of [['title','title'],['intro','intro'],['why','why'],['cycle','cycleNote'],['team','teamNote'],['caveat','caveat']]) $('#quiz-result-' + id).textContent = result[key];
    for (const key of ['steps', 'metrics']) {
      const list = $('#quiz-result-' + key); list.replaceChildren();
      result[key].forEach(text => { const li = document.createElement('li'); li.textContent = text; list.append(li); });
    }
    animate(resultPanel); $('#quiz-result-title').focus({ preventScroll: true });
    if ($('.quiz-main').getBoundingClientRect().top < 0) $('.quiz-main').scrollIntoView({ behavior: 'instant', block: 'start' });
    signal('preview');
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    showResult(recommend([...answers]));
  });
  $('#quiz-restart').addEventListener('click', () => {
    answers.fill(null); step = 0; fingerprint = submissionId = ''; form.reset(); contact.value = '';
    contacts.telegram = contacts.max = contacts.whatsapp = ''; method = 'telegram'; selectMethod(); render();
  });
  selectMethod();
  render(false);
}
