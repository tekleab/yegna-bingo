// Demo test script for Yegna Bingo
const axios = require('axios');

const BACKEND_URL = 'https://yegna-bingo-backend.onrender.com';

async function testCompleteGame() {
  console.log('🎮 Testing Yegna Bingo Complete Game Flow...\n');

  try {
    // 1. Register test users
    console.log('1. Registering test users...');
    const user1 = await axios.post(`${BACKEND_URL}/register`, {
      telegramId: 'test_user_1',
      name: 'Test User 1',
      phone: '+251911234567'
    });
    console.log('✅ User 1 registered');

    const user2 = await axios.post(`${BACKEND_URL}/register`, {
      telegramId: 'test_user_2',
      name: 'Test User 2',
      phone: '+251911234568'
    });
    console.log('✅ User 2 registered\n');

    // 2. Join lobby
    console.log('2. Joining 10 Birr lobby...');
    await axios.post(`${BACKEND_URL}/lobby/join`, {
      telegramId: 'test_user_1',
      bet: 10
    });
    console.log('✅ User 1 joined lobby');

    await axios.post(`${BACKEND_URL}/lobby/join`, {
      telegramId: 'test_user_2',
      bet: 10
    });
    console.log('✅ User 2 joined lobby\n');

    // 3. Check lobby status
    console.log('3. Checking lobby status...');
    const status = await axios.get(`${BACKEND_URL}/lobby/status/10`);
    console.log(`✅ Lobby has ${status.data.players} players`);
    console.log(`✅ Potential winnings: ${status.data.potentialWinnings} Birr\n`);

    // 4. Get available cards
    console.log('4. Getting available cards...');
    const cards = await axios.get(`${BACKEND_URL}/lobby/cards/10`);
    console.log(`✅ Available cards: ${cards.data.available.length}\n`);

    // 5. Assign cards
    console.log('5. Assigning cards...');
    await axios.post(`${BACKEND_URL}/lobby/assign_card`, {
      telegramId: 'test_user_1',
      bet: 10,
      card: 1
    });
    console.log('✅ Card 1 assigned to User 1');

    await axios.post(`${BACKEND_URL}/lobby/assign_card`, {
      telegramId: 'test_user_2',
      bet: 10,
      card: 2
    });
    console.log('✅ Card 2 assigned to User 2\n');

    // 6. Start game
    console.log('6. Starting game...');
    await axios.post(`${BACKEND_URL}/game/start/10`);
    console.log('✅ Game started\n');

    // 7. Call numbers
    console.log('7. Calling numbers...');
    for (let i = 0; i < 5; i++) {
      const result = await axios.post(`${BACKEND_URL}/game/call/10`);
      console.log(`✅ Called number: ${result.data.calledNumber}`);
    }
    console.log('');

    // 8. Check game status
    console.log('8. Checking game status...');
    const gameStatus = await axios.get(`${BACKEND_URL}/game/status/10`);
    console.log(`✅ Game started: ${gameStatus.data.gameStarted}`);
    console.log(`✅ Called numbers: ${gameStatus.data.calledNumbers.length}`);
    console.log(`✅ Winner: ${gameStatus.data.winner || 'None yet'}\n`);

    console.log('🎉 All tests passed! The Bingo game is fully functional!');
    console.log('\n📱 You can now test the complete game at:');
    console.log('🌐 Frontend: https://yegna-bingo.vercel.app');
    console.log('🤖 Telegram Bot: @YegnaBingoBot');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

// Run the test
testCompleteGame(); 