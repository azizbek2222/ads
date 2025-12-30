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
        const scriptTag = document.querySelector('script[data-app-id]');
        this.appId = scriptTag ? scriptTag.getAttribute('data-app-id') : null;
        this.publisherId = null;
    }

    async showInterstitial(seconds = 5) {
        if (!this.appId) return console.error("AdsGram: App ID topilmadi!");

        const appSnap = await get(ref(db, `publisher_apps/${this.appId}`));
        if (!appSnap.exists()) return;
        this.publisherId = appSnap.val().ownerId;

        const adsSnap = await get(ref(db, 'ads'));
        const adsData = adsSnap.val();
        if (!adsData) return;

        const activeAds = Object.keys(adsData).filter(id => adsData[id].status === 'active' && adsData[id].budget > 0);
        if (activeAds.length === 0) return;

        const randomId = activeAds[Math.floor(Math.random() * activeAds.length)];
        const ad = adsData[randomId];

        // To'liq ekranli overlay yaratish
        const overlay = document.createElement('div');
        overlay.id = 'adsgram-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            font-family: sans-serif;
        `;

        overlay.innerHTML = `
            <div style="background: white; width: 90%; max-width: 400px; border-radius: 20px; overflow: hidden; position: relative; text-align: center;">
                <div id="close-timer" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.6); color: white; width: 30px; height: 30px; line-height: 30px; border-radius: 50%; font-size: 14px; font-weight: bold;">
                    ${seconds}
                </div>
                <img src="${ad.image}" style="width: 100%; height: 250px; object-fit: cover;">
                <div style="padding: 20px;">
                    <h2 style="margin: 0 0 10px 0; font-size: 20px;">${ad.title}</h2>
                    <a href="${ad.url}" target="_blank" id="inter-click-btn" style="display: block; background: #0088cc; color: white; padding: 12px; text-decoration: none; border-radius: 10px; font-weight: bold; margin-bottom: 10px;">Batafsil ko'rish</a>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Taymer mantiqi
        let timeLeft = seconds;
        const timerElem = document.getElementById('close-timer');
        const interval = setInterval(() => {
            timeLeft--;
            timerElem.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(interval);
                timerElem.innerHTML = '✕';
                timerElem.style.cursor = 'pointer';
                timerElem.onclick = () => overlay.remove();
            }
        }, 1000);

        // Statistikani yangilash
        this.trackImpression(randomId);
        document.getElementById('inter-click-btn').onclick = () => this.trackClick(randomId);
    }

    async trackImpression(adId) {
        const updates = {};
        updates[`ads/${adId}/budget`] = increment(-0.01);
        updates[`ads/${adId}/views`] = increment(1);
        updates[`publishers/${this.publisherId}/balance`] = increment(0.007);
        await update(ref(db), updates);
    }

    async trackClick(adId) {
        await update(ref(db, `ads/${adId}`), { clicks: increment(1) });
    }
}

window.AdsGram = new AdsGramSDK();
