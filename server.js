const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');

// ************* YOL GÜNCELLEMESİ YAPILDI *************
// Klasörler yerine aynı dizindeki dosya adlarını kullan
require('./passport.js')(passport);

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
    } catch (err) {
        console.error(`MongoDB Bağlantı Hatası: ${err}`);
        process.exit(1); 
    }
}
connectDB();

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Public klasörünü kullanmak yerine, Frontend dosyalarını (index.html, script.js, style.css) direkt sunar
app.use(express.static(__dirname));

// ************* YOL GÜNCELLEMESİ YAPILDI *************
// Rota dosyalarını aynı dizinden yükle
app.use('/', require('./indexRoute'));
app.use('/auth', require('./authRoute'));
app.use('/api/cekilis', require('./cekilisRoute'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Sunucu ${process.env.NODE_ENV} ortamında ${PORT} portunda çalışıyor.`));
