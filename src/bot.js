const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const token = fs.readFileSync(path.join(__dirname, '../database/apikey.txt'), 'utf8').trim();
const bot = new TelegramBot(token, {polling: true});

const User = require('./user.js').User
const Ticket = require('./ticket.js').Ticket;

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
            Ticket.getTicketsByUser(user.chatId).then(tickets => {
                if (tickets.length > 0) {
                    bot.sendMessage(msg.chat.id, `Ваші заявки:\n${tickets.map(t => `ID: ${t.id}, Статус: ${t.status}, Текст: ${t.text}`).join('\n')}`);
                }
                else {
                    bot.sendMessage(msg.chat.id, `У вас немає жодної заявки.`);
                }
            }).catch(err => {
                console.error(`Error fetching tickets: ${err}`);
                user.state = 'free';
                bot.sendMessage(msg.chat.id, `Виникла помилка при отриманні ваших заявок. Спробуйте ще раз.`);
            });
            break;
        case '/view_tickets':
            if (user.role == 'mechanic') {
                Ticket.getAllTickets().then(tickets => {
                    if (tickets.length > 0) {
                        bot.sendMessage(msg.chat.id, `Заявки спортсменів:\n${tickets.map(t => `ID: ${t.id}, Автор: ${t.authorName}, Статус: ${t.status}, Текст: ${t.text}`).join('\n')}`);
                    } else {
                        bot.sendMessage(msg.chat.id, `Немає жодних заявок від спортсменів.`);
                    }
                }).catch(err => {
                    console.error(`Error fetching tickets: ${err}`);
                    bot.sendMessage(msg.chat.id, `Виникла помилка при отриманні заявок. Спробуйте ще раз.`);
                });
            }
            else {
                bot.sendMessage(msg.chat.id, `Ви не маєте доступу до цієї команди.`);
            }
            break;
        case '/delete_my_data':
            bot.sendMessage(msg.chat.id, `Ви впевнені, що хочете видалити всі ваші дані? Введіть "Так" для підтвердження.`);
            user.state = 'deleting_data';
            break
        case '/take_ticket':
            if (user.role == 'mechanic') {
                bot.sendMessage(msg.chat.id, `Введіть ID заявки, яку ви хочете взяти в роботу.`);
                user.state = 'taking_ticket';
            }
            else {
                bot.sendMessage(msg.chat.id, `Ви не маєте доступу до цієї команди.`);
            }
            break
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
                user.addTicket(msg.text.trim(), user.name).then(() => {
                    bot.sendMessage(msg.chat.id, `Ваша заявка на обслуговування була створена!`);
                    user.state = 'free';
                }).catch(err => {
                    console.error(`Error creating ticket: ${err}`);
                    bot.sendMessage(msg.chat.id, `Виникла помилка при створенні заявки. Спробуйте ще раз.`);
                });
            }
            break;
        case "deleting_data":
            if (msg.text.toLowerCase() === 'так') {
                user.deleteUser().then(() => {
                    bot.sendMessage(msg.chat.id, `Ваші дані були успішно видалені.`);
                }).catch(err => {
                    console.error(`Error deleting user data: ${err}`);
                    bot.sendMessage(msg.chat.id, `Виникла помилка при видаленні ваших даних. Спробуйте ще раз.`);
                });
            }
            else {
                bot.sendMessage(msg.chat.id, `Ви скасували видалення даних.`);
                user.state = 'free';
            }
            break
        case 'taking_ticket': 
            if (user.role === 'mechanic') {
                const ticketId = parseInt(msg.text.trim(), 10);
                Ticket.readTicket(ticketId).then(ticket => {
                    if (ticket) {
                        ticket.mechanic = user.chatId;
                        ticket.status = 'in_progress';
                        ticket.saveTicket().then(() => {
                            bot.sendMessage(msg.chat.id, `Ви успішно взяли заявку номер ${ticket.id} в роботу.`)
                            bot.sendMessage(ticket.author, `Ваша заявка ID: ${ticket.id} була взята в роботу механіком ${user.name}.`)
                            bot.sendMessage(msg.chat.id, ticket.text);
                            user.state = 'free';
                        }).catch(err => {
                            console.error(`Error saving ticket: ${err}`);
                            bot.sendMessage(msg.chat.id, `Виникла помилка при взятті заявки в роботу. Спробуйте ще раз.`);
                        });
                    } else {
                        bot.sendMessage(msg.chat.id, `Заявка з ID: ${ticketId} не знайдена.`);
                    }
                }).catch(err => {
                    console.error(`Error fetching ticket: ${err}`);
                    bot.sendMessage(msg.chat.id, `Виникла помилка при отриманні заявки. Спробуйте ще раз.`);
                });
            } else {
                bot.sendMessage(msg.chat.id, `Ви не маєте доступу до цієї команди.`);
                user.state = 'free';
            }
            break;
        default:
            freeStateHandle(msg, user);
            break;
    }
}


bot.on('message', (msg) => {
    User.readUserData(msg.chat.id).then((user) => {
        if (user.state === 'new') {
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