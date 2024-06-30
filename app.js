const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3000;
const userRoutes = require('./api/routes/Users');
const spikeRoutes = require('./api/routes/Spikes');
const integrationGithubAuthRoutes = require('./api/integrations/Github');

// Middleware
mongoose.connect(process.env.MONGO_URL, { dbName: 'spikes' })
    .then(() => console.log('Connected to database.'))
    .catch(err => console.log('Error connecting to database.'));

app.use(morgan('dev'));
app.use(cookieParser(process.env.COOKIE_KEY));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Handling CORS
app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://spike-frontend-pi.vercel.app', 'postman://app'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || origin === undefined) {
        res.header("Access-Control-Allow-Origin", origin || "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Accept, Authorization, Content-Type");
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        next();
    } else {
        return res.status(403).json({ message: "Forbidden" });
    }
});

// Routes
app.get('/', (req, res) => {
    res.status(200).json({ message: 'welcome to spike' });
});
app.use('/users', userRoutes);
app.use('/spikes', spikeRoutes);
app.use('/integrations/github', integrationGithubAuthRoutes);

// Error Handlers
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
            status: error.status || 500
        }
    });
});

app.listen(port, () => {
    console.log(`Listening at ${port}`);
});
