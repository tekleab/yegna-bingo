const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Updated bot token
const BOT_TOKEN = '8019641171:AAGs1hQJybtuEHpUjaE47Tp5DYYGksDF6Sg';

const BACKEND_URL = 'https://yegna-bingo.onrender.com';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
  console.error('Please set your Telegram bot token in bot.js');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Simple in-memory session per user
const userSessions = {};

bot.start((ctx) => {
  ctx.reply('👋 Welcome to Yegna Bingo! Use /register to get started.');
});

// Registration command
bot.command('register', (ctx) => {
  ctx.reply(
    'Welcome to Yegna Bingo! Please register to start playing. Press Share Contact to register.',
    Markup.keyboard([
      Markup.button.contactRequest('Share Contact')
    ]).oneTime().resize()
  );
});

// Handle contact sharing
bot.on('contact', async (ctx) => {
  const contact = ctx.message.contact;
  const telegramId = contact.user_id.toString();
  const name = contact.first_name + (contact.last_name ? ' ' + contact.last_name : '');
  const phone = contact.phone_number;
  // Debug log
  console.log('Registering user:', { telegramId, name, phone });
  try {
    const res = await axios.post(`${BACKEND_URL}/register`, { telegramId, name, phone });
    ctx.reply(`Thank you for registering, ${name}! Your phone: ${phone}`);
    ctx.reply('Registration complete! Use /play to join a game.', Markup.removeKeyboard());
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      ctx.reply(`Registration failed: ${err.response.data.error}`);
    } else {
      ctx.reply('Registration failed. Please try again later.');
    }
  }
});

// Wallet command
bot.command('wallet', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  try {
    const res = await axios.get(`${BACKEND_URL}/wallet/${telegramId}`);
    ctx.reply(`Your wallet balance: ${res.data.balance} Birr`);
  } catch (err) {
    ctx.reply('Could not fetch wallet balance. Are you registered?');
  }
});

// Play command: choose bet and join lobby
bot.command('play', (ctx) => {
  const userId = ctx.from.id;
  userSessions[userId] = userSessions[userId] || {};
  userSessions[userId].awaitingBet = true;
  ctx.reply('Choose your bet amount:',
    Markup.keyboard([
      ['10 Birr', '20 Birr'],
      ['50 Birr', '100 Birr'],
      ['Cancel']
    ]).oneTime().resize()
  );
});

// Handle bet selection
bot.hears(/^(10|20|50|100) Birr$/, async (ctx) => {
  const userId = ctx.from.id;
  userSessions[userId] = userSessions[userId] || {};
  if (!userSessions[userId].awaitingBet) return;
  const bet = parseInt(ctx.match[1], 10);
  const telegramId = ctx.from.id.toString();
  try {
    // Join lobby
    const res = await axios.post(`${BACKEND_URL}/lobby/join`, { telegramId, bet });
    // Get lobby status
    const status = await axios.get(`${BACKEND_URL}/lobby/status/${bet}`);
    ctx.reply(
      `You joined the ${bet} Birr lobby!\nPlayers: ${status.data.players}\nPotential winnings: ${status.data.potentialWinnings} Birr`,
      Markup.keyboard([
        ['Leave Lobby']
      ]).oneTime().resize()
    );
    // Fetch available cards
    const cardsRes = await axios.get(`${BACKEND_URL}/lobby/cards/${bet}`);
    const available = cardsRes.data.available.slice(0, 10); // Show first 10
    userSessions[userId].awaitingCard = true;
    userSessions[userId].bet = bet;
    ctx.reply(
      'Select your Bingo card:',
      Markup.keyboard([
        available.map(card => card.toString()),
        ['Cancel']
      ]).oneTime().resize()
    );
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      ctx.reply(`Could not join lobby: ${err.response.data.error}`, Markup.removeKeyboard());
    } else {
      ctx.reply('Error joining lobby. Please try again.', Markup.removeKeyboard());
    }
  }
  userSessions[userId].awaitingBet = false;
});

// Handle card selection
bot.hears(/^\d+$/, async (ctx) => {
  const userId = ctx.from.id;
  userSessions[userId] = userSessions[userId] || {};
  if (!userSessions[userId].awaitingCard) return;
  const card = parseInt(ctx.match[0], 10);
  const bet = userSessions[userId].bet;
  const telegramId = ctx.from.id.toString();
  try {
    const res = await axios.post(`${BACKEND_URL}/lobby/assign_card`, { telegramId, bet, card });
    ctx.reply(`Card ${card} assigned to you!`, Markup.removeKeyboard());
    userSessions[userId].awaitingCard = false;
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      ctx.reply(`Could not assign card: ${err.response.data.error}`);
    } else {
      ctx.reply('Error assigning card. Please try again.');
    }
  }
});

// Cancel card selection
bot.hears('Cancel', (ctx) => {
  const userId = ctx.from.id;
  userSessions[userId] = userSessions[userId] || {};
  if (userSessions[userId].awaitingCard) {
    ctx.reply('Card selection cancelled.', Markup.removeKeyboard());
    userSessions[userId].awaitingCard = false;
  }
});

// Leave lobby command
bot.command('leave', async (ctx) => {
  const userId = ctx.from.id;
  const telegramId = ctx.from.id.toString();
  const bet = userSessions[userId] && userSessions[userId].bet;
  if (!bet) {
    ctx.reply('You are not in a lobby.');
    return;
  }
  try {
    await axios.post(`${BACKEND_URL}/lobby/leave`, { telegramId, bet });
    ctx.reply('You have left the lobby.', Markup.removeKeyboard());
    userSessions[userId] = {};
  } catch (err) {
    ctx.reply('Could not leave lobby.');
  }
});

// Handle Leave Lobby button
bot.hears('Leave Lobby', async (ctx) => {
  const userId = ctx.from.id;
  const telegramId = ctx.from.id.toString();
  const bet = userSessions[userId] && userSessions[userId].bet;
  if (!bet) {
    ctx.reply('You are not in a lobby.');
    return;
  }
  try {
    await axios.post(`${BACKEND_URL}/lobby/leave`, { telegramId, bet });
    ctx.reply('You have left the lobby.', Markup.removeKeyboard());
    userSessions[userId] = {};
  } catch (err) {
    ctx.reply('Could not leave lobby.');
  }
});

// Launch Game command (Telegram Web App)
bot.command('launch', (ctx) => {
  ctx.reply('Tap below to launch the Bingo game UI:',
    Markup.keyboard([
      [Markup.button.webApp('Launch Game', 'https://yegna-bingo-7fp5.vercel.app')]
    ]).resize()
  );
});

// Add more commands and logic here

bot.launch();

console.log('Yegna Bingo Telegram bot is running!'); 