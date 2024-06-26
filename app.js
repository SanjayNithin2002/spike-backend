const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;
const handleCORS = require('./api/middlewares/handleCORS');
const userRoutes = require('./api/routes/Users');
const spikeRoutes = require('./api/routes/Spikes');
const integrationGithubAuthRoutes = require('./api/integrations/Github');

// Middleware
mongoose.connect(process.env.MONGO_URL, { dbName: 'spikes' })
    .then(() => console.log('Connected to database.'))
    .catch(err => console.log('Error connecting to database.'));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(handleCORS);

// Routes
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
