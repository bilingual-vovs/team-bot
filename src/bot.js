const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const token = fs.readFileSync(path.join(__dirname, '../database/apikey.txt'), 'utf8').trim();
const bot = new TelegramBot(token, {polling: true});

const User = require('./user.js');

const chatStatesPath = path.join(__dirname, '../database/chatStates.json');
const teamCode = 'RaceTeam';

const handleMsg = (msg, state) => {
    
}


bot.on('message', (msg) => {
    const user = new User()
    user.readUserData(msg.chat.id).then((user) => {
        console.log(user.state)
    })
    .catch((err) => {
        console.error(`Error reading user data: ${err}`);
    });
});


bot.on('polling_error', (error) => {
  console.log(`[polling_error] ${error.code}: ${error.message}`);
});