const { telegramBotToken, telegramChatId, isTest } = require('../config/env');

const enabled = Boolean(telegramBotToken && telegramChatId) && !isTest;

// Отправляет сообщение в Telegram-чат через Bot API. Ошибки отправки не роняют сервер.
async function sendTelegram(text) {
  if (!enabled) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: text.slice(0, 4000),
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { sendTelegram, telegramEnabled: enabled };
