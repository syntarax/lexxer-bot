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
            youtube: { cookie: cookies },
            useragent: ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"]
        });
        console.log(`✅ YouTube token yapılandırıldı.`);
    } catch (error) {
        console.error('❌ Token configuration error:', error);
    }
}

export default {
    name: 'play',
    description: 'Müzik çalar (Stabil)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Ses kanalına katılmalısın!');
        }

        if (!args.length) {
            return message.reply('❌ Şarkı adı veya linki girmelisin!');
        }

        const query = args.join(' ');
        const infoMessage = await message.channel.send(`🔍 Aranıyor: **${query}**`);

        try {
            let url = query;
            let title = "Bilinmiyor";

            // 1. Arama Yap (Eğer link değilse)
            if (!query.startsWith('http')) {
                const searchResults = await play.search(query, {
                    limit: 1,
                    source: { youtube: "video" }
                });

                if (!searchResults || searchResults.length === 0) {
                    return infoMessage.edit('❌ Sonuç bulunamadı!');
                }
                url = searchResults[0].url;
                title = searchResults[0].title;
            } else {
                // Link doğrulama
                if (play.yt_validate(query) !== 'video') {
                    return infoMessage.edit('❌ Geçersiz YouTube linki.');
                }
            }

            console.log(`Streaming URL: ${url}`);

            // 2. Stream Al
            // discordPlayerCompatibility: false (Çünkü @discordjs/voice kullanıyoruz)
            const stream = await play.stream(url, {
                quality: 2
            });

            // 3. Bağlantı
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
                    console.error('Player hatası:', error.message);
                });
            }

            connection.subscribe(player);

            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            player.play(resource);

            infoMessage.edit(`🎵 Çalıyor: **${title}** \n🔗 ${url}`);

        } catch (error) {
            console.error(error);
            if (error.message.includes("Sign in")) {
                infoMessage.edit(`❌ **Hata:** YouTube bot koruması (Cookies geçersiz).`);
            } else if (error.message.includes("Invalid URL")) {
                infoMessage.edit(`❌ **Hata:** Video kaynağı çözülemedi (URL geçersiz veya kısıtlı).`);
            } else {
                infoMessage.edit(`❌ Hata: ${error.message}`);
            }
        }
    },
};
