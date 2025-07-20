require('dotenv').config

const mongoose = require('mongoose');
const dbKey = process.env.DB_KEY

// Функція для підключення до бази даних
const connectDB = async () => {
    try {
        // Заміни 'mongodb://localhost:27017/your_database_name' на свій рядок підключення до MongoDB
        // Якщо використовуєш MongoDB Atlas, це буде довгий рядок, наданий MongoDB Atlas
        await mongoose.connect(dbKey, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // useCreateIndex: true, // Це опція застаріла в нових версіях mongoose
            // useFindAndModify: false // Це опція застаріла в нових версіях mongoose
        });
        console.log('MongoDB підключено!');
    } catch (err) {
        console.error('Помилка підключення до MongoDB:', err.message);
        // Завершуємо процес, якщо не можемо підключитися до бази даних
        process.exit(1);
    }
};

module.exports = connectDB;