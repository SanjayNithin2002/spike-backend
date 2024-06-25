const handleCORS = (req, res, next) => {
    const allowedOrigins = ['http://localhost:3000', 'https://spike-frontend-pi.vercel.app/', 'postman://app' ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || origin === undefined) {
        res.header("Access-Control-Allow-Origin", origin || "*");
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Accept, Authorization, Content-Type"
        );
        if (req.method === 'OPTIONS') {
            res.header(
                "Access-Control-Allow-Methods",
                "PUT, POST, PATCH, DELETE, GET"
            );
            return res.status(200).json({});
        }
        next();
    } else {
        return res.status(403).json({ message: "Forbidden" });
    }
}

module.exports = handleCORS;