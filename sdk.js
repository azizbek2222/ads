// Firebase-ni CDN orqali chaqiramiz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, update, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdDnuUlqaHyMYc0vKOmjLFxFSTmWh3gIw",
  authDomain: "sample-firebase-ai-app-955f2.firebaseapp.com",
  databaseURL: "https://sample-firebase-ai-app-955f2-default-rtdb.firebaseio.com",
  projectId: "sample-firebase-ai-app-955f2",
  storageBucket: "sample-firebase-ai-app-955f2.firebasestorage.app",
  messagingSenderId: "310796131581",
  appId: "1:310796131581:web:8cb51b40c06bb83e94f294"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

class AdsGramSDK {
    constructor() {
        // Skript tegidan App ID-ni o'qib olish
        this.appScript = document.querySelector('script[data-app-id]');
        this.appId = this.appScript ? this.appScript.getAttribute('data-app-id') : null;
        this.publisherId = null;
    }

    async showAd(containerId) {
        if (!this.appId) return console.error("AdsGram: App ID topilmadi!");

        // 1. Nashriyotchi (Publisher) ma'lumotlarini olish
        const appSnapshot = await get(ref(db, `publisher_apps/${this.appId}`));
        if (!appSnapshot.exists()) return;
        this.publisherId = appSnapshot.val().ownerId;

        // 2. Bazadan bitta aktiv reklamani tasodifiy olish
        const adsSnapshot = await get(ref(db, 'ads'));
        const ads = adsSnapshot.val();
        if (!ads) return;

        const adIds = Object.keys(ads).filter(id => ads[id].status === 'active' && ads[id].budget > 0);
        if (adIds.length === 0) return;

        const randomAdId = adIds[Math.floor(Math.random() * adIds.length)];
        const ad = ads[randomAdId];

        // 3. HTML-da reklamani ko'rsatish
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="border:1px solid #ddd; border-radius:10px; overflow:hidden; width:300px; font-family:sans-serif; background:white;">
                    <img src="${ad.image}" style="width:100%; height:150px; object-fit:cover;">
                    <div style="padding:10px;">
                        <h4 style="margin:0 0 10px 0;">${ad.title}</h4>
                        <a href="${ad.url}" target="_blank" id="ad-click-btn" 
                           style="display:block; background:#0088cc; color:white; text-align:center; padding:10px; text-decoration:none; border-radius:5px;">
                           Ko'rish
                        </a>
                    </div>
                </div>
            `;

            // 4. Ko'rishlar sonini va Nashriyotchi balansini yangilash
            this.trackImpression(randomAdId);

            // Bosishni kuzatish
            document.getElementById('ad-click-btn').addEventListener('click', () => {
                this.trackClick(randomAdId);
            });
        }
    }

    // Reklama ko'rilganda (Impression)
    trackImpression(adId) {
        const updates = {};
        // Reklama beruvchining byudjetidan ozgina chegirish (masalan $0.01)
        updates[`ads/${adId}/budget`] = increment(-0.01);
        updates[`ads/${adId}/views`] = increment(1);
        
        // Nashriyotchi balansiga pul qo'shish (masalan $0.007 - 30% komissiya sizga qoladi)
        updates[`publishers/${this.publisherId}/balance`] = increment(0.007);
        
        update(ref(db), updates);
    }

    trackClick(adId) {
        update(ref(db, `ads/${adId}`), {
            clicks: increment(1)
        });
    }
}

// Global obyekt sifatida e'lon qilish
window.AdsGram = new AdsGramSDK();
