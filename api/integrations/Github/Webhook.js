const express = require('express');
const router = express.Router();

const initiateTask = (commit) => {
    console.log(`Initiating task for commit: ${commit.id}`);
}

router.post('/', express.json(), (req, res) => {
    const event = req.headers['x-github-event'];
    if (event === 'push') {
        const commit = req.body.head_commit;
        console.log(`New commit by ${commit.author.name}: ${commit.message}`);
        initiateTask(commit);
    }
    res.sendStatus(200);
});

module.exports = router;
