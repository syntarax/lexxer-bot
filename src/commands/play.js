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

        // 1. JSON Kontrolü (EditThisCookie JSON export)
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
        // 2. Netscape Format Kontrolü (User'ın attığı gibi: .youtube.com TRUE / ...)
        else if (cookies.includes('.youtube.com') || cookies.includes('\t')) {
            try {
                const lines = cookies.split('\n');
                const parsedCookies = [];
                for (const line of lines) {
                    if (line.startsWith('#') || !line.trim()) continue;
                    const parts = line.split('\t');
                    if (parts.length >= 7) {
                        // Netscape format: domain, flag, path, secure, expiration, name, value
                        const name = parts[5];
                        const value = parts[6].trim();
                        parsedCookies.push(`${name}=${value}`);
                    }
                }
                if (parsedCookies.length > 0) {
                    cookies = parsedCookies.join('; ');
                    console.log('✅ Cookies Netscape formatından stringe çevrildi.');
                }
            } catch (e) {
                console.warn('⚠️ Netscape cookie parse hatası:', e);
            }
        }

        // Cookie basit doğrulama
        if (!cookies.includes('SAPISID') && !cookies.includes('__Secure-3PAPISID')) {
            console.warn('⚠️ UYARI: Cookie içinde kritik "SAPISID" bulunamadı.');
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
                url = query;
            } else if (validation === 'playlist') {
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
            const stream = await play.stream(url, {
                quality: 2
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
                userMsg = `❌ **Hata:** YouTube cookie sorunu (Giriş yapılamadı).`;
            } else if (error.message.includes("Invalid URL")) {
                userMsg = `❌ **Hata:** Videoya erişilemedi.`;
            }

            if (infoMessage.editable) {
                infoMessage.edit(userMsg);
            } else {
                message.channel.send(userMsg);
            }
        }
    },
};
