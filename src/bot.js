const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const token = fs.readFileSync(path.join(__dirname, '../database/apikey.txt'), 'utf8').trim();
const bot = new TelegramBot(token, { polling: true });

const User = require('./user.js').User;
const Ticket = require('./ticket.js').Ticket;
const Messages = require('./messages.js');

const teamCode = 'raceteam';

/**
 * Відправляє повідомлення з відповідною клавіатурою.
 * @param {number} chatId - ID чату.
 * @param {string} text - Текст повідомлення.
 * @param {string} keyboardType - Тип клавіатури ('athlete', 'mechanic', 'roleSelection', 'remove').
 */
const sendMessageWithKeyboard = (chatId, text, keyboardType) => {
    let reply_markup = Messages.keyboards.removeKeyboard; // За замовчуванням приховуємо клавіатуру
    if (keyboardType === 'athlete') {
        reply_markup = Messages.keyboards.athleteKeyboard;
    } else if (keyboardType === 'mechanic') {
        reply_markup = Messages.keyboards.mechanicKeyboard;
    } else if (keyboardType === 'roleSelection') {
        reply_markup = Messages.keyboards.roleSelectionKeyboard;
    } else if (keyboardType === 'cancel'){ // Для підтвердження видалення даних
        reply_markup = Messages.keyboards.cancelKeyboard;
    }
    else if (keyboardType === 'noNotes') {
        reply_markup = Messages.keyboards.noNotesKeyboard;
    }

    bot.sendMessage(chatId, text, { reply_markup: reply_markup });
};


// --- Обробники станів ---

/**
 * Обробляє повідомлення, коли користувач знаходиться у "вільному" стані.
 * @param {Object} msg - Об'єкт повідомлення від Telegram.
 * @param {User} user - Об'єкт користувача з даними.
 */
const handleFreeState = (msg, user) => {
    const messageText = msg.text.toLowerCase();

    switch (messageText) {
        case 'створити заявку': // Нова кнопка
        case '/create_ticket': // Зберігаємо для зворотної сумісності або прямого вводу
            user.state = 'creating_ticket';
            sendMessageWithKeyboard(msg.chat.id, Messages.promptCreateTicket(), 'remove'); // Прибираємо клавіатуру для вводу тексту
            break;
        case 'мої заявки': // Нова кнопка
        case '/my_tickets':
            Ticket.getTicketsByUser(user.chatId)
                .then(tickets => {
                    if (tickets.length > 0) {
                        sendMessageWithKeyboard(msg.chat.id, Messages.yourTickets(tickets), user.role === 'athlete' ? 'athlete' : 'mechanic');
                    } else {
                        sendMessageWithKeyboard(msg.chat.id, Messages.noTickets(), user.role === 'athlete' ? 'athlete' : 'mechanic');
                    }
                })
                .catch(err => {
                    console.error(`Помилка отримання заявок користувача: ${err}`);
                    user.state = 'free';
                    sendMessageWithKeyboard(msg.chat.id, Messages.errorFetchingTickets(), user.role === 'athlete' ? 'athlete' : 'mechanic');
                });
            break;
        case 'переглянути всі заявки': // Нова кнопка (тільки для механіків)
        case '/view_tickets':
            if (user.role === 'mechanic') {
                Ticket.getAllTickets()
                    .then(tickets => {
                        if (tickets.length > 0) {
                            sendMessageWithKeyboard(msg.chat.id, Messages.allTickets(tickets), 'mechanic');
                        } else {
                            sendMessageWithKeyboard(msg.chat.id, Messages.noAthleteTickets(), 'mechanic');
                        }
                    })
                    .catch(err => {
                        console.error(`Помилка отримання всіх заявок: ${err}`);
                        sendMessageWithKeyboard(msg.chat.id, Messages.errorFetchingAllTickets(), 'mechanic');
                    });
            } else {
                sendMessageWithKeyboard(msg.chat.id, Messages.accessDenied(), user.role === 'athlete' ? 'athlete' : 'mechanic');
            }
            break;
        case 'видалити мої дані': // Нова кнопка
        case '/delete_my_data':
            sendMessageWithKeyboard(msg.chat.id, Messages.confirmDeleteData(), 'cancel'); // Запитуємо підтвердження з кнопкою "Скасувати"
            user.state = 'deleting_data';
            break;
        case 'взяти заявку в роботу': // Нова кнопка (тільки для механіків)
        case '/take_ticket':
            if (user.role === 'mechanic') {
                sendMessageWithKeyboard(msg.chat.id, Messages.promptTakeTicket(), 'remove'); // Прибираємо клавіатуру для вводу ID
                user.state = 'taking_ticket';
            } else {
                sendMessageWithKeyboard(msg.chat.id, Messages.accessDenied(), user.role === 'athlete' ? 'athlete' : 'mechanic');
            }
            break;
        case 'виконати заявку': // Нова кнопка (тільки для механіків)
        case '/complete_ticket':
            if (user.role === 'mechanic') {
                sendMessageWithKeyboard(msg.chat.id, Messages.promptCompleteTicket(), 'remove'); // Прибираємо клавіатуру для вводу ID
                user.state = 'completeng_ticket';
            } else {
                sendMessageWithKeyboard(msg.chat.id, Messages.accessDenied(), user.role === 'athlete' ? 'athlete' : 'mechanic');
            }
            break;
        case "немає приміток":
        case "/no_notes":
            Ticket.readTicket(parseInt(user.state.match(/^taking_notes_completing_ticket_(\d+)$/)[1], 10)).then(ticket => {
                ticket.status = 'completed';
                
                sendMessageWithKeyboard(msg.chat.id, Messages.ticketCompletedNoNotes(), user.role === 'mechanic' ? 'mechanic' : 'athlete');
                sendMessageWithKeyboard(ticket.author, Messages.ticketCompletedNotification(user.name, ), 'athlete');

                user.state = 'free';

            }).catch(err => {   
                console.error(`Помилка при отриманні заявки: ${err}`);
                sendMessageWithKeyboard(msg.chat.id, Messages.errorCompletingTicket(), user.role === 'mechanic' ? 'mechanic' : 'athlete');
                user.state = 'free';
            });
            break;
        default:
            // Якщо користувач у вільному стані надсилає невідомий текст,
            // ми не будемо відправляти повідомлення про невідому команду, щоб не спамити.
            // Клавіатура вже показує доступні опції.
            break;
    }
};

/**
 * Обробляє повідомлення, коли користувач знаходиться у стані "started" (початок реєстрації).
 * @param {Object} msg - Об'єкт повідомлення від Telegram.
 * @param {User} user - Об'єкт користувача з даними.
 */
const handleStartedState = (msg, user) => {
    if (msg.text.toLowerCase() === teamCode) {
        user.state = 'naming';
        sendMessageWithKeyboard(msg.chat.id, Messages.enterName(), 'remove'); // Прибираємо клавіатуру, щоб користувач міг ввести ім'я
    } else {
        sendMessageWithKeyboard(msg.chat.id, Messages.invalidTeamCode(), 'remove');
    }
};

/**
 * Обробляє повідомлення, коли користувач знаходиться у стані "naming" (введення імені).
 * @param {Object} msg - Об'єкт повідомлення від Telegram.
 * @param {User} user - Об'єкт користувача з даними.
 */
const handleNamingState = (msg, user) => {
    if (msg.text && msg.text.trim() !== '') {
        user.name = msg.text.trim();
        user.state = 'role-selection';
        sendMessageWithKeyboard(msg.chat.id, Messages.selectRole(user.name), 'roleSelection'); // Показуємо клавіатуру вибору ролі
    } else {
        sendMessageWithKeyboard(msg.chat.id, Messages.enterValidName(), 'remove');
    }
};

/**
 * Обробляє повідомлення, коли користувач знаходиться у стані "role-selection" (вибір ролі).
 * @param {Object} msg - Об'єкт повідомлення від Telegram.
 * @param {User} user - Об'єкт користувача з даними.
 */
const handleRoleSelectionState = (msg, user) => {
    const messageText = msg.text.toLowerCase();
    if (messageText === 'спортсмен' || messageText === 'механік') {
        user.role = (messageText === 'спортсмен') ? 'athlete' : 'mechanic';
        user.state = 'free';
        user.authorized = true;
        const welcomeMessage = (user.role === 'athlete') ?
            Messages.registrationCompleteAthlete() :
            Messages.registrationCompleteMechanic();

        // Відправляємо відповідне вітальне повідомлення з клавіатурою ролі
        sendMessageWithKeyboard(msg.chat.id, welcomeMessage, user.role);
    } else {
        sendMessageWithKeyboard(msg.chat.id, Messages.invalidRoleSelection(), 'roleSelection');
    }
};

/**
 * Обробляє повідомлення, коли користувач знаходиться у стані "creating_ticket" (створення заявки).
 * @param {Object} msg - Об'єкт повідомлення від Telegram.
 * @param {User} user - Об'єкт користувача з даними.
*/
const handleCreatingTicketState = (msg, user) => {
    if (msg.text && msg.text.trim() !== '') {
        user.addTicket(msg.text.trim(), user.name)
            .then(() => {
                sendMessageWithKeyboard(msg.chat.id, Messages.ticketCreated(), user.role); // Повертаємо клавіатуру ролі
                user.state = 'free';
            })
            .catch(err => {
                console.error(`Помилка створення заявки: ${err}`);
                sendMessageWithKeyboard(msg.chat.id, Messages.errorCreatingTicket(), user.role); // Повертаємо клавіатуру ролі
                user.state = 'free';
            });
    } else {
        sendMessageWithKeyboard(msg.chat.id, `Будь ласка, введіть опис заявки.`, 'remove'); // Нагадуємо про необхідність введення тексту
    }
};

/**
 * Обробляє повідомлення, коли користувач знаходиться у стані "deleting_data" (видалення даних).
 * @param {Object} msg - Об'єкт повідомлення від Telegram.
 * @param {User} user - Об'єкт користувача з даними.
 */
const handleDeletingDataState = (msg, user) => {
    const messageText = msg.text.toLowerCase();
    if (messageText === 'так') {
        user.deleteUser()
            .then(() => {
                sendMessageWithKeyboard(msg.chat.id, Messages.dataDeleted(), 'remove'); // Клавіатура приховується, оскільки дані видалено
                user.state = 'new'; // Скидаємо стан до 'new' для нової реєстрації
            })
            .catch(err => {
                console.error(`Помилка видалення даних користувача: ${err}`);
                sendMessageWithKeyboard(msg.chat.id, Messages.errorDeletingData(), user.role); // Повертаємо клавіатуру ролі
                user.state = 'free';
            });
    } else if (messageText === 'скасувати') { // Обробка кнопки "Скасувати"
        sendMessageWithKeyboard(msg.chat.id, Messages.deleteCancelled(), user.role);
        user.state = 'free';
    } else {
        sendMessageWithKeyboard(msg.chat.id, Messages.confirmDeleteData(), 'cancel'); // Нагадуємо ввести "Так" або "Скасувати"
    }
};

/**
 * Обробляє повідомлення, коли користувач знаходиться у стані "taking_ticket" (взяття заявки в роботу).
 * @param {Object} msg - Об'єкт повідомлення від Telegram.
 * @param {User} user - Об'єкт користувача з даними.
 */
const handleTakingTicketState = (msg, user) => {
    if (user.role === 'mechanic') {
        const ticketId = parseInt(msg.text.trim(), 10);
        if (isNaN(ticketId)) {
            sendMessageWithKeyboard(msg.chat.id, Messages.invalidTicketId(), 'mechanic'); // Повертаємо клавіатуру механіка
            user.state = 'free';
            return;
        }

        Ticket.readTicket(ticketId)
            .then(ticket => {
                // Перевіряємо, чи заявка існує
                if (!ticket) {
                    // Якщо заявка не знайдена, надсилаємо повідомлення і завершуємо виконання
                    sendMessageWithKeyboard(msg.chat.id, Messages.ticketNotFound(ticketId), 'mechanic');
                    user.state = 'free';
                    // Щоб уникнути подальшого виконання Promise, можна кинути помилку
                    // або повернути Promise.resolve(), якщо наступні .then блоки не мають бути викликані
                    throw new Error("Ticket not found, stopping execution."); // Кидаємо помилку, щоб перейти в catch
                }

                if (ticket.status === 'in_progress') {
                    sendMessageWithKeyboard(msg.chat.id, Messages.ticketAlreadyInProgress(ticket.id), 'mechanic'); // Повертаємо клавіатуру механіка
                    user.state = 'free';
                    throw new Error("Ticket already in progress, stopping execution."); // Кидаємо помилку, щоб перейти в catch
                }

                ticket.mechanic = user.chatId;
                ticket.status = 'in_progress';
                return ticket.saveTicket()
                    .then(() => ticket); // Передаємо ticket далі по ланцюжку
            })
            .then(ticket => {
                // Цей блок виконається, тільки якщо ticket був знайдений і оновлений
                sendMessageWithKeyboard(msg.chat.id, Messages.ticketTakenByMechanic(ticket.id, ticket.text, ticket.authorName), 'mechanic'); // Повертаємо клавіатуру механіка
                user.state = 'free';
                // Надсилаємо повідомлення автору заявки
                return bot.sendMessage(ticket.author, Messages.ticketTakenByAthleteNotification(ticket.id, user.name))
                    .then(() => bot.sendMessage(msg.chat.id, `Текст заявки: ${ticket.text}`));
            })
            .catch(err => {
                console.error(`Помилка при взятті заявки в роботу: ${err}`);
                // Обробляємо помилки, які були кинуті або виникли раніше
                if (err.message.startsWith('Заявка з ID') || err.message.includes('Ticket not found') || err.message.includes('Ticket already in progress')) {
                    // Ці повідомлення вже були надіслані, тому просто встановлюємо стан
                    // Або можна перевизначити, щоб показати конкретне повідомлення
                    if (err.message.startsWith('Заявка з ID')) { // Це якщо Ticket.readTicket кидає помилку одразу
                        sendMessageWithKeyboard(msg.chat.id, err.message, 'mechanic');
                    }
                } else {
                    sendMessageWithKeyboard(msg.chat.id, Messages.errorTakingTicket(), 'mechanic');
                }
                user.state = 'free';
            });
    } else {
        // Цей блок не мав би спрацьовувати, оскільки перевірка ролі вже є на етапі handleFreeState
        sendMessageWithKeyboard(msg.chat.id, Messages.accessDenied(), user.role);
        user.state = 'free';
    }
};

const handleCompletingTicketState = (msg, user) => {
    if (user.role !== 'mechanic') {
        sendMessageWithKeyboard(msg.chat.id, Messages.accessDenied(), user.role === 'athlete' ? 'athlete' : 'mechanic');
        user.state = 'free';   
        return;
    }
    const ticketId = parseInt(msg.text.trim(), 10);
    if (isNaN(ticketId)) {
        sendMessageWithKeyboard(msg.chat.id, Messages.invalidTicketID(), 'mechanic'); // Повертаємо клавіатуру механіка
        return;
    }
    Ticket.readTicket(ticketId)
        .then(ticket => {
            if (!ticket) {
                sendMessageWithKeyboard(msg.chat.id, Messages.ticketNotFound(ticketId), 'mechanic'); // Повертаємо клавіатуру механіка
                user.state = 'free';
                throw new Error("Ticket not found, stopping execution."); // Кидаємо помилку, щоб перейти в catch
            }   
            if (ticket.status !== 'in_progress') {
                sendMessageWithKeyboard(msg.chat.id, Messages.ticketNotInProgress(ticketId), 'mechanic'); // Повертаємо клавіатуру механіка
                user.state = 'free';
                throw new Error("Ticket not in progress, stopping execution."); // Кидаємо помилу, щоб перейти в catch
            }
            sendMessageWithKeyboard(msg.chat.id, Messages.ticketCompleted(), 'noNotes'); // Прибираємо клавіатуру для вводу ID
            user.state = 'taking_notes_completing_ticket_' + ticketId; // Змінюємо стан на completing_ticket
            ticket.mechanic = user.chatId; // Зберігаємо механіка
        }).catch(err => {
            console.error(`Помилка при отриманні заявки: ${err}`);
            sendMessageWithKeyboard(msg.chat.id, Messages.errorFetchingTicket(), 'mechanic'); // Повертаємо клавіатуру механіка
            user.state = 'free';
            return
        })
    }

const handleTakingNotesCompletingTicketState = (msg, user, ticketId) => {
    if (user.role !== 'mechanic') {
        sendMessageWithKeyboard(msg.chat.id, Messages.accessDenied(), user.role === 'athlete' ? 'athlete' : 'mechanic');
        user.state = 'free';
        return;
    }
    const notes = msg.text.trim();
    if (notes && notes.length > 0) {
        Ticket.readTicket(ticketId)
            .then(ticket => {
                if (!ticket) {
                    sendMessageWithKeyboard(msg.chat.id, Messages.ticketNotFound(ticketId), 'mechanic'); // Повертаємо клавіатуру механіка
                    user.state = 'free';
                    throw new Error("Ticket not found, stopping execution."); // Кидаємо помилку, щоб перейти в catch
                }
                ticket.status = 'completed';
                ticket.text += `\n\nПримітки механіка: ${notes}`; // Додаємо примітки до тексту заявки
                ticket.mechanic = user.chatId; // Зберігаємо механіка
                sendMessageWithKeyboard(msg.chat.id, Messages.ticketCompletedNotes(), 'mechanic') // Повертаємо клавіатуру механіка
                sendMessageWithKeyboard(ticket.author, Messages.ticketCompletedNotification(user.name, ticket.id, notes), 'athlete'); // Повідомляємо автора заявки
                user.state = 'free';
            })
            .catch(err => {
                console.error(`Помилка при збереженні заявки: ${err}`);
                sendMessageWithKeyboard(msg.chat.id, Messages.errorCompletingTicket(), 'mechanic'); // Повертаємо клавіатуру механіка
                user.state = 'free';
            });
    }
}
        

// --- Головний обробник повідомлень ---

/**
 * Головна функція обробки всіх вхідних повідомлень.
 * Направляє повідомлення до відповідного обробника на основі стану користувача.
 * @param {Object} msg - Об'єкт повідомлення від Telegram.
 * @param {User} user - Об'єкт користувача з даними.
 */
const handleMsg = (msg, user) => {
    // Всі вхідні текстові повідомлення переводимо в нижній регістр для зручності порівняння з кнопками
    const text = msg.text ? msg.text.toLowerCase() : '';

    switch (true) {
        case user.state === "started":
            handleStartedState(msg, user);
            break;
        case user.state === "naming":
            handleNamingState(msg, user);
            break;
        case user.state === "role-selection":
            handleRoleSelectionState(msg, user);
            break;
        case user.state === "creating_ticket":
            handleCreatingTicketState(msg, user);
            break;
        case user.state === "deleting_data":
            handleDeletingDataState(msg, user);
            break;
        case user.state === 'taking_ticket':
            handleTakingTicketState(msg, user);
            break;
        case user.state === 'completeng_ticket':
            handleCompletingTicketState(msg, user);
            break;
        case /^taking_notes_completing_ticket_(\d+)$/.test(user.state):
            handleTakingNotesCompletingTicketState(msg, user, parseInt(user.state.match(/^taking_notes_completing_ticket_(\d+)$/)[1]), 10);
            break;
            case 'free':
        default:
            handleFreeState(msg, user);
            break;
    }
};

// --- Ініціалізація бота ---

bot.on('message', (msg) => {
    console.log(msg.text)
    User.readUserData(msg.chat.id)
        .then((user) => {
            if (user.state === 'new') {
                user.state = 'started';
                sendMessageWithKeyboard(msg.chat.id, Messages.start(), 'remove'); // Клавіатура поки не потрібна
            } else {
                handleMsg(msg, user);
            }
        })
        .catch((err) => {
            console.error(`Помилка читання даних користувача: ${err}`);
            sendMessageWithKeyboard(msg.chat.id, Messages.systemError(), 'remove');
        });
});

bot.on('polling_error', (error) => {
    console.log(`[polling_error] ${error.code}: ${error.message}`);
});