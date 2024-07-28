const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require("mongoose")
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const { initSocket } = require('./socket/index')
const helmet = require('helmet');
const path = require('path');

const PORT=process.env.PORT || 5001;

mongoose.set('strictQuery', true);

const app = express()
require('dotenv').config()

// Use Helmet to set CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'blob:'],
        scriptSrcElem: ["'self'", 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://chatting-app-backend-6y18.onrender.com"],
        // Add other directives as needed
      },
    },
  })
);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Other middleware and routes

// Catch-all handler to serve the React app for any request that doesn't match an API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});


const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true
};

const allowedOrigins = [
  'http://localhost:3000',
  'https://chatt-app-3n7a.onrender.com'
];

app.use(cors({
  origin: function(origin, callback){
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser(process.env.COOKIE_SIGNATURE))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

app.get('/', (req, res) => {
  res.send('Hi there!')
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connection Success"))
  .catch((err) => console.log('DB connection Error', err.message))

const server = app.listen(PORT, () => {
  console.log(`App is listening to port ${process.env.PORT}`)
})

// socket.io
initSocket(server, corsOptions)

module.exports = app;
