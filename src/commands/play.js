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

// Cookie Ayarları
if (process.env.YOUTUBE_COOKIES) {
    try {
        let cookies = process.env.YOUTUBE_COOKIES.trim();
        // JSON -> String
        if (cookies.startsWith('[') || cookies.startsWith('{')) {
            try {
                const cookieArray = JSON.parse(cookies);
                if (Array.isArray(cookieArray)) {
                    cookies = cookieArray.map(c => `${c.name}=${c.value}`).join('; ');
                }
            } catch (e) {
                console.warn('⚠️ Cookie JSON parse hatası.');
            }
        } else if (cookies.includes('.youtube.com') || cookies.includes('\t')) {
            // Netscape parser
            try {
                const lines = cookies.split('\n');
                const parsedCookies = [];
                for (const line of lines) {
                    const parts = line.split('\t');
                    if (parts.length >= 7) {
                        parsedCookies.push(`${parts[5]}=${parts[6].trim()}`);
                    }
                }
                if (parsedCookies.length > 0) cookies = parsedCookies.join('; ');
            } catch (e) { }
        }

        // Token set (User-Agent kaldırıldı, default bırakılıyor)
        play.setToken({
            youtube: { cookie: cookies }
        });
        console.log(`✅ YouTube token yapılandırıldı.`);
    } catch (error) {
        console.error('❌ Token err:', error);
    }
}

// SoundCloud yetkilendirmesi (Gerekirse Client ID)
play.getFreeClientID().then((clientID) => {
    play.setToken({
        soundcloud: {
            client_id: clientID
        }
    })
});


export default {
    name: 'play',
    description: 'Müzik çalar (Smart Fallback)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Ses kanalına katılmalısın!');
        }
        if (!args.length) return message.reply('❌ Şarkı adı gir.');

        const query = args.join(' ');
        const infoMessage = await message.channel.send(`🔍 Aranıyor: **${query}**`);

        try {
            await this.playYouTube(message, voiceChannel, query, infoMessage);
        } catch (ytError) {
            console.error("YouTube Error:", ytError);

            if (ytError.message.includes("Sign in") || ytError.message.includes("429")) {
                await infoMessage.edit(`⚠️ YouTube erişimi kısıtlandı. **SoundCloud** üzerinden aranıyor...`);
                try {
                    await this.playSoundCloud(message, voiceChannel, query, infoMessage);
                } catch (scError) {
                    await infoMessage.edit(`❌ İki kaynaktan da sonuç alınamadı.`);
                }
            } else {
                await infoMessage.edit(`❌ Hata: ${ytError.message}`);
            }
        }
    },

    async playYouTube(message, voiceChannel, query, infoMessage) {
        let url = query;
        const validation = play.yt_validate(query);

        if (validation === 'search' || !query.startsWith('http')) {
            const results = await play.search(query, { limit: 1, source: { youtube: "video" } });
            if (!results.length) throw new Error("Sonuç yok");
            url = results[0].url;
        }

        // Info al (Auth check)
        const yt_info = await play.video_info(url);
        // Stream al
        const stream = await play.stream_from_info(yt_info, { quality: 2 });

        this.startStream(message, voiceChannel, stream, yt_info.video_details.title, url, infoMessage, "YouTube");
    },

    async playSoundCloud(message, voiceChannel, query, infoMessage) {
        const results = await play.search(query, { limit: 1, source: { soundcloud: "tracks" } });
        if (!results.length) throw new Error("SC Sonuç yok");

        const url = results[0].url;
        const stream = await play.stream(url);

        this.startStream(message, voiceChannel, stream, results[0].name, url, infoMessage, "SoundCloud");
    },

    startStream(message, voiceChannel, stream, title, url, infoMessage, source) {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        let player = players.get(message.guild.id);
        if (!player) {
            player = createAudioPlayer({
                behaviors: { noSubscriber: NoSubscriberBehavior.Play }
            });
            players.set(message.guild.id, player);
            connection.on(VoiceConnectionStatus.Disconnected, () => players.delete(message.guild.id));
        }

        connection.subscribe(player);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        player.play(resource);

        infoMessage.edit(`🎵 Çalıyor (${source}): **${title}** \n🔗 ${url}`);
    }
};
