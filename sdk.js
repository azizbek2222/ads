// Firebase modullarini CDN orqali import qilish
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, update, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase konfiguratsiyasi (Sizning loyihangiz ma'lumotlari)
const firebaseConfig = {
  apiKey: "AIzaSyDdDnuUlqaHyMYc0vKOmjLFxFSTmWh3gIw",
  authDomain: "sample-firebase-ai-app-955f2.firebaseapp.com",
  databaseURL: "https://sample-firebase-ai-app-955f2-default-rtdb.firebaseio.com",
  projectId: "sample-firebase-ai-app-955f2",
  storageBucket: "sample-firebase-ai-app-955f2.firebasestorage.app",
  messagingSenderId: "310796131581",
  appId: "1:310796131581:web:8cb51b40c06bb83e94f294"
};

// Firebase-ni ishga tushirish
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

class AdsGramSDK {
    constructor() {
        // Skript tegidan data-app-id ni qidirish
        const scriptTag = document.querySelector('script[data-app-id]');
        this.appId = scriptTag ? scriptTag.getAttribute('data-app-id') : null;
        this.publisherId = null;
        console.log("AdsGram SDK yuklandi. App ID:", this.appId);
    }

    async showAd(containerId) {
        if (!this.appId) {
            console.error("AdsGram: data-app-id topilmadi!");
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`AdsGram: '${containerId}' ID-li element topilmadi!`);
            return;
        }

        try {
            // 1. Nashriyotchi (Publisher) ID-sini olish
            const appSnap = await get(ref(db, `publisher_apps/${this.appId}`));
            if (!appSnap.exists()) {
                console.error("AdsGram: Noto'g'ri App ID!");
                return;
            }
            this.publisherId = appSnap.val().ownerId;

            // 2. Aktiv reklamalarni bazadan olish
            const adsSnap = await get(ref(db, 'ads'));
            const adsData = adsSnap.val();
            
            if (!adsData) {
                container.innerHTML = "<p>Hozircha reklamalar mavjud emas.</p>";
                return;
            }

            // Aktiv va byudjeti bor reklamalarni filtrlash
            const activeAds = Object.keys(adsData).filter(id => 
                adsData[id].status === 'active' && adsData[id].budget > 0
            );

            if (activeAds.length === 0) {
                container.innerHTML = "<p>Aktiv reklamalar tugagan.</p>";
                return;
            }

            // Tasodifiy bitta reklamani tanlash
            const randomId = activeAds[Math.floor(Math.random() * activeAds.length)];
            const ad = adsData[randomId];

            // 3. Reklamani HTML-ga chiqarish
            container.innerHTML = `
                <div id="adsgram-banner" style="
                    border: 1px solid #ddd; 
                    border-radius: 12px; 
                    overflow: hidden; 
                    max-width: 350px; 
                    font-family: Arial, sans-serif; 
                    background: #fff;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                ">
                    <img src="${ad.image}" style="width: 100%; height: 180px; object-fit: cover;">
                    <div style="padding: 15px;">
                        <h4 style="margin: 0 0 10px; color: #333;">${ad.title}</h4>
                        <a href="${ad.url}" target="_blank" id="ad-cta-btn" style="
                            display: block; 
                            background: #0088cc; 
                            color: white; 
                            text-align: center; 
                            padding: 10px; 
                            text-decoration: none; 
                            border-radius: 8px;
                            font-weight: bold;
                        ">Batafsil ma'lumot</a>
                    </div>
                </div>
            `;

            // 4. Statistikani yangilash (View va Balans)
            this.trackImpression(randomId);

            // Clickni kuzatish
            document.getElementById('ad-cta-btn').addEventListener('click', () => {
                this.trackClick(randomId);
            });

        } catch (error) {
            console.error("AdsGram xatolik:", error);
        }
    }

    async trackImpression(adId) {
        const updates = {};
        // Reklama beruvchidan $0.01 yechish
        updates[`ads/${adId}/budget`] = increment(-0.01);
        updates[`ads/${adId}/views`] = increment(1);
        
        // Nashriyotchi balansiga $0.007 qo'shish
        updates[`publishers/${this.publisherId}/balance`] = increment(0.007);
        
        await update(ref(db), updates);
    }

    async trackClick(adId) {
        await update(ref(db, `ads/${adId}`), {
            clicks: increment(1)
        });
    }
}

// Global ob'ekt sifatida eksport qilish
window.AdsGram = new AdsGramSDK();
