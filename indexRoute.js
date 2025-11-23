const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            isLoggedIn: true,
            isAdmin: req.user.isAdmin,
            displayName: req.user.displayName,
            email: req.user.email,
        });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// ************* YOL GÜNCELLEMESİ YAPILDI *************
// index.html'i aynı dizinden sun
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
module.exports = router;
