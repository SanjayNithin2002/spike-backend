const express = require('express');
const router = express.Router();
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const axios = require('axios');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const createWebhook = async (accessToken, owner, repo) => {
    const webhookUrl = `${process.env.BASE_URL}/integrations/github/webhook`; // Replace with your webhook endpoint
    const config = {
        headers: {
            Authorization: `token ${accessToken}`,
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
        await axios.post(`https://api.github.com/repos/${owner}/${repo}/hooks`, data, config);
        console.log(`Webhook created for repo: ${owner}/${repo}`);
    } catch (error) {
        console.error(`Failed to create webhook for repo: ${owner}/${repo}`, error);
    }
}

router.get('/', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

router.get('/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    async (req, res) => {
        const { accessToken } = req.user;
        const userRepos = await axios.get('https://api.github.com/user/repos', {
            headers: { Authorization: `token ${accessToken}` },
        });
        userRepos.data.forEach(repo => {
            createWebhook(accessToken, repo.owner.login, repo.name);
        });

        res.redirect('/');
    });

module.exports = router;