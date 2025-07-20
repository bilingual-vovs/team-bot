const mongoose = require('mongoose');
const Ticket = require('./ticket.js').Ticket; // Переконайся, що ticket.js також використовує асинхронні операції або MongoDB

// --- Схема User ---
// Визначаємо схему для наших користувачів.
// Схема — це blueprint, який визначає структуру документів у нашій колекції MongoDB.
const userSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
        unique: true // chatId має бути унікальним для кожного користувача
    },
    state: {
        type: String,
        default: 'new'
    },
    name: {
        type: String,
        default: 'Unregistered User'
    },
    authorized: {
        type: Boolean,
        default: false
    },
    role: {
        type: String
    }
});

// --- Модель User ---
// Створюємо модель на основі схеми.
// Модель — це те, з чим ми взаємодіємо для виконання операцій CRUD (Create, Read, Update, Delete) з колекцією.
const UserModel = mongoose.model('User', userSchema);

class User {
    constructor(chatId, state, name, role) {
        this.chatId = chatId;
        this._state = state || 'new'; // Використовуємо _ замість __ для внутрішніх властивостей
        this._name = name || 'Unregistered User';
        this._role = role || undefined;
        this._authorized = false; // Початкове значення за замовчуванням
    }

    // Статичний метод для читання даних користувача з MongoDB
    // Тепер це асинхронна операція, яка повертає екземпляр User або створює новий, якщо не знайдено.
    static async readUserData(id) {
        try {
            const userData = await UserModel.findOne({ chatId: id });
            if (userData) {
                // Якщо користувач знайдений, повертаємо екземпляр класу User, заповнений даними з БД
                const user = new User(userData.chatId, userData.state, userData.name, userData.role);
                user._authorized = userData.authorized; // Встановлюємо значення authorized з БД
                return user;
            } else {
                // Якщо користувача не знайдено, повертаємо новий екземпляр User
                return new User(id);
            }
        } catch (error) {
            console.error(`Помилка читання даних користувача з MongoDB: ${error}`);
            // У разі помилки також повертаємо новий екземпляр User, щоб продовжити роботу
            return new User(id);
        }
    }

    // Метод для збереження або оновлення даних користувача в MongoDB
    // Використовуємо upsert: true для створення документа, якщо він не існує
    async saveUser() {
        try {
            const userObj = {
                chatId: this.chatId,
                state: this._state,
                name: this._name,
                authorized: this._authorized,
                role: this._role
            };
            // findOneAndUpdate з upsert: true дозволяє оновити існуючий документ або створити новий, якщо його немає
            await UserModel.findOneAndUpdate(
                { chatId: this.chatId }, // Знайти за chatId
                userObj, // Дані для оновлення/вставки
                { upsert: true, new: true, setDefaultsOnInsert: true } // Опції: створити, якщо не існує; повернути оновлений документ; встановити значення за замовчуванням при вставці
            );
            console.log(`Користувача ${this.chatId} збережено/оновлено.`);
        } catch (error) {
            console.error(`Помилка збереження користувача ${this.chatId} в MongoDB: ${error}`);
            throw error; // Передаємо помилку далі
        }
    }

    // Метод для додавання нового тікета
    // Передбачається, що Ticket.createTicket також працює з MongoDB або є асинхронним
    async addTicket(text, userName) {
        // Якщо Ticket клас також переписано для роботи з MongoDB, він повинен мати async метод.
        await Ticket.createTicket(this.chatId, text, userName);
        return this.saveUser(); // Зберігаємо оновлений стан користувача (якщо він змінився)
    }

    // Метод для видалення користувача з MongoDB
    async deleteUser() {
        try {
            const result = await UserModel.deleteOne({ chatId: this.chatId });
            if (result.deletedCount === 0) {
                console.warn(`Користувача з chatId ${this.chatId} не знайдено для видалення.`);
            } else {
                console.log(`Користувача ${this.chatId} видалено.`);
            }
        } catch (error) {
            console.error(`Помилка видалення користувача ${this.chatId} з MongoDB: ${error}`);
            throw error;
        }
    }

    // --- Геттери та Сеттери ---
    // Сеттери тепер викликають saveUser, щоб зміни одразу зберігалися в базі даних.
    set state(newState) {
        this._state = newState;
        this.saveUser().catch(err => console.error(`Помилка збереження стану користувача: ${err}`));
    }
    set name(newName) {
        this._name = newName;
        this.saveUser().catch(err => console.error(`Помилка збереження імені користувача: ${err}`));
    }
    set authorized(isAuthorized) {
        this._authorized = isAuthorized;
        this.saveUser().catch(err => console.error(`Помилка збереження авторизації користувача: ${err}`));
    }
    set role(newRole) {
        this._role = newRole;
        this.saveUser().catch(err => console.error(`Помилка збереження ролі користувача: ${err}`));
    }

    get state() {
        return this._state;
    }
    get name() {
        return this._name;
    }
    get authorized() {
        return this._authorized;
    }
    get role() {
        return this._role;
    }
}

exports.User = User;
exports.UserModel = UserModel; // Експортуємо також модель Mongoose, якщо вона знадобиться деінде