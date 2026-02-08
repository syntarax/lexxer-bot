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

// Cookie setup
if (process.env.YOUTUBE_COOKIES) {
    try {
        // Çerez formatını kontrol et (JSON array string olmalı)
        // play-dl setToken expects an object with specific keys or a specific format depending on version
        // Usually: play.setToken({ youtube : { cookie : "cookie_string" } })

        // EditThisCookie usually exports an array of objects. play-dl might need conversion or raw cookie string usually.
        // Let's assume user pasted the JSON array from EditThisCookie.
        // However, play-dl documentation often says it needs "cookie string" or specific format.
        // But let's try to set it.

        // Safe approach: Try to parse if JSON, if not use as string.
        let cookies = process.env.YOUTUBE_COOKIES;

        // Basit token set
        play.setToken({
            youtube: {
                cookie: cookies
            }
        });
        console.log('✅ YouTube cookies loaded.');
    } catch (error) {
        console.error('❌ Cookie loading error:', error);
    }
}

export default {
    name: 'play',
    description: 'Müzik çalar (YouTube Premium Mod)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Ses kanalına katılmalısın!');
        }

        if (!args.length) {
            return message.reply('❌ Şarkı adı veya linki girmelisin!');
        }

        const query = args.join(' ');

        // Mesaj gönder
        const infoMessage = await message.channel.send(`🔍 Aranıyor: **${query}**`);

        try {
            // Arama veya Link Çözümleme
            let yt_info;
            if (query.startsWith('https')) {
                if (play.yt_validate(query) === 'video') {
                    yt_info = await play.video_info(query);
                } else {
                    return message.reply('❌ Şu an sadece YouTube video linkleri destekleniyor.');
                }
            } else {
                const searchResults = await play.search(query, {
                    limit: 1,
                    source: { youtube: "video" }
                });

                if (!searchResults || searchResults.length === 0) {
                    return message.reply('❌ Sonuç bulunamadı!');
                }
                yt_info = await play.video_info(searchResults[0].url);
            }

            const video = yt_info.video_details;

            // Stream al (YouTube authentication ile)
            const stream = await play.stream(video.url);

            // Ses kanalına bağlan
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            // Player oluştur veya al
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

            infoMessage.edit(`🎵 Çalıyor: **${video.title}** \n🔗 ${video.url}`);

        } catch (error) {
            console.error(error);

            if (error.message.includes("Sign in")) {
                message.reply(`❌ **Hata:** YouTube bot korumasına takıldık. Lütfen cookie'lerin güncel olduğundan emin olun.`);
            } else {
                message.reply(`❌ Hata: ${error.message}`);
            }
        }
    },
};
