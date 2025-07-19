// messages.js
const Messages = {
    // Клавіатури залишаємо без змін, оскільки вони функціональні
    keyboards: {
        athleteKeyboard: JSON.stringify({
            keyboard: [
                [{ text: 'Створити заявку' }],
                [{ text: 'Мої заявки' }],
                [{ text: 'Видалити мої дані' }]
            ],
            resize_keyboard: true
        }),
        mechanicKeyboard: JSON.stringify({
            keyboard: [
                [{ text: 'Переглянути всі заявки' }],
                [{ text: 'Взяти заявку в роботу' }],
                [{ text: 'Виконати заявку' }],
                [{ text: 'Видалити мої дані' }]
            ],
            resize_keyboard: true
        }),
        roleSelectionKeyboard: JSON.stringify({
            keyboard: [
                ['Спортсмен'],
                ['Механік']
            ],
            resize_keyboard: true
        }),
        cancelKeyboard: JSON.stringify({
            keyboard: [
                [{ text: 'Скасувати' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }),
        noNotesKeyboard: JSON.stringify({
            keyboard: [
                [{ text: 'Немає приміток' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }),
        removeKeyboard: JSON.stringify({
            remove_keyboard: true
        }),
        idsKeyboard: (ids) => {
            let chunk = Math.ceil(Math.sqrt(ids.length))
            let keyboard = []

            for (let i = 0; i < chunk * chunk; i+=chunk){
                let arr = []
                for (let j = 0; j<chunk; j++){
                    if (i+j+1 > ids.length){
                        keyboard.push(arr)
                        return JSON.stringify({
                            keyboard,
                        })
                    }
                    arr.push({text: '#' + ids[i+j]})
                }
                keyboard.push(arr)
            }
            

            return JSON.stringify({
                keyboard,
            })
        }
    },

    inlineKeyboards: {
        listTickets: (tickets) =>{
            return JSON.stringify({
                inline_keyboard: tickets.map(ticket => [
                    {
                        text: `${ticket.status == 'pending' ? 'Взяти в роботу' : (ticket.status == 'in_progress' ? 'Вже виконав': 'Виконана')} заявку `,
                        callback_data: (ticket.status == 'pending' ? `view_ticket_${ticket.id}` : `completed_ticket_${ticket.id}`)
                    }
                ])
            });
        }
    },

    // --- Повідомлення без будь-якого виділення жирним ---

    // Привітання та реєстрація
    start: () => `👋 Привіт! Щоб почати користуватися ботом, будь ласка, введи код команди.`,
    invalidTeamCode: () => `❌ На жаль, це невірний код команди. Спробуй ще раз!`,
    enterName: () => `🎉 Чудово! Тепер введи своє ім'я, щоб ми могли тебе зареєструвати.`,
    enterValidName: () => `📝 Будь ласка, введи коректне ім'я. Твоє ім'я допоможе нам краще організувати роботу!`,
    selectRole: (userName) => `Дякуємо, ${userName}! 🙏
Обери свою роль: Спортсмен 🚴‍♂️ або Механік 🔧.`,
    invalidRoleSelection: () => `🤔 Будь ласка, вибери роль зі списку запропонованих кнопок!`,
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
Використовуй кнопки нижче для взаємодії.`,

    // Створення заявки
    promptCreateTicket: () => `📝 Добре, давай створимо заявку!
Будь ласка, детально опиши, що трапилось з твоїм велосипедом:
- З чим пов'язана проблема? (Наприклад: Перемикання передач, гальма, колеса)
- Детально, але лаконічно опиши саму проблему. Поважайте час механіка — чим зрозуміліше опис, тим швидше буде рішення!
- Опиши свій велосипед (модель, особливості), щоб механік міг його легко ідентифікувати.`,
    ticketCreated: () => `🎉 Супер! Твоя заявка на обслуговування була успішно створена! Ми вже працюємо над нею.`,
    errorCreatingTicket: () => `❌ О ні! Виникла помилка при створенні заявки. Будь ласка, спробуй ще раз.`,

    // Перегляд заявок
    noTickets: () => `📋 Наразі у тебе немає жодної активної заявки. Створи нову, якщо щось потрібно!`,
    yourTickets: (tickets) => `📋 Твої заявки:\n${tickets.map(t => `\n- #${t.id}\n    Статус: ${t.status}\n    Опис: ${t.text}`).join('\n')}`,
    errorFetchingTickets: () => `❌ Виникла помилка при отриманні твоїх заявок. Будь ласка, спробуй ще раз.`,
    noAthleteTickets: () => `📋 Наразі немає жодних заявок від спортсменів. Час відпочити! 😉`,
    allTickets: (tickets) => `📋 Заявки спортсменів:\n${tickets.map(t => `\n- #${t.id}
        \n    Автор: ${t.authorName}
        \n    Статус: ${t.status == 'pending' ? 'очікує' : (t.status == 'in_progress' ? 'взята в роботу' : "Виконана чи відмінена - хз")}
        \n    Опис: ${t.text}
        ${t.status == "pending" || t.status == 'in_progress' ?`\n    ${t.status == 'pending' ? `Взяти в роботу: /take_${t.id}` : `Завергти заявку: /complete_${t.id}`}` : ''}`).join('\n-----------------------------------------------')}`,
    errorFetchingAllTickets: () => `❌ Виникла помилка при отриманні заявок. Будь ласка, спробуй ще раз.`,
    accessDenied: () => `🚫 Вибач, але ти не маєш доступу до цієї команди.`,

    // Видалення даних
    confirmDeleteData: () => `🗑️ Увага! Ти впевнений, що хочеш видалити всі свої дані з бота? Це неможливо буде відновити.
Введи "Так" для підтвердження або натисни "Скасувати".`,
    dataDeleted: () => `✅ Твої дані були успішно видалені. Бувай! 👋`,
    errorDeletingData: () => `❌ Виникла помилка при видаленні твоїх даних. Будь ласка, спробуй ще раз.`,
    deleteCancelled: () => `↩️ Добре, видалення даних скасовано.`,

    // Взяття заявки в роботу
    promptTakeTicket: () => `🛠️ Чудово! Будь ласка, введи ID заявки, яку ти хочеш взяти в роботу.`,
    promptCompleteTicket: () => `✅ Чудово! Будь ласка, введи ID заявки, яку ти хочеш виконати.`,
    ticketCompleted: () => `🎉 Чудово! Заявка виконана, чи є якісь примітки які б ти хотів передати автору заявки?`,
    ticketTakenByMechanic: (ticketId, ticketText, ticketAuthor) => `✅ Заявка з #${ticketId} успішно взята тобою в роботу!
    \n Автор: ${ticketAuthor}
    \n Опис: ${ticketText}
    \n Завершити: /complete_${ticketId}`,
    ticketTakenByAthleteNotification: (ticketId, mechanicName) => `🔔 Увага! Твою заявку з #${ticketId} вже взяв у роботу механік ${mechanicName}!`,
    ticketNotFound: (ticketId) => `🔍 На жаль, заявка з #${ticketId} не знайдена. Перевір, чи правильно ввів ID.`,
    ticketAlreadyInProgress: (ticketId) => `⚠️ Заявка з #${ticketId} вже знаходиться в роботі.`,
    errorTakingTicket: () => `❌ Виникла помилка при взятті заявки в роботу. Будь ласка, спробуй ще раз.`,
    errorFetchingTicket: () => `❌ Виникла помилка при отриманні заявки. Будь ласка, спробуй ще раз.`,
    invalidTicketID: () => `🔢 Будь ласка, введи дійсний числовий ID заявки.`,
    ticketNotInProgress: (ticketId) => `⚠️ Заявка з #${ticketId} не знаходиться в роботі. Можливо, вона вже виконана або не існує.`,
    ticketCompletedNotification:(name, id, notes) => `🔔 Твоя заявка з #${id} була виконана механіком ${name}! ${notes ? "Також механік зауважив:" + notes: ""}`,
    errorCompletingTicket: () => `❌ Виникла помилка при виконанні заявки. Будь ласка, спробуй ще раз.`,
    ticketCompletedNotes: () => `Заявка закрита! Ваші нотатки були збережені та надіслані автору заявки. Дякуємо за роботу!`,
    ticketCompletedNoNotes: () => `Заявка закрита - без нотаток! `,
    unknownCommand: () => 'Нажаль я не могу зрозуміти що ви мали на увазі((',
    ticketAlreadyCompleted: () => 'Заявку вже виконано',
    mechanicConfirmation: () => `Для підтвердження того що ви механік, введіть, будь ласка, парол механіків.`,
    enterValidPassword: () => `Ведіть корректний пароль.`,
    mechanicStateDenied: () => `Пароль невірний, ви не механік. Спробуйте ще раз або зверніться до адміністратора.`,
    noPendingTickets: () => `🔧 Наразі немає жодних заявок, які очікують на обробку. Час відпочити! 😉`,
    noTicketsInProgress: () => `Наразі жодна заявка не є в роботі, спробуй взяти в роботу нові: /take_ticket`,
    ticketNotTaken: (id) => `Заявка #${id} ще не взята в роботу, взяти в роботу: /take_${id}`,
    ticketCompletedNC: (id) => `Заявка вже виконанна, ви не можете виконати її повторно`,
    ticketCanceled: (id) => `Заявку було скасовано`,

    // Загальні повідомлення
    systemError: () => `😟 Виникла непередбачена системна помилка. Будь ласка, спробуйте почати спочатку, набравши /start.`
};

module.exports = Messages;