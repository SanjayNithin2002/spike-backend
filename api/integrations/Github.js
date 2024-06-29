const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const MongoStore = require('connect-mongo');
const router = express.Router();
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const createWebhooks = async (user) => {
};

const getAllRepos = async (accessToken) => {
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({
        auth: accessToken
    });
    try {
        const response = await octokit.repos.listForAuthenticatedUser({
            visibility: 'all'
        });
        return response.data.map(repo => {
            return {
                id: repo.id,
                name: repo.name, 
                full_name: repo.full_name, 
                html_url: repo.html_url, 
                api_url: repo.url,
                visibility: repo.visibility,
                pushed_at: repo.pushed_at 
            }
        });
    } catch (error) {
        console.log(error);
    }
}

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
        res.redirect('http://localhost:3001/repos');
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

router.get('/user/repos', async (req, res) => {
    console.log(req.user.accessToken);
    try {
        const repos = await getAllRepos(req.user.accessToken);
        res.status(200).json({
            repos: repos
        });
    } catch (error) {
        res.status(500).json({
            error: error
        });
    }
});


router.post('/webhook', (req, res) => {
    const payload = req.body;
    console.log('Received webhook:', payload);
    res.status(200).send('Webhook received successfully');
});

module.exports = router;