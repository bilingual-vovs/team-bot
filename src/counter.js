const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Назва лічильника (наприклад, 'ticketId')
    seq: { type: Number, default: 0 }    // Поточне значення лічильника
});

const Counter = mongoose.model(process.env.COUNTERS_COLLECTION || 'Counter', counterSchema);

module.exports = Counter;