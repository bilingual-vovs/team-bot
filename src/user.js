const fs = require('fs');
const path = require('path');

const Ticket = require('./ticket.js').Ticket;

const usersPath = path.join(process.cwd(), 'database', 'users.json');

class User {
    constructor(chatId, state, name, role) {
        this.chatId = chatId;
        this.__state = state || 'new';
        this.__name = name || 'Unregistered User';
        this.__role = role || undefined
    }

    chatId;
    __state;
    __authorized = false;
    __role;

    static readUserData = (id) => {
        return new Promise((resolve, reject) => {
            fs.readFile(usersPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                try {
                    const users = JSON.parse(data);
                    const userData = users.find(u => u.chatId === id);
                    if (userData) {
                        resolve(new User(userData.chatId, userData.state, userData.name, userData.role));
                    } else {
                        resolve(new User(id));
                    }
                } catch (e) {
                    resolve(new User(id));
                }
            });
        });
    }
    saveUser() {
        return new Promise((resolve, reject) => {
            fs.readFile(usersPath, 'utf8', (err, data) => {
                let users = [];
                if (!err && data) {
                    try {
                        users = JSON.parse(data);
                    } catch (e) {
                        // ignore parse error, start with empty array
                    }
                }
                const idx = users.findIndex(u => u.chatId === this.chatId);
                const userObj = {
                    chatId: this.chatId,
                    state: this.__state,
                    name: this.__name,
                    authorized: this.__authorized,
                    role: this.__role
                };
                if (idx !== -1) {
                    users[idx] = userObj;
                } else {
                    users.push(userObj);
                }
                fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    async addTicket(text, userName) {
        Ticket.createTicket(this.chatId, text, userName)
        return this.saveUser();
    }

    deleteUser() {
        return new Promise((resolve, reject) => {
            fs.readFile(usersPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                try {
                    let users = JSON.parse(data);
                    users = users.filter(u => u.chatId !== this.chatId);
                    fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    set state(newState) {
        this.__state = newState
        this.saveUser().catch(err => console.error(`Error saving user state: ${err}`));
    }
    set name(newName) {
        this.__name = newName
        this.saveUser().catch(err => console.error(`Error saving user name: ${err}`));
    }
    set authorized(isAuthorized) {
        this.__authorized = isAuthorized
        this.saveUser().catch(err => console.error(`Error saving user authorization: ${err}`));
    }
    set role(newRole) {
        this.__role = newRole
        this.saveUser().catch(err => console.error(`Error saving user role: ${err}`));
    }
    get state() {
        return this.__state;
    }
    get name() {
        return this.__name;
    }
    get authorized() {
        return this.__authorized;
    }
    get role() {
        return this.__role;
    }

}

exports.User = User;

/**
 * Represents a user in the Golosiyvo-bot system.
 * Handles reading and saving user data to a JSON file.
 *
 * @class
 * @property {string} chatId - The unique chat identifier for the user.
 * @property {string} state - The current state of the user (default: 'new').
 * @property {string} name - The name of the user (default: 'Unregistered User').
 * @property {boolean} authorized - Whether the user is authorized.
 *
 * @method readUserData
 * @param {string} id - The chatId of the user to read.
 * @returns {Promise<User|null>} Resolves with a User instance if found, otherwise null.
 *
 * @method saveUser
 * @returns {Promise<void>} Resolves when the user data is saved.
 */