import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// System instruction yerine prompt injection kullanıyoruz (uyumluluk için)
const SYSTEM_PROMPT = "Sen 'Lexxer AI' adında, her konuda yardımcı olan, araştırma yapabilen, zeki ve genel amaçlı bir yapay zeka asistanısın. Kullanıcıların sorularına net, doğru ve kapsamlı cevaplar ver.";

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
});

export async function askGemini(prompt, history = []) {
    if (!apiKey) return "API Key eksik! Lütfen sahibime söyleyin.";

    try {
        const chat = model.startChat({
            history: history,
        });

        // İlk mesajda sistem talimatını ekle (eğer history boşsa)
        let finalPrompt = prompt;
        if (history.length === 0) {
            finalPrompt = `${SYSTEM_PROMPT}\n\nKullanıcı: ${prompt}`;
        }

        const result = await chat.sendMessage(finalPrompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Hatası:", error);
        return "Beynim yandı 🔥 Şu an cevap veremiyorum!";
    }
}
