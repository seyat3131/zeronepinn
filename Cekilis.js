const mongoose = require('mongoose');

const CekilisSchema = new mongoose.Schema({
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    bitisTarihi: { type: Date, required: true },
    aktif: { type: Boolean, default: true },
    katilimcilar: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    kazanan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    kazananIlanBitis: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cekilis', CekilisSchema);
