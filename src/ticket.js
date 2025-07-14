const fs = require('fs');
const path = require('path');   

const ticketsPath = path.join(process.cwd(), 'database', 'tickets.json');

class Ticket {
    constructor(id, author, status, mechanic, text, createdAt, authorName) {
        this.id = id || this.newId
        this.author = author;
        this.__status = status || 'pending';
        this.__mechanic = mechanic || null;
        this.text = text || '';
        this.createdAt = createdAt || new Date().toISOString();
        this.authorName = authorName || 'Невідомий Чемпіон';
    }
    
    id;
    author;
    __status;
    __mechanic; 
    text;
    createdAt;

    get newId() {
        try {
            const tickets = JSON.parse(fs.readFileSync(ticketsPath, { encoding: 'utf8', flag: 'r' }))
            return tickets.length ? (Number(tickets.sort((a, b) => Number(a.id) - Number(b.id))[tickets.length - 1].id) + 1) : 1;

        } catch (e) {
            return 1;
        }
        
    }

    static readTicket(id) {
        return new Promise((resolve, reject) => {
            fs.readFile(ticketsPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                try {
                    const tickets = JSON.parse(data);
                    const ticketData = tickets.find(t => t.id === id);
                    if (ticketData) {
                        resolve(new Ticket(ticketData.id, ticketData.author, ticketData.status, ticketData.__mechanic, ticketData.text, ticketData.createdAt, ticketData.authorName));
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

    }

    saveTicket() {
        return new Promise((resolve, reject) => {
            fs.readFile(ticketsPath, 'utf8', (err, data) => {
                let tickets = [];
                if (!err && data) {
                    try {
                        tickets = JSON.parse(data);
                    } catch (e) {
                        // ignore parse error, start with empty array
                    }
                }
                const ticketObj = {
                    id: this.id,
                    author: this.author,
                    status: this.__status,
                    mechanic: this.__mechanic,
                    text: this.text,
                    createdAt: this.createdAt,
                    authorName: this.authorName || 'Невідомий Чемпіон'
                };
                const idx = tickets.findIndex(t => t.id === this.id);
                if (idx !== -1) {
                    tickets[idx] = ticketObj;
                }   else {
                    tickets.push(ticketObj);
                }
                fs.writeFile(ticketsPath, JSON.stringify(tickets, null, 2), 'utf8', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    static getTicketsByUser(uid) {
        return new Promise((resolve, reject) => {
            fs.readFile(ticketsPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                try {
                    const tickets = JSON.parse(data);
                    const userTickets = tickets.filter(t => t.author === uid);
                    resolve(userTickets.map(t => new Ticket(t.id, t.author, t.status, t.__mechanic, t.text, t.createdAt)));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    static getAllTickets() {
        return new Promise((resolve, reject) => {
            fs.readFile(ticketsPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                try {
                    const tickets = JSON.parse(data);
                    resolve(tickets.map(t => new Ticket(t.id, t.author, t.status, t.mechanic, t.text, t.createdAt, t.authorName)));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    static createTicket( author, text, authorName) {
        const newTicket = new Ticket(null, author, 'pending', null, text, null, authorName);
        return newTicket.saveTicket().then(() => newTicket);
    }

    set status(status) {
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (validStatuses.includes(status)) {
            this.__status = status;
            this.saveTicket().catch(err => {
                console.error(`Error saving ticket status: ${err}`);
            });
        } else {
            throw new Error(`Invalid status: ${status}`);
        }
    }

    set mechanic(mechanic) {
        this.__mechanic = mechanic;
        this.saveTicket().catch(err => {
            console.error(`Error saving ticket mechanic: ${err}`);
        });
    }

    get mechanic() {
        return this.__mechanic;
    }

    get status() {
        return this.__status;
    } 

}

exports.Ticket = Ticket;