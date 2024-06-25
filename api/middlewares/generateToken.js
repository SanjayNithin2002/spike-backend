const jwt = require('jsonwebtoken');

const generateToken = (userInfo) => {
    return jwt.sign(
        userInfo,
        process.env.JWT_KEY,
        {
            expiresIn: "24h"
        }
    );
}

module.exports = generateToken;
