const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const { initSocket } = require('./socket/index');
const helmet = require('helmet');
const path = require('path');

const PORT = process.env.PORT || 5001;

mongoose.set('strictQuery', true);

const app = express();
require('dotenv').config();

// Use Helmet to set CSP and other security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'blob:', 'https://infimv.com'],
        scriptSrcElem: ["'self'", 'blob:', 'https://infimv.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://chatting-app-backend-2ed12805abd4.herokuapp.com"],
        // Add other directives as needed
      },
    },
    crossOriginEmbedderPolicy: true, // Enable COEP
  })
);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

const allowedOrigins = [
  'https://chatting-clone-app-ac4b77e868b3.herokuapp.com',
  'https://chatt-app-3n7a.onrender.com',
  'https://chatt-app-frontend-u15x.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // for tools like Postman
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS: Origin not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true
};


app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SIGNATURE));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Hi there!');
});

// Catch-all handler to serve the React app for any request that doesn't match an API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB connection Success'))
  .catch((err) => console.log('DB connection Error', err.message));

const server = app.listen(PORT, () => {
  console.log(`App is listening to port ${PORT}`);
});

// Initialize socket.io
initSocket(server, corsOptions);

module.exports = app;
