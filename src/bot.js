const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const token = fs.readFileSync(path.join(__dirname, '../database/apikey.txt'), 'utf8').trim();
const bot = new TelegramBot(token, {polling: true});

const User = require('./user.js').User

const chatStatesPath = path.join(__dirname, '../database/chatStates.json');
const teamCode = 'raceteam';

freeStateHandle = (msg, user) => {
    switch (msg.text.toLowerCase()) {
        case '/create_ticket':
            user.state = 'creating_ticket';
            bot.sendMessage(msg.chat.id, `
                Що трапилось з вашим велосипедом?! Опишіть детально:
                \n- З чим пов'язана ваша проблема? (Перемикання передач, гальма, колеса і т.д.)
                \n- Детально і лаконічно опишіть проблему, поважайте механіка йому це все читати, а головне розуміти! -Тому не жалійте часу
                \n- Опишіть свій велосипед, для того що б мехінік міг його знайти`);
            break;
        case '/my_tickets':
            if (user.tickets.length > 0) {
                let ticketsList = user.tickets.map((ticket, index) => {
                    return `${index + 1}. ${ticket.description} (Статус: ${ticket.status})`;
                }).join('\n');
                bot.sendMessage(msg.chat.id, `Ваші заявки:\n${ticketsList}`);
            }
            else {
                bot.sendMessage(msg.chat.id, `У вас немає жодної заявки.`);
            }
        default:
            break;
    }   
}

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
            if (msg.text.toLowerCase() == 'спортсмен' || msg.text.toLowerCase() == 'механік') {
                user.role = (msg.text.toLowerCase() === 'спортсмен') ? 'athlete' : 'mechanic';
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
        case "creating_ticket":
            if (msg.text && msg.text.trim() !== '') {
                user.tickets.push({
                    description: msg.text.trim(),
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });
                user.state = 'free';
                user.saveUser().then(() => {
                    bot.sendMessage(msg.chat.id, `Ваша заявка на обслуговування створена! Очікуйте на відповідь механіка.`);
                }).catch(err => {
                    console.error(`Error saving ticket: ${err}`);
                    bot.sendMessage(msg.chat.id, `Виникла помилка при створенні заявки. Спробуйте ще раз.`);
                });
            }
        default:
            freeStateHandle(msg, user);
            break;
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