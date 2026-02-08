import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { DisTube } from 'distube';
import { joinVoiceChannel } from '@discordjs/voice';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import play from 'play-dl';
import { askGemini } from './ai.js';

// Çevre değişkenlerini yükle
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Discord client oluştur
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Komutlar için collection
client.commands = new Collection();

// Müzik kuyruğu için global Map
client.queue = new Map();

// DisTube oluştur - play-dl ile YouTube desteği!
client.distube = new DisTube(client, {
    emitNewSongOnly: false,
    customFilters: {},
});

console.log('✅ DisTube hazır - YouTube desteği çalışıyor!');

// DisTube event listeners
client.distube
    .on('playSong', (queue, song) => {
        console.log(`▶️ Çalıyor: ${song.name}`)
        queue.textChannel.send(`🎵 Şimdi çalıyor: **${song.name}** - \`${song.formattedDuration}\``);
    })
    .on('addSong', (queue, song) => {
        console.log(`➕ Kuyruğa eklendi: ${song.name}`)
        queue.textChannel.send(`✅ Kuyruğa eklendi: **${song.name}** - \`${song.formattedDuration}\``);
    })
    .on('searchSong', (message, query) => {
        console.log(`🔍 Aranıyor: ${query}`);
    })
    .on('searchNoResult', (message, query) => {
        console.log(`❌ Sonuç bulunamadı: ${query}`);
        message.channel.send(`❌ **${query}** için sonuç bulunamadı!`);
    })
    .on('initQueue', (queue) => {
        console.log(`🎵 Kuyruk başlatıldı: ${queue.voiceChannel.name}`);
    })
    .on('error', (channel, error) => {
        console.error('❌ DisTube hatası:', error);
        console.error('Hata detayı:', error.message);
        console.error('Hata kodu:', error.errorCode);
        console.error('Full error:', JSON.stringify(error, null, 2));
        if (channel) channel.send(`❌ Hata: ${error.message}`);
    });

// Komutları yükle
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(`file://${filePath}`);

    if (command.default && 'name' in command.default && 'execute' in command.default) {
        client.commands.set(command.default.name, command.default);
        console.log(`✅ Komut yüklendi: ${command.default.name}`);
    }
}

// Bot hazır olduğunda
client.once('ready', () => {
    console.log(`🤖 Bot hazır! ${client.user.tag} olarak giriş yapıldı.`);
});

// Mesaj dinleyicisi
client.on('messageCreate', async (message) => {
    // Bot mesajlarını atla
    if (message.author.bot) return;

    // AI Sohbet: Prefix yoksa ve bot etiketlendiyse
    if (!message.content.startsWith(process.env.PREFIX)) {
        if (message.mentions.has(client.user)) {
            // "Yazıyor..." efekti
            await message.channel.sendTyping();

            // Kullanıcı mesajından etiketi temizle
            const prompt = message.content.replace(`<@${client.user.id}>`, '').trim();

            if (!prompt) return message.reply('Müzik çalmak için `!play`, sohbet etmek için bana bir şeyler yaz! 🤖');

            try {
                const response = await askGemini(prompt);

                // Mesaj 2000 karakterden uzunsa böl
                if (response.length > 2000) {
                    const chunks = response.match(/[\s\S]{1,1900}/g) || [];
                    for (const chunk of chunks) {
                        await message.reply(chunk);
                    }
                } else {
                    await message.reply(response);
                }
            } catch (error) {
                console.error('AI Hatası:', error);
                await message.reply('Şu an beynim yandı, sonra tekrar dene! 🔥');
            }
        }
        return;
    }

    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`❌ Komut hatası (${commandName}):`, error);
        message.reply('❌ Komutu çalıştırırken bir hata oluştu!');
    }
});

// Bot'u başlat
client.login(process.env.DISCORD_TOKEN);
