document.addEventListener('DOMContentLoaded', () => {
    const userArea = document.getElementById('user-area');
    const adminPanel = document.getElementById('admin-panel');
    const bitenCekilislerArea = document.getElementById('biten-cekilisler-area');
    const cekilisListesi = document.getElementById('cekilis-listesi');
    
    const addModal = document.getElementById('add-modal');
    const kazananModal = document.getElementById('kazanan-modal');
    const addCekilisForm = document.getElementById('add-cekilis-form');
    const addCekilisBtn = document.getElementById('add-cekilis-btn');
    const kazananSecBtn = document.getElementById('kazanan-sec-btn');

    let currentCekilisId = null; 

    const formatTimeRemaining = (dateString) => {
        const diff = new Date(dateString) - new Date();
        if (diff <= 0) return 'SÜRESİ DOLDU';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return `${days}G ${hours}S ${minutes}D ${seconds}S`;
    };

    const checkUserStatus = async () => {
        try {
            const res = await fetch('/api/user');
            const user = await res.json();
            
            if (user.isLoggedIn) {
                userArea.innerHTML = `
                    <span class="user-info">Hoş geldin, **${user.displayName}**</span>
                    <a href="/auth/logout" class="logout-btn">Çıkış Yap</a>
                `;
                if (user.isAdmin) {
                    adminPanel.style.display = 'block';
                    document.getElementById('admin-info').innerHTML = `Giriş: **${user.email}**`;
                }
            } else {
                userArea.innerHTML = `
                    <a href="/auth/google" class="login-btn">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" style="height:20px; vertical-align:middle;">
                        Google ile Giriş Yap
                    </a>
                `;
            }
            fetchCekilisler(user);
        } catch (error) {
            console.error('Kullanıcı durumu kontrol edilemedi:', error);
            fetchCekilisler({ isLoggedIn: false });
        }
    };

    const generateActionButton = (cekilis, user) => {
        if (cekilis.kazanan) {
             return `<button class="kazanan-ilan-btn">🏆 Kazanan Belli</button>`;
        }
        const now = new Date();
        const endTime = new Date(cekilis.bitisTarihi);

        if (user.isAdmin && endTime < now) {
            return `<button class="kazanan-sec-btn">🎰 Kazanan Seç ve İlan Et</button>`;
        }
        
        if (endTime < now) {
            return `<button class="disabled-btn">SÜRESİ DOLDU</button>`;
        }

        if (user.isLoggedIn) {
            if (cekilis.katildiMi) {
                return `<button class="disabled-btn">Zaten Katıldın</button>`;
            } else {
                return `<button class="katil-btn">Katıl</button>`;
            }
        } else {
            return `<a href="/auth/google" class="login-prompt-btn">Giriş Yap, Katıl</a>`;
        }
    };

    const createCekilisCard = (cekilis, user) => {
        const card = document.createElement('div');
        card.className = 'cekilis-card';
        card.innerHTML = `
            <img src="${cekilis.imageUrl}" alt="${cekilis.name}">
            <h3>${cekilis.name}</h3>
            <p class="description">${cekilis.description}</p>
            <div class="info">
                <p>Kalan Süre: <span class="time-left" data-date="${cekilis.bitisTarihi}"></span></p>
                <p>Katılımcı: <span>${cekilis.katilimciSayisi}</span></p>
            </div>
            <div class="actions">
                ${generateActionButton(cekilis, user)}
            </div>
        `;
        
        const kazananSecButton = card.querySelector('.kazanan-sec-btn');
        if (kazananSecButton) {
            kazananSecButton.addEventListener('click', () => {
                showKazananModal(cekilis._id, cekilis.name);
            });
        }
        
        const joinButton = card.querySelector('.katil-btn');
        if (joinButton) {
            joinButton.addEventListener('click', () => {
                handleJoin(cekilis._id, card);
            });
        }
        
        return card;
    };

    const handleJoin = async (cekilisId, card) => {
        try {
            const res = await fetch(`/api/cekilis/${cekilisId}/katil`, { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                const katilimciSpan = card.querySelector('.info p:last-child span');
                katilimciSpan.textContent = data.katilimciSayisi;
                const actionsDiv = card.querySelector('.actions');
                actionsDiv.innerHTML = `<button class="disabled-btn">Zaten Katıldın</button>`;
            } else {
                alert('Hata: ' + data.error);
            }
        } catch (error) {
            console.error('Katılım Hatası:', error);
            alert('Katılım sırasında bir hata oluştu.');
        }
    };

    const showKazananModal = (cekilisId, cekilisName) => {
        currentCekilisId = cekilisId;
        document.getElementById('kazanan-modal-text').textContent = `${cekilisName} için kazananı rastgele seçmek üzeresiniz. Bu işlem geri alınamaz.`;
        kazananModal.style.display = 'block';
    };

    kazananSecBtn.onclick = async () => {
        if (!currentCekilisId) return;

        try {
            const res = await fetch(`/api/cekilis/${currentCekilisId}/kazanan-sec`, { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                alert(`Tebrikler! Kazanan: ${data.kazanan.displayName} (${data.kazanan.email}). Çekiliş ilan edildi.`);
                kazananModal.style.display = 'none';
                checkUserStatus(); 
            } else {
                alert('Hata: ' + data.error);
            }
        } catch (error) {
            console.error('Kazanan Seçme Hatası:', error);
            alert('Kazanan seçimi sırasında bir hata oluştu.');
        }
    };

    const fetchCekilisler = async (user) => {
        try {
            const res = await fetch('/api/cekilis');
            const cekilisler = await res.json();

            cekilisListesi.innerHTML = '<h2>✨ Aktif Çekilişler</h2>';
            bitenCekilislerArea.innerHTML = ''; 
            let bitenCekilisCount = 0;

            cekilisler.forEach(cekilis => {
                const card = createCekilisCard(cekilis, user);
                const now = new Date();
                const endTime = new Date(cekilis.bitisTarihi);

                if (endTime > now && !cekilis.kazanan) {
                    cekilisListesi.appendChild(card);
                } else if (user.isAdmin && endTime < now && !cekilis.kazanan) {
                    const adminCard = document.createElement('div');
                    adminCard.className = 'admin-cekilis-bitmis';
                    adminCard.innerHTML = `
                        **${cekilis.name}** - Bitti (${cekilis.katilimciSayisi} Katılımcı) 
                        ${generateActionButton(cekilis, user)}
                    `;
                    bitenCekilislerArea.appendChild(adminCard);
                    bitenCekilisCount++;
                }
            });

            if (bitenCekilisCount > 0) {
                 const title = document.createElement('h3');
                 title.textContent = "⌛ Biten ve Kazananı Beklenen Çekilişler";
                 adminPanel.insertBefore(title, bitenCekilislerArea);
            }

            setInterval(() => {
                document.querySelectorAll('.time-left').forEach(span => {
                    span.textContent = formatTimeRemaining(span.getAttribute('data-date'));
                });
            }, 1000);

        } catch (error) {
            console.error('Çekilişler yüklenemedi:', error);
            cekilisListesi.innerHTML = '<p>Çekilişler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>';
        }
    };
    
    addCekilisBtn.onclick = () => addModal.style.display = 'block';
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = () => {
            addModal.style.display = 'none';
            kazananModal.style.display = 'none';
        }
    });

    addCekilisForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const newCekilis = {
            name: document.getElementById('cekilis-name').value,
            imageUrl: document.getElementById('cekilis-image-url').value,
            description: document.getElementById('cekilis-description').value,
            bitisTarihi: document.getElementById('cekilis-bitis-tarihi').value,
        };

        try {
            const res = await fetch('/api/cekilis/duzenle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCekilis)
            });

            if (res.ok) {
                alert('Yeni çekiliş başarıyla eklendi!');
                addModal.style.display = 'none';
                addCekilisForm.reset();
                checkUserStatus(); 
            } else {
                const errorData = await res.json();
                alert('Hata: Çekiliş eklenemedi: ' + (errorData.error || 'Bilinmeyen Hata'));
            }
        } catch (error) {
            console.error('Çekiliş Ekleme Hatası:', error);
            alert('Sunucuya bağlanılamadı.');
        }
    };

    checkUserStatus();
});
