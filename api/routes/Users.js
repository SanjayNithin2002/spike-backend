const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
const Users = require('../models/Users');
const router = express.Router();
const checkAuth = require('../middlewares/checkAuth');
const generateToken = require('../middlewares/generateToken');

// Get All Users
router.get('/', checkAuth, async (req, res) => {
    try {
        const users = await Users.find().exec();
        console.log('Get All Users.', users);
        res.status(200).json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get User by Id
router.get('/:id', checkAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Users.findById(id).exec();
        if (user) {
            console.log('Get User by Id.', user);
            res.status(200).json({ user });
        } else {
            res.status(404).json({ error: "User Not Found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email }).exec();
        if (!user) {
            return res.status(401).json({ error: "Auth Failed" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = generateToken({ email: user.email, userId: user._id });
            res.cookie('token', token, {
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'None'
            })
            res.cookie('user', JSON.stringify(user), {
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'None'
            });
            res.status(200).json({ message: "Auth Successful"});
        } else {
            return res.status(401).json({ error: "Auth Failed" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// User Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await Users.findOne({ email }).exec();
        if (existingUser) {
            return res.status(422).json({ error: "Email exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new Users({
            _id: new mongoose.Types.ObjectId(),
            name,
            email,
            password: hashedPassword,
        });
        const user = await newUser.save();
        console.log('User Created.', user);
        res.status(201).json({ message: "User created", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update User
router.patch('/:id', checkAuth, async (req, res) => {
    const { id } = req.params;
    const updateOps = req.body.reduce((acc, ops) => ({ ...acc, [ops.propName]: ops.value }), {});
    try {
        const user = await Users.updateOne({ _id: id }, { $set: updateOps }).exec();
        if (user.nModified) {
            console.log('User Edited.', user);
            res.status(200).json({ message: "User Edited" });
        } else {
            res.status(404).json({ error: "User Not Found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete User
router.delete('/:id', checkAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Users.findByIdAndDelete(id).exec();
        if (user) {
            console.log('User Deleted.', user);
            res.status(200).json({ message: "User Deleted" });
        } else {
            res.status(404).json({ error: "User Not Found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
