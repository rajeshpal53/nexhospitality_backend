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
// const __dirname = path.resolve();

const userRoutes = require('./routes/userRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const spotsRoutes = require('./routes/spotsRoutes');
const nearbyPlacesRoutes = require('./routes/nearbyPlacesRoutes');
const configRoutes = require('./routes/configRoutes');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/napi/users', userRoutes);
app.use('/napi/hotels', hotelRoutes);
app.use('/napi/rooms', roomRoutes);
app.use('/napi/bookings', bookingRoutes);
app.use('/napi/spots', spotsRoutes);
app.use('/napi/nearbyplaces', nearbyPlacesRoutes);
app.use('/napi/config', configRoutes);
// const sequelize = require('./config/db');
// sequelize.sync().then(() => { console.log('Database synced')}).catch(err => console.log(err));


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
