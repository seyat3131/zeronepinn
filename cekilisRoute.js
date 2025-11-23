const express = require('express');
const router = express.Router();
const Cekilis = require('./Cekilis'); // Modeli aynı dizinde ara
const User = require('./User'); // Modeli aynı dizinde ara

const ensureAuth = (req, res, next) => {
    if (req.isAuthenticated()) { return next(); }
    res.status(401).send({ error: 'Bu işlem için oturum açmalısınız.' });
};
const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) { return next(); }
    res.status(403).send({ error: 'Yönetici yetkiniz yok.' });
};

router.get('/', async (req, res) => {
    try {
        const cekilisler = await Cekilis.find().sort({ bitisTarihi: 1 });
        
        const result = cekilisler.map(c => ({
            ...c._doc,
            katilimciSayisi: c.katilimcilar.length,
            katildiMi: req.isAuthenticated() ? c.katilimcilar.some(id => id.toString() === req.user.id.toString()) : false
        }));
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu Hatası');
    }
});

router.post('/duzenle', ensureAdmin, async (req, res) => {
    try {
        const newCekilis = await Cekilis.create(req.body);
        res.status(201).json(newCekilis);
    } catch (err) {
        console.error(err);
        res.status(500).send('Çekiliş oluşturulamadı');
    }
});

router.post('/:id/katil', ensureAuth, async (req, res) => {
    try {
        const cekilisId = req.params.id;
        const userId = req.user.id; 
        const cekilis = await Cekilis.findById(cekilisId);

        if (!cekilis) { return res.status(404).send('Çekiliş bulunamadı.'); }
        if (cekilis.katilimcilar.includes(userId)) { return res.status(400).send('Zaten bu çekilişe katıldınız.'); }
        if (new Date() > cekilis.bitisTarihi) { return res.status(400).send('Bu çekilişin süresi dolmuştur.'); }
        
        cekilis.katilimcilar.push(userId);
        await cekilis.save();

        res.json({ message: 'Başarıyla katıldınız!', katilimciSayisi: cekilis.katilimcilar.length });

    } catch (err) {
        console.error(err);
        res.status(500).send('Katılım Hatası');
    }
});

router.post('/:id/kazanan-sec', ensureAdmin, async (req, res) => {
    try {
        const cekilis = await Cekilis.findById(req.params.id);
        if (!cekilis) { return res.status(404).send('Çekiliş bulunamadı.'); }
        if (new Date() < cekilis.bitisTarihi) { return res.status(400).send('Çekiliş süresi henüz dolmadı.'); }
        if (cekilis.kazanan) { return res.status(400).send('Kazanan zaten seçildi.'); }

        const katilimciSayisi = cekilis.katilimcilar.length;
        if (katilimciSayisi === 0) { return res.status(400).send('Katılımcı yok, kazanan seçilemez.'); }

        const randomIndex = Math.floor(Math.random() * katilimciSayisi);
        const winnerId = cekilis.katilimcilar[randomIndex];

        cekilis.kazanan = winnerId;
        cekilis.aktif = false;
        cekilis.kazananIlanBitis = new Date(Date.now() + 86400000); 
        await cekilis.save();

        const winnerUser = await User.findById(winnerId).select('displayName email');

        res.json({ 
            message: 'Kazanan başarıyla seçildi ve ilan edildi.',
            kazanan: winnerUser 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Kazanan seçme hatası.');
    }
});

module.exports = router;
