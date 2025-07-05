require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const claimRoutes = require('./routes/claimRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/claims', claimRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 