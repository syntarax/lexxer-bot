import { DisTube } from 'distube';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
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

// DisTube setup - minimal config
client.distube = new DisTube(client, {
    emitNewSongOnly: true
});

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

// DisTube events
client.distube
    .on('playSong', (queue, song) => {
        queue.textChannel.send(`🎵 Çalıyor: **${song.name}** - \`${song.formattedDuration}\`
Talep eden: ${song.user}`);
    })
    .on('addSong', (queue, song) => {
        queue.textChannel.send(`✅ Sıraya eklendi: **${song.name}** - \`${song.formattedDuration}\``);
    })
    .on('addList', (queue, playlist) => {
        queue.textChannel.send(`✅ Playlist eklendi: **${playlist.name}** (${playlist.songs.length} şarkı)`);
    })
    .on('error', (channel, error) => {
        console.error('DisTube Error:', error);
        if (channel) channel.send(`❌ Hata: ${error.message}`);
    })
    .on('finish', queue => {
        queue.textChannel.send('✅ Müzik sırası bitti.');
    })
    .on('disconnect', queue => {
        queue.textChannel.send('👋 Ses kanalından ayrıldım!');
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
