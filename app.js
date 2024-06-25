const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
const handleCORS = require('./api/middlewares/handleCORS')

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(handleCORS);

// Routes
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Spike Backend'
    });
});

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