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
                console.warn('⚠️ Cookie JSON parse uyarısı.');
            }
        } else if (cookies.includes('.youtube.com') || cookies.includes('\t')) {
            try {
                const lines = cookies.split('\n');
                const parsedCookies = [];
                for (const line of lines) {
                    if (line.startsWith('#') || !line.trim()) continue;
                    const parts = line.split('\t');
                    if (parts.length >= 7) {
                        const name = parts[5];
                        const value = parts[6].trim();
                        parsedCookies.push(`${name}=${value}`);
                    }
                }
                if (parsedCookies.length > 0) {
                    cookies = parsedCookies.join('; ');
                }
            } catch (e) {
                console.warn('⚠️ Netscape cookie parse hatası:', e);
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
    description: 'Müzik çalar (Debug Mod)',
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

            // 1. TİP BELİRLEME ve URL ÇÖZÜMLEME
            const validation = play.yt_validate(query);

            if (validation === 'search' || !query.startsWith('http')) {
                const searchResults = await play.search(query, {
                    limit: 1,
                    source: { youtube: "video" }
                });
                if (!searchResults || searchResults.length === 0) {
                    return infoMessage.edit('❌ Sonuç bulunamadı!');
                }
                url = searchResults[0].url;
                await infoMessage.edit(`🔍 Bulundu: **${searchResults[0].title}**`);
            } else if (validation === 'video') {
                url = query;
            } else if (validation === 'playlist') {
                const playlist = await play.playlist_info(query, { incomplete: true });
                const videos = await playlist.all_videos();
                if (videos.length > 0) url = videos[0].url;
            }

            if (!url) throw new Error("URL çözülemedi.");

            console.log(`Resolving stream for: ${url}`);

            // 2. VIDEO INFO AL (Stream öncesi kontrol)
            // Bu adım fail ederse cookie veya video erişimi sorunu vardır.
            const yt_info = await play.video_info(url);

            // 3. STREAM AL (Info üzerinden)
            const stream = await play.stream_from_info(yt_info, {
                quality: 2
            });

            // 4. BAĞLANTIO
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
                message.channel.send(`🎵 Çalıyor: **${yt_info.video_details.title}**`);
            } else {
                infoMessage.edit(`🎵 Çalıyor: **${yt_info.video_details.title}** \n🔗 ${url}`);
            }

        } catch (error) {
            console.error(error);
            let userMsg = `❌ Hata: ${error.message}`;

            if (error.message.includes("Sign in")) {
                userMsg = `❌ **Yetkilendirme Hatası:** Cookie geçersiz veya YouTube IP'yi engelliyor.`;
            } else if (error.message.includes("Invalid URL")) {
                userMsg = `❌ **URL Hatası:** Video bilgisi alınamadı.`;
            }

            if (infoMessage.editable) {
                infoMessage.edit(userMsg);
            } else {
                message.channel.send(userMsg);
            }
        }
    },
};
