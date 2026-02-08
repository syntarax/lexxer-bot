import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("API Key not found in .env");
    process.exit(1);
}

const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log("Testing API Key:", API_KEY.substring(0, 10) + "...");

async function test() {
    try {
        const res = await fetch(URL);
        if (!res.ok) {
            console.error("HTTP Error:", res.status, res.statusText);
            const text = await res.text();
            console.error("Body:", text);
            return;
        }
        const data = await res.json();
        console.log("Success! Available Models:");
        console.log(data.models.map(m => m.name).join('\n'));
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

test();
