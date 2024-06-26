const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const MongoStore = require('connect-mongo');
const router = express.Router();
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const createWebhooks = async (user) => {
    const webhookUrl = `${process.env.BASE_URL}/integrations/github/webhook`;
    const config = {
        headers: {
            Authorization: `token ${user.accessToken}`,
            'Content-Type': 'application/json',
        },
    };
    const data = {
        name: 'web',
        active: true,
        events: ['push'],
        config: {
            url: webhookUrl,
            content_type: 'json',
        },
    };

    try {
        await axios.post(`https://api.github.com/repos/${user.profile.username}/${repo}/hooks`, data, config);
        console.log(`Webhook created for repo: ${owner}/${repo}`);
    } catch (error) {
        console.error(`Failed to create webhook for repo: ${owner}/${repo}`, error);
    }
};

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/integrations/github/callback`,
    scope: ['repo']
},
    (accessToken, refreshToken, profile, done) => {
        return done(null, { profile, accessToken });
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

router.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: 'sessions',
        dbName: 'spikes'
    })
}));

router.use(passport.initialize());
router.use(passport.session());

router.get('/callback',
    passport.authenticate('github', { failureRedirect: '/integrations/github/login' }),
    (req, res) => {
        createWebhooks(req.user);
        res.redirect('/integrations/github/user');
    }
);

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});


router.post('/webhook', (req, res) => {
    const payload = req.body;
    console.log('Received webhook:', payload);
    res.status(200).send('Webhook received successfully');
});


module.exports = router;