import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus
} from '@discordjs/voice';
import play from 'play-dl';

// Global player map
const players = new Map();

// Cookie ve Token Ayarları
if (process.env.YOUTUBE_COOKIES) {
    try {
        let cookies = process.env.YOUTUBE_COOKIES.trim();

        // JSON kontrolü
        if (cookies.startsWith('[') || cookies.startsWith('{')) {
            try {
                const cookieArray = JSON.parse(cookies);
                if (Array.isArray(cookieArray)) {
                    cookies = cookieArray.map(c => `${c.name}=${c.value}`).join('; ');
                }
            } catch (e) {
                console.warn('⚠️ Cookie JSON parse uyarısı:', e);
            }
        }

        play.setToken({
            youtube: {
                cookie: cookies
            },
            useragent: ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"]
        });
        console.log(`✅ YouTube token yapılandırıldı. (Uzunluk: ${cookies.length})`);
    } catch (error) {
        console.error('❌ Token configuration error:', error);
    }
}

export default {
    name: 'play',
    description: 'Müzik çalar (Direct Stream)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Ses kanalına katılmalısın!');
        }

        if (!args.length) {
            return message.reply('❌ Şarkı adı veya linki girmelisin!');
        }

        const query = args.join(' ');
        const infoMessage = await message.channel.send(`🔍 İşleniyor: **${query}**`);

        try {
            // Direkt stream almayı dene (play-dl arka planda çözer)
            const stream = await play.stream(query, {
                quality: 2,
                discordPlayerCompatibility: true
            });

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            let player = players.get(message.guild.id);
            if (!player) {
                player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play
                    }
                });
                players.set(message.guild.id, player);

                connection.on(VoiceConnectionStatus.Disconnected, () => {
                    players.delete(message.guild.id);
                });

                player.on('error', error => {
                    console.error('Player hatası:', error);
                    message.channel.send(`❌ Çalma hatası: ${error.message}`);
                });
            }

            connection.subscribe(player);

            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            player.play(resource);

            // Başlık bilgisini almak için ekstra işlem gerekebilir ama stream başladıysa sorun yok
            infoMessage.edit(`🎵 Çalıyor!`);

        } catch (error) {
            console.error(error);
            if (error.message.includes("Sign in")) {
                message.reply(`❌ **Hata:** YouTube cookie sorunu. Lütfen cookie'lerinizi kontrol edin.`);
            } else if (error.message.includes("Invalid URL")) {
                message.reply(`❌ **Hata:** Video formatı çözülemedi. Cookie hatası veya video kısıtlaması olabilir.`);
            } else {
                message.reply(`❌ Hata: ${error.message}`);
            }
        }
    },
};
