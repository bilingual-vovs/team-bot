// messages.js

const translate = {
    pending: 'очікує обробки',
    in_progress: 'вже в роботі',
    completed: "вже завершена",
    canceled: "скасована"
}

const Messages = {


    // Клавіатури залишаємо без змін, оскільки вони функціональні
    keyboards: {
        athleteKeyboard: {
            keyboard: [
                [{ text: 'Створити заявку' }],
                [{ text: 'Мої заявки' }],
                [{ text: 'Видалити мої дані' }]
            ],
            resize_keyboard: true,
            
        },
        mechanicKeyboard: {
            keyboard: [
                [{ text: 'Переглянути всі заявки' }],
                [{ text: 'Взяти заявку в роботу' }],
                [{ text: 'Виконати заявку' }],
                [{ text: 'Видалити мої дані' }]
            ],
            resize_keyboard: true,
            
            
        },
        roleSelectionKeyboard: {
            keyboard: [
                ['Спортсмен'],
                ['Механік']
            ],
            resize_keyboard: true,
            
            
        },
        cancelKeyboard: {
            keyboard: [
                [{ text: 'Скасувати' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
            
            
        },
        noNotesKeyboard: {
            keyboard: [
                [{ text: 'Немає приміток' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
            
        },
        removeKeyboard: {
            remove_keyboard: true,
            
            
        },
        idsKeyboard: (ids) => {
            ids.sort((a, b) => a - b)
            let chunk = Math.ceil(Math.sqrt(ids.length))
            let keyboard = []

            for (let i = 0; i < chunk* chunk; i+=chunk){
                let arr = []
                for (let j = 0; j<chunk; j++){
                    if (i+j+1 > ids.length){
                        keyboard.push(arr)
                        return {
                            keyboard,
                        }
                    }
                    arr.push({text: '#' + ids[i+j]})
                }
                keyboard.push(arr)
            }
            
            return {
                keyboard,
                resize_keyboard: true,
                
            }
        }
    },

    inlineKeyboards: {
        listTickets: (tickets) =>{
            return {
                inline_keyboard: tickets.map(ticket => [
                    {
                        text: `${ticket.status == 'pending' ? 'Взяти в роботу' : (ticket.status == 'in_progress' ? 'Вже виконав': 'Виконана')} заявку `,
                        callback_data: (ticket.status == 'pending' ? `view_ticket_${ticket.id}` : `completed_ticket_${ticket.id}`)
                    }
                ])
            };
        }
    },

    // --- Повідомлення без будь-якого виділення жирним ---

    // 🚀 Привітання та Реєстрація
    start: () => `👋 Привіт! Щоб почати користуватися ботом, будь ласка, введи код команди.`,
    enterName: () => `🎉 Чудово! Тепер введи своє ім'я, щоб ми могли тебе зареєструвати.`,
    selectRole: (userName) => `Дякуємо, ${userName}! 🙏\nОбери свою роль: Спортсмен 🚴‍♂️ або Механік 🔧.`,
    registrationCompleteAthlete: () => `✅ Вітаємо! Ти успішно зареєстрований як спортсмен!
Ось що може цей бот:
- Створювати заявки на обслуговування ✍️
- Переглядати свої заявки 📋
- Отримувати сповіщення про нові квитки 🔔
Використовуй кнопки нижче для взаємодії.`,
    registrationCompleteMechanic: () => `✅ Вітаємо! Ти успішно зареєстрований як механік!
Ось що може цей бот:
- Переглядати заявки спортсменів 🚴‍♂️
- Брати заявки в роботу 🛠️
Виконувати заявки ✅
Використовуй кнопки нижче для взаємодії.`,

    // ✅ Успішні дії та Підтвердження
    ticketCreated: () => `🎉 Супер! Твоя заявка на обслуговування була успішно створена! Ми вже працюємо над нею.`,
    dataDeleted: () => `✅ Твої дані були успішно видалені. Бувай! 👋`,
    deleteCancelled: () => `↩️ Добре, видалення даних скасовано.`,
    ticketCompleted: () => `🎉 Чудово! Заявка виконана! Чи є якісь примітки, які б ти хотів передати автору заявки?`,
    ticketTakenByMechanic: (ticketId, ticketText, ticketAuthor) => `✅ Заявка з #${ticketId} успішно взята тобою в роботу!
    \nАвтор: ${ticketAuthor}
    \nОпис: ${ticketText}
    \nЗавершити: /complete_${ticketId}`,
    ticketCompletedNotes: () => `✅ Заявка закрита! Ваші нотатки були збережені та надіслані автору заявки. Дякуємо за роботу!`,
    ticketCompletedNoNotes: () => `✅ Заявка закрита без нотаток!`,

    // 📝 Створення та Деталі Заявки
    promptCreateTicket: () => `📝 Добре, давай створимо заявку!
Будь ласка, детально опиши, що трапилось з твоїм велосипедом:
- З чим пов'язана проблема? (Наприклад: Перемикання передач, гальма, колеса)
- Детально, але лаконічно опиши саму проблему. Поважайте час механіка — чим зрозуміліше опис, тим швидше буде рішення!
- Опиши свій велосипед (модель, особливості), щоб механік міг його легко ідентифікувати.`,
    promptTakeTicket: () => `🛠️ Чудово! Будь ласка, введи ID заявки, яку ти хочеш взяти в роботу.`,
    promptCompleteTicket: () => `✅ Чудово! Будь ласка, введи ID заявки, яку ти хочеш виконати.`,
    confirmDeleteData: () => `🗑️ Увага! Ти впевнений, що хочеш видалити всі свої дані з бота? Це неможливо буде відновити.
Введи "Так" для підтвердження або натисни "Скасувати".`,
    mechanicConfirmation: () => `Для підтвердження, що ви механік, введіть, будь ласка, пароль механіків.`,


    // 📋 Перегляд та Статуси Заявок
    yourTickets: (tickets) => `📋 Твої заявки:\n${
        tickets.sort((a, b) => a.id - b.id).map(t => `\n---
- #${t.id}
    Статус: ${translate[t.status]}
    Опис: ${t.text}`).join('\n')}`,
    allTickets: (tickets) => `📋 Заявки спортсменів:\n${
        tickets.sort((a, b) => a.id - b.id).map(t => `\n- #${t.id}
        \n    Автор: ${t.authorName}
        \n    Статус: ${translate[t.status]}
        \n    Опис: ${t.text}
        ${t.status == "pending" || t.status == 'in_progress' ?`\n    ${t.status == 'pending' ? `Взяти в роботу: /take_${t.id}` : `Завершити заявку: /complete_${t.id}`}` : ''}`).join('\n---')}`,
    ticketTakenByAthleteNotification: (ticketId, mechanicName) => `🔔 Увага! Твою заявку з #${ticketId} вже взяв у роботу механік ${mechanicName}!`,
    ticketCompletedNotification:(name, id, notes) => `🔔 Твоя заявка з #${id} була виконана механіком ${name}! ${notes ? "Також механік зауважив: " + notes: ""}`,


    // ⚠️ Повідомлення про Помилки та Попередження
    invalidTeamCode: () => `❌ Помилка! На жаль, це невірний код команди. Спробуй ще раз!`,
    enterValidName: () => `⚠️ Будь ласка, введи коректне ім'я. Твоє ім'я допоможе нам краще організувати роботу!`,
    invalidRoleSelection: () => `🤔 Будь ласка, вибери роль зі списку запропонованих кнопок!`,
    errorCreatingTicket: () => `❌ О ні! Виникла помилка при створенні заявки. Будь ласка, спробуй ще раз.`,
    errorFetchingTickets: () => `❌ Помилка! Виникла при отриманні твоїх заявок. Будь ласка, спробуй ще раз.`,
    errorFetchingAllTickets: () => `❌ Помилка! Виникла при отриманні заявок. Будь ласка, спробуй ще раз.`,
    accessDenied: () => `🚫 Доступ заборонено! Вибач, але ти не маєш доступу до цієї команди.`,
    errorDeletingData: () => `❌ Помилка! Виникла при видаленні твоїх даних. Будь ласка, спробуй ще раз.`,
    ticketNotFound: (ticketId) => `🔍 Не знайдено! На жаль, заявка з #${ticketId} не знайдена. Перевір, чи правильно ввів ID.`,
    ticketAlreadyInProgress: (ticketId) => `⚠️ Увага! Заявка з #${ticketId} вже знаходиться в роботі.`,
    errorTakingTicket: () => `❌ Помилка! Виникла при взятті заявки в роботу. Будь ласка, спробуй ще раз.`,
    errorFetchingTicket: () => `❌ Помилка! Виникла при отриманні заявки. Будь ласка, спробуй ще раз.`,
    invalidTicketID: () => `🔢 Некоректний ID! Будь ласка, введи дійсний числовий ID заявки.`,
    ticketNotInProgress: (ticketId) => `⚠️ Увага! Заявка з #${ticketId} не знаходиться в роботі. Можливо, вона вже виконана або не існує.`,
    errorCompletingTicket: () => `❌ Помилка! Виникла при виконанні заявки. Будь ласка, спробуй ще раз.`,
    unknownCommand: () => '❓ Невідома команда! На жаль, я не можу зрозуміти, що ви мали на увазі.',
    ticketAlreadyCompleted: () => '⚠️ Заявку вже виконано! Ти не можеш виконати її повторно.',
    enterValidPassword: () => `🔐 Будь ласка, введіть коректний пароль.`,
    mechanicStateDenied: () => `🚫 Доступ заборонено! Пароль невірний, ви не механік. Спробуйте ще раз або зверніться до адміністратора.`,
    noPendingTickets: () => `🔧 Поки порожньо! Наразі немає жодних заявок, які очікують на обробку. Час відпочити! 😉`,
    noTicketsInProgress: () => `📋 Немає активних заявок! Наразі жодна заявка не є в роботі. Спробуй взяти нові: /take_ticket`,
    ticketNotTaken: (id) => `⚠️ Заявка #${id} ще не взята в роботу. Хочеш взяти: /take_${id}`,
    ticketCompletedNC: (id) => `⚠️ Заявка #${id} вже виконана! Ви не можете виконати її повторно.`,
    ticketCanceled: (id) => `↩️ Заявку #${id} було скасовано.`,
    systemError: () => `😟 Системна помилка! Виникла непередбачена проблема. Будь ласка, спробуйте почати спочатку, набравши /start.`,
    noTickets: () => `📋 Поки порожньо! Наразі у тебе немає жодної активної заявки. Створи нову, якщо щось потрібно!`,
    noAthleteTickets: () => `📋 Поки порожньо! Наразі немає жодних заявок від спортсменів. Час відпочити! 😉`,
    newTicket: (aut, text, tick) => `${aut} створив нову заявку, яка звучить так:
    \n ${text}
    \n Взяти: /take_${tick}`,
};

module.exports = Messages;