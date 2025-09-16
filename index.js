import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Telegraf } from 'telegraf';

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_ADMIN_USER_ID,
  PUBLIC_WEBAPP_URL,
  PRICE_XTR = '299',
  CHANNEL_USERNAME
} = process.env;

if (!TELEGRAM_BOT_TOKEN) { console.error('No TELEGRAM_BOT_TOKEN'); process.exit(1); }

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const app = express();
app.use(cors());
app.use(bodyParser.json());

// /start
bot.start((ctx) => ctx.reply('Привет! Нажмите кнопку Mini App в меню бота.'));

// Кнопка открыть WebApp из ЛС
bot.command('menu', (ctx) => ctx.reply('Открыть карту:', {
  reply_markup: { inline_keyboard: [[{ text: 'Запустить', web_app: { url: PUBLIC_WEBAPP_URL } }]] }
}));

// Команда /post — отправить в канал кнопку и закрепить вручную
bot.command('post', async (ctx) => {
  if (ctx.from.id.toString() !== TELEGRAM_ADMIN_USER_ID) return ctx.reply('⛔ Нет прав.');
  if (!CHANNEL_USERNAME) return ctx.reply('⚠️ CHANNEL_USERNAME не задан.');
  await bot.telegram.sendMessage(CHANNEL_USERNAME, '🌍 Открыть карту ПРИП:', {
    reply_markup: { inline_keyboard: [[{ text: 'Запустить карту', web_app: { url: PUBLIC_WEBAPP_URL } }]] }
  });
  await ctx.reply('✅ Отправлено в канал. Закрепите сообщение в канале.');
});

// Stars (инвойс по запросу из WebApp, если понадобится)
app.post('/invoice', async (req, res) => {
  try {
    const { beneficiaryTelegramId, label = 'PRO 30 дней' } = req.body || {};
    if (!beneficiaryTelegramId) return res.status(400).json({ error: 'beneficiaryTelegramId required' });
    const amountMilli = Number(PRICE_XTR) * 1000;
    const payload = JSON.stringify({ kind: 'sub_pro', beneficiary: beneficiaryTelegramId });
    const link = await bot.telegram.createInvoiceLink({
      title: 'Подписка PRO',
      description: 'Доступ на 30 дней',
      currency: 'XTR',
      prices: [{ label, amount: amountMilli }],
      payload
    });
    res.json({ url: link });
  } catch (e) { console.error(e); res.status(500).json({ error: 'failed_to_create_invoice' }); }
});

// Платёжные события
bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));
bot.on('successful_payment', (ctx) => ctx.reply('✅ Оплата прошла. Подписка активирована!'));

// Webhook endpoint (если нужен)
app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => { bot.handleUpdate(req.body, res); res.sendStatus(200); });
app.get('/', (_req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('HTTP :' + PORT));
bot.launch().then(()=>console.log('Bot started')).catch(console.error);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
