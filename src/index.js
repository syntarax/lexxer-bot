import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Player } from 'discord-player';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// discord-player setup
client.player = new Player(client);

// Load default extractors
await client.player.extractors.loadDefault();

// Commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    import(filePath).then(module => {
        const command = module.default;
        if (command.name) {
            client.commands.set(command.name, command);
            console.log(`✅ Komut yüklendi: ${command.name}`);
        }
    });
}

// Player events
client.player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`🎵 Çalıyor: **${track.title}** - \`${track.duration}\``);
});

client.player.events.on('audioTrackAdd', (queue, track) => {
    queue.metadata.channel.send(`✅ Sıraya eklendi: **${track.title}**`);
});

client.player.events.on('disconnect', queue => {
    queue.metadata.channel.send('👋 Ses kanalından ayrıldım!');
});

client.player.events.on('error', (queue, error) => {
    console.error('Player Error:', error);
    queue.metadata.channel.send(`❌ Hata: ${error.message}`);
});

// Bot events
client.once('clientReady', () => {
    console.log(`✅ ${client.user.tag} aktif!`);
    console.log(`📊 ${client.guilds.cache.size} sunucuda aktif`);
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
        console.error(`Komut hatası [${commandName}]:`, error);
        message.reply('❌ Komut çalıştırılırken bir hata oluştu!');
    }
});

client.login(process.env.DISCORD_TOKEN);
