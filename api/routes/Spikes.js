const express = require('express');
const mongoose = require('mongoose');
const Spikes = require('../models/Spikes');
const router = express.Router();
const checkAuth = require('../middlewares/checkAuth');

router.get('/', checkAuth, async (req, res) => {
    try {
        const spikes = await Spikes.find().exec();
        console.log('Get All Spikes.', spikes);
        res.status(200).json({ spikes });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', checkAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const spike = await Spikes.findById(id).exec();
        console.log('Get Spike by Id.', spike);
        res.status(200).json({ spike });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/', checkAuth, async (req, res) => {
    try {
        const newSpike = new Spikes({
            _id: new mongoose.Types.ObjectId(), 
            metric: req.body.metric, 
            punishment: req.body.punishment
        });
        const spike = await newSpike.save();
        console.log('Spike Created.', spike);
        res.status(201).json({ message: "Spike created", spike });
    } catch (err) {
        console.error(err);

    }
});

router.delete('/:id', checkAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const spike = await Spikes.findByIdAndDelete(id).exec();
        console.log('Get Spike by Id.', spike);
        res.status(200).json({ spike });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;