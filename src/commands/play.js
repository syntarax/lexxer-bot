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

export default {
    name: 'play',
    description: 'Müzik çalar (Play-DL Mod)',
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

            // Stream al
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
            message.reply(`❌ Hata: ${error.message}`);
        }
    },
};
