const fs = require('fs');
const path = require('path');

const usersPath = path.join(process.cwd(), 'database', 'users.json');

class User {
    constructor(chatId, state, name) {
        this.chatId = chatId;
        this.state = state || 'new';
        this.name = name || 'Unregistered User';
    }

    chatId;
    state;
    tickets = []
    authorized = false;

    readUserData = (id) => {
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
                        resolve(new User(userData.chatId, userData.state, userData.name));
                    } else {
                        resolve(this);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });
    }
    saveUser() {
        return new Promise((resolve, reject) => {
            const usersPath = path.join(process.cwd(), 'src', 'users.json');
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
                    state: this.state,
                    name: this.name,
                    tickets: this.tickets,
                    authorized: this.authorized
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
    set state(newState) {
        this.state = newState
        this.saveUser().catch(err => console.error(`Error saving user state: ${err}`));
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
 * @property {Array} tickets - The list of tickets associated with the user.
 * @property {boolean} authorized - Whether the user is authorized.
 *
 * @method readUserData
 * @param {string} id - The chatId of the user to read.
 * @returns {Promise<User|null>} Resolves with a User instance if found, otherwise null.
 *
 * @method saveUser
 * @returns {Promise<void>} Resolves when the user data is saved.
 */