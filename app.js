const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

//routes
const userRoutes = require('./routes/userRoutes');
const hotelRoutes = require('./routes/hotelRoutes');

const path = require('path');

// app.use(express.static(path.join(__dirname, 'public')));
app.use('/napi/users', userRoutes);
app.use('/napi/hotels', hotelRoutes);
// const sequelize = require('./config/db');
// sequelize.sync().then(() => { console.log('Database synced')}).catch(err => console.log(err));


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
