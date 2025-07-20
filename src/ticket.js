const mongoose = require('mongoose');
const Counter = require('./counter'); // Підключення до нової моделі лічильника

// --- Схема Ticket ---
const ticketSchema = new mongoose.Schema({
    // Змінюємо _id на id, і встановлюємо його тип та властивості
    id: {
        type: Number, // Тепер ID буде числом
        unique: true,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'in_progress', 'completed', 'cancelled']
    },
    mechanic: {
        type: String,
        default: null
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    authorName: {
        type: String,
        default: 'Невідомий Чемпіон'
    },
    messageId: {
        type: String,
        default: null
    }
});

// Додамо індекс для поля id та author
ticketSchema.index({ id: 1 });
ticketSchema.index({ author: 1 });

// --- Модель Ticket ---
const TicketModel = mongoose.model('Ticket', ticketSchema);

class Ticket {
    constructor(id, author, status, mechanic, text, createdAt, authorName, messageId) {
        this.id = id;
        this.author = author;
        this._status = status || 'pending';
        this._mechanic = mechanic || null;
        this.text = text || '';
        this.createdAt = createdAt || new Date();
        this.authorName = authorName || 'Невідомий Чемпіон';
        this._messageId = messageId || null;
    }

    // Допоміжна функція для отримання наступного ID
    static async getNextSequenceValue(sequenceName) {
        const sequenceDocument = await Counter.findByIdAndUpdate(
            { _id: sequenceName },
            { $inc: { seq: 1 } },
            { new: true, upsert: true } // upsert: true створить документ, якщо його немає
        );
        return sequenceDocument.seq;
    }

    // Метод для створення нового тікета та збереження його в MongoDB
    static async createTicket(author, text, authorName, messageId = null) {
        try {
            const nextId = await Ticket.getNextSequenceValue('ticketId'); // Отримуємо наступний ID

            const newTicketData = {
                id: nextId, // Використовуємо наш згенерований ID
                author,
                text,
                authorName,
                messageId,
                status: 'pending',
                createdAt: new Date()
            };
            const createdTicketDoc = await TicketModel.create(newTicketData);
            console.log(`Тікет створено: ${createdTicketDoc.id}`);
            return new Ticket(
                createdTicketDoc.id,
                createdTicketDoc.author,
                createdTicketDoc.status,
                createdTicketDoc.mechanic,
                createdTicketDoc.text,
                createdTicketDoc.createdAt,
                createdTicketDoc.authorName,
                createdTicketDoc.messageId
            );
        } catch (error) {
            console.error(`Помилка створення тікета в MongoDB: ${error}`);
            throw error;
        }
    }

    // Статичний метод для читання даних тікета за його ID
    static async readTicket(id) {
        try {
            const ticketData = await TicketModel.findOne({ id: id }); // Тепер шукаємо за полем 'id'
            if (ticketData) {
                const ticket = new Ticket(
                    ticketData.id,
                    ticketData.author,
                    ticketData.status,
                    ticketData.mechanic,
                    ticketData.text,
                    ticketData.createdAt,
                    ticketData.authorName,
                    ticketData.messageId
                );
                return ticket;
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Помилка читання тікета з MongoDB: ${error}`);
            throw error;
        }
    }

    // Метод для збереження або оновлення даних тікета в MongoDB
    async saveTicket() {
        try {
            const ticketObj = {
                author: this.author,
                status: this._status,
                mechanic: this._mechanic,
                text: this.text,
                createdAt: this.createdAt,
                authorName: this.authorName,
                messageId: this._messageId
            };
            // findOneAndUpdate використовуємо для оновлення за нашим полем 'id'
            const updatedDoc = await TicketModel.findOneAndUpdate(
                { id: this.id }, // Знайти за полем 'id'
                ticketObj,
                { new: true, upsert: true }
            );
            this.id = updatedDoc.id; // Переконуємось, що id актуальний
            console.log(`Тікет ${this.id} збережено/оновлено.`);
        } catch (error) {
            console.error(`Помилка збереження тікета ${this.id} в MongoDB: ${error}`);
            throw error;
        }
    }

    // Статичний метод для отримання тікетів за ID користувача
    static async getTicketsByUser(uid) {
        try {
            const userTicketsDocs = await TicketModel.find({ author: uid }).sort({ createdAt: -1 });
            return userTicketsDocs.map(t => new Ticket(
                t.id,
                t.author,
                t.status,
                t.mechanic,
                t.text,
                t.createdAt,
                t.authorName,
                t.messageId
            ));
        } catch (error) {
            console.error(`Помилка отримання тікетів для користувача ${uid} з MongoDB: ${error}`);
            throw error;
        }
    }

    // Статичний метод для отримання всіх тікетів (з фільтрацією за статусом)
    static async getAllTickets() {
        try {
            const activeTicketsDocs = await TicketModel.find({
                status: { $nin: ['cancelled', 'completed'] }
            }).sort({ createdAt: -1 });

            return activeTicketsDocs.map(t => new Ticket(
                t.id,
                t.author,
                t.status,
                t.mechanic,
                t.text,
                t.createdAt,
                t.authorName,
                t.messageId
            ));
        } catch (error) {
            console.error(`Помилка отримання всіх тікетів з MongoDB: ${error}`);
            throw error;
        }
    }

    // --- Геттери та Сеттери ---
    set status(newStatus) {
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (validStatuses.includes(newStatus)) {
            this._status = newStatus;
            this.saveTicket().catch(err => {
                console.error(`Помилка збереження статусу тікета: ${err}`);
            });
        } else {
            throw new Error(`Недійсний статус: ${newStatus}`);
        }
    }

    set mechanic(newMechanic) {
        this._mechanic = newMechanic;
        this.saveTicket().catch(err => {
            console.error(`Помилка збереження механіка тікета: ${err}`);
        });
    }

    set messageId(newMessageId) {
        this._messageId = newMessageId;
        this.saveTicket().catch(err => {
            console.error(`Помилка збереження messageId тікета: ${err}`);
        });
    }

    get mechanic() {
        return this._mechanic;
    }

    get status() {
        return this._status;
    }

    get messageId() {
        return this._messageId;
    }
}

exports.Ticket = Ticket;
exports.TicketModel = TicketModel;