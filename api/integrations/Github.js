const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const router = express.Router();
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const createWebhooks = async ({ accessToken, repos }) => {
    console.log('Starting webhook creation for all repositories.');
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({ auth: accessToken });

    const results = await Promise.all(
        repos.map(async ({ owner, repo }) => {
            console.log(`Creating webhook for repository: /${owner}/${repo}`);
            const response = await octokit.request(`POST /repos/${owner}/${repo}/hooks`, {
                owner,
                repo,
                name: 'web',
                active: true,
                events: ['push'],
                config: {
                    url: `https://spike-backend.vercel.app/integrations/github/callback`,
                    content_type: 'json',
                    insecure_ssl: '0'
                },
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (!(response.status >= 200 && response.status < 300)) {
                const error = new Error(JSON.stringify(response.data) || 'Failed to create hooks for all repositories');
                error.status = response.status;
                throw error;
            }
            console.log(`Webhook successfully created for /${owner}/${repo}:`, response.data);
        })
    );
    return results;
};

const getAllRepos = async (accessToken) => {
    console.log('Fetching all repositories for the authenticated user.');
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({ auth: accessToken });

    try {
        const response = await octokit.repos.listForAuthenticatedUser({ visibility: 'all' });
        console.log('Successfully fetched repositories.');
        return response.data.map(repo => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            html_url: repo.html_url,
            api_url: repo.url,
            visibility: repo.visibility,
            pushed_at: repo.pushed_at,
            owner: repo.owner.login
        }));
    } catch (error) {
        console.error('Error fetching repositories:', error);
        throw error;
    }
};

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `https://spike-backend.vercel.app/integrations/github/callback`,
    scope: ['repo']
}, (accessToken, refreshToken, profile, done) => {
    return done(null, { profile, accessToken });
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

router.use(session({
    secret: process.env.COOKIE_KEY,
    resave: false,
    saveUninitialized: false
}));

router.use(passport.initialize());
router.use(passport.session());

router.get('/callback', passport.authenticate('github', { failureRedirect: '/integrations/github/login' }), (req, res) => {
    console.log('GitHub callback successful. User authenticated.');
    const { accessToken } = req.user;
    res.cookie('accessToken', accessToken, {
        signed: true,
        maxAge: 365 * 24 * 60 * 60 * 1000,
        sameSite: 'None',
        secure: true
    });
    console.log('Redirecting to client after setting cookies.');
    res.redirect('https://spike-frontend-pi.vercel.app/selectrepos');
});

router.get('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('username');
    console.log('User logged out. Cookies cleared.');
    res.redirect('/');
});

router.get('/user/repos', async (req, res) => {
    const { accessToken } = req.signedCookies;
    try {
        const repos = await getAllRepos(accessToken);
        console.log('Repository list retrieved for user.');
        res.status(200).json({ repos });
    } catch (error) {
        console.error('Error retrieving repository list:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/user/createhooks', async (req, res) => {
    const { accessToken } = req.signedCookies;
    const { repos } = req.body;
    console.log('Received request to create webhooks for repositories:', repos);
    try {
        await createWebhooks({ accessToken, repos });
        console.log('Webhooks successfully created for all repositories.');
        res.status(200).json({ message: 'Success' });
    } catch (error) {
        console.error('Error creating webhooks:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/webhook', (req, res) => {
    const payload = req.body;
    console.log('Webhook received:', payload);
    res.status(200).send('Webhook received successfully');
});

module.exports = router;
