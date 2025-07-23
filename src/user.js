const mongoose = require('mongoose');
const Ticket = require('./ticket.js').Ticket; // Переконайся, що ticket.js також використовує проміси або async/await

// --- Схема User ---
const userSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
        unique: true
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
const UserModel = mongoose.model(process.env.USERS_COLLECTION || 'User', userSchema);

class User {
    constructor(chatId, state, name, role) {
        this.chatId = chatId;
        this._state = state || 'new';
        this._name = name || 'Unregistered User';
        this._role = role || undefined;
        this._authorized = false;
    }

    // Статичний метод для читання даних користувача з MongoDB
    static readUserData(id) {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ chatId: id })
                .then(userData => {
                    if (userData) {
                        const user = new User(userData.chatId, userData.state, userData.name, userData.role);
                        user._authorized = userData.authorized;
                        resolve(user);
                    } else {
                        resolve(new User(id)); // Користувача не знайдено, повертаємо новий екземпляр
                    }
                })
                .catch(error => {
                    console.error(`Помилка читання даних користувача з MongoDB: ${error}`);
                    resolve(new User(id)); // У разі помилки, також повертаємо новий екземпляр
                });
        });
    }

    // Метод для збереження або оновлення даних користувача в MongoDB
    saveUser() {
        return new Promise((resolve, reject) => {
            const userObj = {
                chatId: this.chatId,
                state: this._state,
                name: this._name,
                authorized: this._authorized,
                role: this._role
            };
            UserModel.findOneAndUpdate(
                { chatId: this.chatId },
                userObj,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            )
                .then(() => {
                    resolve();
                })
                .catch(error => {
                    console.error(`Помилка збереження користувача ${this.chatId} в MongoDB: ${error}`);
                    reject(error);
                });
        });
    }

    // Метод для додавання нового тікета
    addTicket(text, userName) {
        // Ticket.createTicket повинен повертати проміс
        return Ticket.createTicket(this.chatId, text, userName)
            .then(() => this.saveUser()) // Зберігаємо оновлений стан користувача після створення тікета
            .catch(err => {
                console.error(`Помилка при додаванні тікета: ${err}`);
                throw err; // Прокидаємо помилку далі
            });
    }

    // Метод для видалення користувача з MongoDB
    deleteUser() {
        return new Promise((resolve, reject) => {
            UserModel.deleteOne({ chatId: this.chatId })
                .then(result => {
                    if (result.deletedCount === 0) {
                        console.warn(`Користувача з chatId ${this.chatId} не знайдено для видалення.`);
                    } else {
                        console.log(`Користувача ${this.chatId} видалено.`);
                    }
                    resolve();
                })
                .catch(error => {
                    console.error(`Помилка видалення користувача ${this.chatId} з MongoDB: ${error}`);
                    reject(error);
                });
        });
    }

    // --- Геттери та Сеттери ---
    // Сеттери тепер викликають saveUser, який повертає проміс.
    // Обробимо помилку, якщо проміс буде відхилено.
    set state(newState) {
        this._state = newState;
    }
    set name(newName) {
        this._name = newName;
    }
    set authorized(isAuthorized) {
        this._authorized = isAuthorized;
    }
    set role(newRole) {
        this._role = newRole;
    }

    setState(newState) {
        this._state = newState;
        // Повертаємо проміс від saveUser
        return this.saveUser().catch(err => {
            console.error(`Помилка збереження стану користувача: ${err}`); // Перекидаємо помилку далі, якщо потрібно
        });
    }

    setName(newName) {
        this._name = newName;
        // Повертаємо проміс від saveUser
        return this.saveUser().catch(err => {
            console.error(`Помилка збереження імені користувача: ${err}`);
        });
    }

    setAuthorized(isAuthorized) {
        this._authorized = isAuthorized;
        // Повертаємо проміс від saveUser
        return this.saveUser().catch(err => {
            console.error(`Помилка збереження авторизації користувача: ${err}`);
        });
    }

    setRole(newRole) {
        this._role = newRole;
        // Повертаємо проміс від saveUser
        return this.saveUser().catch(err => {
            console.error(`Помилка збереження ролі користувача: ${err}`);
        });
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
exports.UserModel = UserModel;