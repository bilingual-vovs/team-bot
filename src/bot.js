const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const token = fs.readFileSync(path.join(__dirname, '../database/apikey.txt'), 'utf8').trim();
const bot = new TelegramBot(token, {polling: true});

const User = require('./user.js').User

const chatStatesPath = path.join(__dirname, '../database/chatStates.json');
const teamCode = 'raceteam';

const handleMsg = (msg, user) => {
    switch (user.state) {
        case "started":
            if (msg.text.toLowerCase() === teamCode) {
                user.state = 'naming';
                bot.sendMessage(msg.chat.id, `Вітаємо! Тепер введіть ваше ім'я для реєстрації.`);
                
            } else {
                bot.sendMessage(msg.chat.id, `Невірний код команди. Спробуйте ще раз.`);
            }
            break;
        case "naming":
            if (msg.text && msg.text.trim() !== '') {
                user.name = msg.text.trim();
                user.state = 'role-selection';
                bot.sendMessage(msg.chat.id, `Дякуємо, ${user.name}! \nВибери свою роль: Спортсмен або Механік`, {
                    reply_markup: JSON.stringify({
                    keyboard: [
                        ['Спортсмен'],
                        ['Механік']
                    ]
                    })
                });
            } else {
                bot.sendMessage(msg.chat.id, `Будь ласка, введіть коректне ім'я.`);
            }
            break;
        case "role-selection":
            console.log(msg.text.toLowerCase());
            if (msg.text.toLowerCase() == 'cпортсмен' || msg.text.toLowerCase() == 'механік') {
                user.role = (msg.text.toLowerCase() === 'cпортсмен') ? 'athlete' : 'mechanic';
                user.state = 'free';
                user.authorized = true;
                bot.sendMessage(msg.chat.id, 
                    `Тепер ти успішно зареєстрований як ${(user.role === 'athlete') ? 'спортсмен' : 'механік'}!
                    \nОсь що може цей бот:
                    ${(user.role === 'athlete') ? 
                        `\n- Створити заявку на обслуговування: /create_ticket
                        \n- Переглядати свої заявки: /my_tickets
                        \n- Отримувати сповіщення про нові квитки`
                    :
                        `\n- Переглядати заявки спортсменів: /view_tickets`
                    }`);
            } else {
                bot.sendMessage(msg.chat.id, `Будь ласка, виберіть роль зі списку.`);
            }
    }
}


bot.on('message', (msg) => {
    User.readUserData(msg.chat.id).then((user) => {
        if (user.state === 'new') {
            user.saveUser()
            user.state = 'started'
            bot.sendMessage(msg.chat.id, `Привіт, для того що б почати користуватися ботом, введи код команди`);
        }
        else {
            handleMsg(msg, user);
        }
        
    })
    .catch((err) => {
        console.error(`Error reading user data: ${err}`);
    });
});


bot.on('polling_error', (error) => {
  console.log(`[polling_error] ${error.code}: ${error.message}`);
});