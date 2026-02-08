import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Minimal Player setup
const player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    },
    skipFFmpeg: false // Ensure FFmpeg is used
});

// Load default extractors
// In v6 commonjs, this is synchronous or promise based? 
// DefaultExtractors is array of extractors
// player.extractors.loadMulti is async
// Load extractors
async function loadExtractors() {
    try {
        if (player.extractors && typeof player.extractors.loadDefault === 'function') {
            await player.extractors.loadDefault((ext) => !['YouTubeExtractor'].includes(ext)); // Optional filter
            console.log('✅ Default extractors loaded via loadDefault');
        } else if (player.extractors && typeof player.extractors.register === 'function') {
            // v6 compatible registration
            await player.extractors.register(DefaultExtractors);
            console.log('✅ Extractors registered');
        } else {
            console.warn('⚠️ Could not load extractors: player.extractors not found or incompatible.');
        }
    } catch (e) {
        console.error('❌ Extractor loading failed:', e);
    }
}
loadExtractors();

// Commands collection
client.commands = new Collection();
client.player = player; // Access player from client

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        import(pathToFileURL(filePath).href).then(module => {
            const command = module.default;
            if (command.name) {
                client.commands.set(command.name, command);
                console.log(`✅ Komut yüklendi: ${command.name}`);
            }
        });
    }
}

// Basic Player Events
player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`🎵 **Playing:** ${track.title}`);
});

player.events.on('error', (queue, error) => {
    console.error(`[Player Error] ${error.message}`);
});

player.events.on('playerError', (queue, error) => {
    console.error(`[Playback Error] ${error.message}`);
});

client.once('clientReady', () => {
    console.log(`✅ ${client.user.tag} hazır!`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('❌ Bir hata oluştu!');
    }
});

client.login(process.env.DISCORD_TOKEN);
