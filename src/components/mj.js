/*const mongoose = require('mongoose');
require('dotenv').config();
console.log("Mongo URI:", process.env.MONGO_URI);
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));*/
    require('dotenv').config({ path: './.env' });
console.log("Test ENV:", process.env.TEST_ENV);

