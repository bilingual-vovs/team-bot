const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const token = fs.readFileSync(path.join(__dirname, 'apikey.txt'), 'utf8').trim();
const bot = new TelegramBot(token, {polling: true});

const chatStatesPath = path.join(__dirname, 'chatStates.json');
const teamCode = 'RaceTeam'

function getChatState(chatId) {
    return new Promise((resolve, reject) => {
        fs.readFile(chatStatesPath, 'utf8', (err, data) => {
            if (err) return reject(err);
            let states;
            try {
                states = JSON.parse(data);
            } catch (e) {
                return reject(e);
            }
            if (states && states[chatId]) {
                resolve(states[chatId]);
            } else {
                reject(new Error('No state for this chat id'));
            }
        });
    });
}
function setChatState(chatId, state) {
    return new Promise((resolve, reject) => {
        fs.readFile(chatStatesPath, 'utf8', (err, data) => {
            let states = {};
            if (!err && data) {
                try {
                    states = JSON.parse(data);
                } catch (e) {
                    return reject(e);
                }
            }
            states[chatId] = state;
            fs.writeFile(chatStatesPath, JSON.stringify(states, null, 2), (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}
const usersPath = path.join(__dirname, 'users.json');

function createUser(user) {
    return new Promise((resolve, reject) => {
        fs.readFile(usersPath, 'utf8', (err, data) => {
            let users = [];
            if (!err && data) {
                try {
                    users = JSON.parse(data);
                } catch (e) {
                    users = [];
                }
            }
            // Check if user already exists
            const exists = users.some(u => u.chatId === user.chatId);
            if (!exists) {
                users.push(user);
                fs.writeFile(usersPath, JSON.stringify(users, null, 2), (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}

function readUsers() {
    return new Promise((resolve, reject) => {
        fs.readFile(usersPath, 'utf8', (err, data) => {
            if (err) return resolve([]); // Return empty array if file doesn't exist
            try {
                const users = JSON.parse(data);
                resolve(users);
            } catch (e) {
                resolve([]);
            }
        });
    });
}
const handleMsg = (msg, state) => {
    switch (state) {
        case "started":
            if (msg.text && msg.text.toString().toLowerCase() === teamCode.toLowerCase()) {
                bot.sendMessage(msg.chat.id, "Тепер представся, будь ласка. Введи СВОЄ Ім'я та Призвище");
                // Update state to 'pending'
                setChatState(msg.chat.id, "pending").catch(() => {});
            } else {
                bot.sendMessage(msg.chat.id, "Невірний код команди. Спробуйте ще раз.");
            }
            break;
        case "pending":
            // Save user name and chat id to users.json using createUser
            const user = {
                chatId: msg.chat.id,
                name: msg.text
            };
            createUser(user)
                .then(() => {
                    bot.sendMessage(
                        msg.chat.id,
                        "<b>Пам'ятка по використанню бота:</b>\n\n" +
                        "• <b>/createticket</b> — створити заявку на допомогу механіка.\n" +
                        "• <b>/viewtickets</b> — переглянути свої заявки.\n" +
                        "• <b>/help</b> — отримати список доступних команд.\n" +
                        "• <b>/info</b> — дізнатися більше про бота.\n\n" +
                        "Пишіть питання або команди у цей чат. Для створення заявки опишіть проблему детально, щоб механік міг швидко допомогти.\n\n" +
                        "Якщо виникли труднощі — звертайтесь до організаторів.",
                        { parse_mode: "HTML" }
                    );
                })
                .catch(() => {
                    bot.sendMessage(msg.chat.id, "Сталася помилка при збереженні користувача.");
                });

            setChatState(msg.chat.id, "authorized").catch(() => {});
            break;
        case "authorized":
            if (msg.text && msg.text.toString().toLowerCase() === "/createticket") {
                setChatState(msg.chat.id, "ticket_creation").catch(() => {});
                bot.sendMessage(
                    msg.chat.id,
                    "Яка проблема вас спіткала? - Опиши текстом:\n\n1. З чим пов'язана проблема (перемикання, гальма, колеса, інше)\n2. Коротко опиши суть проблеми\n3. Опиши свій велосипед, щоб механіку було легше його знайти."
                );
            } else if (msg.text && msg.text.toString().toLowerCase() === "/viewtickets") {
                const ticketsPath = path.join(__dirname, 'tickets.json');
                fs.readFile(ticketsPath, 'utf8', (err, data) => {
                    if (err) {
                        bot.sendMessage(msg.chat.id, "Не вдалося отримати ваші заявки або їх ще немає.");
                        return;
                    }
                    let tickets = [];
                    try {
                        tickets = JSON.parse(data);
                    } catch (e) {
                        tickets = [];
                    }
                    const userTickets = tickets.filter(t => t.chatId === msg.chat.id);
                    if (userTickets.length === 0) {
                        bot.sendMessage(msg.chat.id, "У вас ще немає заявок.");
                    } else {
                        let message = "<b>Ваші заявки:</b>\n\n";
                        userTickets.forEach((t, i) => {
                            message += `${i + 1}. ${t.text}\n🕒 ${new Date(t.createdAt).toLocaleString()}\n\n`;
                        });
                        bot.sendMessage(msg.chat.id, message, { parse_mode: "HTML" });
                    }
                });
            } else {
                bot.sendMessage(
                    msg.chat.id,
                    "<b>Пам'ятка по використанню бота:</b>\n\n" +
                    "• <b>/createticket</b> — створити заявку на допомогу механіка.\n" +
                    "• <b>/viewtickets</b> — переглянути свої заявки.\n" +
                    "• <b>/help</b> — отримати список доступних команд.\n" +
                    "• <b>/info</b> — дізнатися більше про бота.\n\n" +
                    "Пишіть питання або команди у цей чат. Для створення заявки опишіть проблему детально, щоб механік міг швидко допомогти.\n\n" +
                    "Якщо виникли труднощі — звертайтесь до організаторів.",
                    { parse_mode: "HTML" }
                );
            }
            break;
        case "ticket_creation":
            // Save the ticket to tickets.json
            const ticketsPath = path.join(__dirname, 'tickets.json');
            const ticket = {
            chatId: msg.chat.id,
            text: msg.text,
            createdAt: new Date().toISOString()
            };
            fs.readFile(ticketsPath, 'utf8', (err, data) => {
            let tickets = [];
            if (!err && data) {
                try {
                tickets = JSON.parse(data);
                } catch (e) {
                tickets = [];
                }
            }
            tickets.push(ticket);
            fs.writeFile(ticketsPath, JSON.stringify(tickets, null, 2), (err) => {
                // Ignore write errors for now
            });
            });
            bot.sendMessage(msg.chat.id, "Дякуємо! Вашу заявку прийнято. Механік зв'яжеться з вами найближчим часом.");
            setChatState(msg.chat.id, "authorized").catch(() => {});
            break;
            default:
            bot.sendMessage(msg.chat.id, "Невідома дія. Спробуйте /start.");
            break;
    }
}

bot.on('message', (msg) => {
    getChatState(msg.chat.id)
        .then(state => handleMsg(msg, state))
        .catch(err => {
            const hi = "/start";
            if (msg.text && msg.text.toString().toLowerCase().startsWith(hi)) {
                bot.sendMessage(msg.chat.id, "Привіт, відправ код своєї команди для того що б почати користуватися ботом" );
                setChatState(msg.chat.id, "started").catch(() => {
                    bot.sendMessage(msg.chat.id, "Error saving state.");
                });
            }
        });
});
