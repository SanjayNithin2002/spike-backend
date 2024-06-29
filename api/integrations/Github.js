const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
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

router.get('/callback', passport.authenticate('github', { failureRedirect: '/integrations/github/login' }),
    (req, res) => {
        const { accessToken, profile } = req.user;
        res.cookie('accessToken', accessToken,
            {
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: 'none',
                secure: false
            });
        res.cookie('username', profile.username,
            {
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: 'none',
                secure: false
            });
        res.redirect(`http://localhost:3001/selectrepos`);
    }
);

router.get('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('username');
    res.redirect('/');
});

router.get('/user', (req, res) => {
    const { accessToken, profile } = req.cookies;
    if (accessToken && profile) {
        res.json({ username: profile.username });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});


router.get('/user/repos', async (req, res) => {
    const { accessToken, profile } = req.cookies;
    try {
        const repos = await getAllRepos(accessToken);
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