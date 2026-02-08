import { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } from '@discordjs/voice';
import play from 'play-dl';

export default {
    name: 'play',
    description: 'Müzik çalar veya sıraya ekler',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Önce bir ses kanalına katılmalısın!');
        if (!args.length) return message.reply('❌ Lütfen bir şarkı adı veya linki gir!');

        const query = args.join(' ');
        const guildId = message.guild.id;

        // Queue kontrolü
        if (!client.queue) client.queue = new Map();

        const serverQueue = client.queue.get(guildId);

        try {
            let song = null;

            // URL kontrolü
            if (query.startsWith('http')) {
                const videoInfo = await play.video_info(query);
                song = {
                    title: videoInfo.video_details.title,
                    url: videoInfo.video_details.url,
                    duration: formatDuration(videoInfo.video_details.durationInSec)
                };
            } else {
                message.channel.send(`🔍 **${query}** aranıyor...`);

                // play-dl ile ara
                const searchResults = await play.search(query, {
                    source: { youtube: "video" },
                    limit: 1
                });

                if (!searchResults || searchResults.length === 0) {
                    return message.channel.send('❌ Sonuç bulunamadı.');
                }

                const video = searchResults[0];
                song = {
                    title: video.title,
                    url: video.url,
                    duration: formatDuration(video.durationInSec)
                };
            }

            // Queue varsa ekle
            if (serverQueue) {
                serverQueue.songs.push(song);
                console.log(`Sıraya eklendi: ${song.title}`);
                return message.channel.send(`✅ **${song.title}** sıraya eklendi!`);
            }

            // Queue yoksa oluştur
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                player: createAudioPlayer(),
                playing: true
            };

            client.queue.set(guildId, queueContruct);
            queueContruct.songs.push(song);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
                queueContruct.connection = connection;
                connection.subscribe(queueContruct.player);

                // Oynatıcı olaylarını dinle
                queueContruct.player.on(AudioPlayerStatus.Idle, () => {
                    queueContruct.songs.shift();

                    if (queueContruct.songs.length > 0) {
                        playSong(message.guild, queueContruct.songs[0], client);
                    } else {
                        message.channel.send('✅ Müzik sırası bitti.');
                        try {
                            if (queueContruct.connection && queueContruct.connection.state.status !== 'destroyed') {
                                queueContruct.connection.destroy();
                            }
                        } catch (e) {
                            console.error('Bağlantı yok etme hatası:', e);
                        }
                        client.queue.delete(guildId);
                    }
                });

                queueContruct.player.on('error', error => {
                    console.error('Player hatası:', error);
                    queueContruct.textChannel.send('❌ Çalma hatası: ' + error.message);
                    queueContruct.player.stop();
                });

                // İlk şarkıyı çal
                playSong(message.guild, queueContruct.songs[0], client);

            } catch (err) {
                console.error(err);
                client.queue.delete(guildId);
                return message.channel.send('❌ Bağlantı hatası: ' + err);
            }

        } catch (error) {
            console.error(error);
            return message.reply('❌ Hata oluştu: ' + error.message);
        }
    },
};

// Şarkı çalma fonksiyonu
async function playSong(guild, song, client) {
    const serverQueue = client.queue.get(guild.id);

    if (!serverQueue) return;

    if (!song) {
        try {
            if (serverQueue.connection && serverQueue.connection.state.status !== 'destroyed') {
                serverQueue.connection.destroy();
            }
        } catch (e) {
            console.error('Bağlantı yok etme hatası (song yok):', e);
        }
        client.queue.delete(guild.id);
        return;
    }

    try {
        console.log(`Hazırlanıyor: ${song.title}`);

        // play-dl ile stream al
        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });

        serverQueue.player.play(resource);
        serverQueue.textChannel.send(`🎵 Çalıyor: **${song.title}** - \`${song.duration}\``);
        console.log(`▶️ Çalıyor: ${song.title}`);

    } catch (error) {
        console.error('Stream hatası:', error);
        serverQueue.textChannel.send(`❌ **${song.title}** çalınamadı: ${error.message}`);
        setTimeout(() => {
            if (serverQueue && serverQueue.player) serverQueue.player.stop();
        }, 1000);
    }
}

// Süre formatlama yardımcı fonksiyonu
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
