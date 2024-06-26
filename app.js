const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

const app = express();
const port = process.env.PORT || 3000;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const handleCORS = require('./api/middlewares/handleCORS')
const userRoutes = require('./api/routes/Users');
const spikeRoutes = require('./api/routes/Spikes');
const githubAuthRoutes = require('./api/integrations/Github/Auth');
const githubHookRoutes = require('./api/integrations/Github/Webhook');

// Middlewares
mongoose.connect(process.env.MONGO_URL, { dbName: 'spikes' })
    .then(() => console.log('Connected to database.'))
    .catch(err => console.log('Error connecting to database.'));
    
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/integrations/github/auth/callback`
},
    (accessToken, refreshToken, profile, done) => {
        return done(null, { profile, accessToken });
    }));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use(session({ secret: process.env.SESSION_KEY, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
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
app.use('/users', userRoutes);
app.use('/spikes', spikeRoutes);
app.use('/integrations/github/auth', githubAuthRoutes);
app.use('/integrations/github/webhook', githubHookRoutes);

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