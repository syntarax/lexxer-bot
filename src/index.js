import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Player } from 'discord-player';
import fs from 'fs';
import 'dotenv/config';

// Force load encryption libraries before Discord voice connection
import sodium from 'libsodium-wrappers';
await sodium.ready;

// Client Setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Player Setup (Global)
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
});

// Extractors (YouTube, Spotify, etc.)
await client.player.extractors.loadDefault();

client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    client.commands.set(command.default.name, command.default);
}

const prefix = process.env.PREFIX || '!';

client.once('ready', () => {
    console.log(`✅ Bot Hazır: ${client.user.tag}`);
    console.log(`🎵 Player Hazır: Extractors yüklendi.`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;

    try {
        await client.commands.get(commandName).execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('❌ Komut hatası!');
    }
});

// Player Eventleri (Hata yakalama)
client.player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`🎶 Çalıyor: **${track.title}**`);
});

client.player.events.on('error', (queue, error) => {
    console.log(`[Player Error] ${error.message}`);
    queue.metadata.channel.send(`⚠️ Çalma Hatası: ${error.message}`);
});

client.player.events.on('playerError', (queue, error) => {
    console.log(`[Connection Error] ${error.message}`);
    queue.metadata.channel.send(`⚠️ Bağlantı Hatası: ${error.message}`);
});

// VDS Token (Hardcoded veya Env)
const TOKEN = process.env.DISCORD_TOKEN;
client.login(TOKEN);
