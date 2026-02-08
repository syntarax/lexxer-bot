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

        // JSON -> String çevrimi
        if (cookies.startsWith('[') || cookies.startsWith('{')) {
            try {
                const cookieArray = JSON.parse(cookies);
                if (Array.isArray(cookieArray)) {
                    cookies = cookieArray.map(c => `${c.name}=${c.value}`).join('; ');
                }
            } catch (e) {
                console.warn('⚠️ Cookie JSON parse uyarısı, olduğu gibi deneniyor.');
            }
        }

        // Cookie basit doğrulama
        if (!cookies.includes('SAPISID') && !cookies.includes('__Secure-3PAPISID')) {
            console.warn('⚠️ UYARI: Cookie içinde kritik "SAPISID" bulunamadı. YouTube girişi başarısız olabilir.');
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
    description: 'Müzik çalar (Gelişmiş Mod)',
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
            let url = query;
            let title = "Müzik";

            // TİP BELİRLEME
            const validation = play.yt_validate(query);

            if (validation === 'video') {
                // Video linki
                url = query;
            } else if (validation === 'playlist') {
                // Playlist ise ilk şarkıyı al
                try {
                    const playlist = await play.playlist_info(query, { incomplete: true });
                    const videos = await playlist.all_videos();
                    if (videos.length > 0) {
                        url = videos[0].url;
                        title = videos[0].title;
                        await infoMessage.edit(`📂 Playlist algılandı: **${playlist.title}**\n▶️ İlk video çalınıyor: **${title}**`);
                    } else {
                        return infoMessage.edit('❌ Boş playlist.');
                    }
                } catch (e) {
                    return infoMessage.edit('❌ Playlist bilgisi alınamadı.');
                }
            } else if (validation === 'search' || !query.startsWith('http')) {
                // Arama
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
                return infoMessage.edit(`❌ Desteklenmeyen link formatı: ${validation || 'Bilinmiyor'}`);
            }

            // STREAM ALMA
            // play-dl'e direkt stream isteği gönderiyoruz. Bu noktada URL kesinlikle bir video URL'si olmalı.
            const stream = await play.stream(url, {
                quality: 2 // High
            });

            // SES BAĞLANTISI
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
                    // Kullanıcıya hata spamlamamak için sadece logluyoruz veya özel mesaj atabiliriz.
                });
            }

            connection.subscribe(player);

            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            player.play(resource);

            if (!infoMessage.editable) {
                message.channel.send(`🎵 Çalıyor: **${title || url}**`);
            } else {
                infoMessage.edit(`🎵 Çalıyor: **${title || url}**`);
            }

        } catch (error) {
            console.error(error);
            let userMsg = `❌ Hata: ${error.message}`;

            if (error.message.includes("Sign in")) {
                userMsg = `❌ **Hata:** YouTube bot koruması. Cookie geçersiz/süresi dolmuş olabilir.`;
            } else if (error.message.includes("Invalid URL") || error.message.includes("not a YouTube Watch URL")) {
                userMsg = `❌ **Hata:** Videoya erişilemedi (URL çözülemedi).`;
            }

            if (infoMessage.editable) {
                infoMessage.edit(userMsg);
            } else {
                message.channel.send(userMsg);
            }
        }
    },
};
