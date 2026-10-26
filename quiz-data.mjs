export const QUIZ_VERSION = 1;
export const CONSENT_VERSION = 'quiz-contact-2026-10-26';
export const CONSENT_TEXT = 'Согласен, чтобы «Двигай» использовало мои ответы и контакт для связи и отправки рекомендаций по этому запросу.';
export const METHODS = { telegram: 'Telegram', max: 'MAX', whatsapp: 'WhatsApp' };
export const QUESTIONS = [
  { title: 'Что сейчас больше всего мешает росту?', note: 'Выберите то, что беспокоит сильнее всего.', options: ['Мало заявок', 'Заявки не превращаются в продажи', 'Прибыль не растёт', 'Непонятно, что работает'] },
  { title: 'Как обычно клиент принимает решение о покупке?', note: 'Это поможет учесть ваш цикл продажи.', options: ['Покупает сразу', 'После консультации', 'После длительных переговоров'] },
  { title: 'Какие результаты маркетинга вы отслеживаете?', note: 'Выберите самый подробный уровень, который доступен вам сейчас.', options: ['Расходы и заявки', 'Оплаченных клиентов по источникам', 'Стоимость клиента и окупаемость', 'Точных данных нет'] },
  { title: 'Разбираете ли вы, почему заявки не превращаются в продажи?', note: 'Ориентируйтесь на то, как работа устроена на практике.', options: ['Регулярно, фиксируем причины', 'Иногда обсуждаем', 'Почти не разбираем'] },
  { title: 'Как выбираются задачи маркетинга?', note: 'Последний вопрос — о том, как решения превращаются в действия.', options: ['Есть общий план, показатели и ответственный', 'Каждый подрядчик предлагает своё', 'Решаем проблемы по мере появления'] },
];

export function validAnswers(answers) {
  return Array.isArray(answers) && answers.length === QUESTIONS.length &&
    answers.every((answer, i) => Number.isInteger(answer) && answer >= 0 && answer < QUESTIONS[i].options.length);
}

export function normalizeContact(value, method) {
  if (!Object.hasOwn(METHODS, method) || typeof value !== 'string' || value.length > 80) return null;
  const input = value.trim();
  if (method === 'telegram' && /^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(input)) return input;
  if (!/^\+?[\d\s()–-]+$/.test(input)) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return input.startsWith('+') ? '+' + digits : digits.length === 11 && digits[0] === '8' ? '+7' + digits.slice(1) : '+' + digits;
}
