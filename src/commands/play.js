import { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } from '@discordjs/voice';
import YTDlpWrapPkg from 'yt-dlp-wrap';
import ytSearch from 'yt-search';
import fs from 'fs';
import path from 'path';

const YTDlpWrap = YTDlpWrapPkg.default;

// Binary yolu - İşletim sistemine göre ayarla
const isWindows = process.platform === 'win32';
const binaryName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const binaryPath = path.resolve(`./${binaryName}`);
const ytDlpWrap = new YTDlpWrap();

export default {
    name: 'play',
    description: 'Müzik çalar veya sıraya ekler',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Önce bir ses kanalına katılmalısın!');
        if (!args.length) return message.reply('❌ Lütfen bir şarkı adı veya linki gir!');

        const query = args.join(' ');
        const guildId = message.guild.id;

        // Queue kontrolü (index.js'de tanımlanan client.queue)
        // Eğer client.queue yoksa tanımla (safety check)
        if (!client.queue) client.queue = new Map();

        const serverQueue = client.queue.get(guildId);

        try {
            // Binary kontrolü
            if (!fs.existsSync(binaryPath)) {
                console.log(`${binaryName} bulunamadı, indiriliyor...`);
                message.channel.send('⚙️ Gerekli araçlar indiriliyor, lütfen bekleyin...');
                await YTDlpWrap.downloadFromGithub(binaryPath);

                // Linux/Unix'te çalıştırma izni ver
                if (!isWindows) {
                    fs.chmodSync(binaryPath, 0o755);
                    console.log('Yürütme izni verildi.');
                }

                console.log(`${binaryName} indirildi!`);
                ytDlpWrap.setBinaryPath(binaryPath);
            } else {
                ytDlpWrap.setBinaryPath(binaryPath);

                // Mevcut dosyada izin kontrolü (Linux için)
                if (!isWindows) {
                    try {
                        fs.accessSync(binaryPath, fs.constants.X_OK);
                    } catch (e) {
                        fs.chmodSync(binaryPath, 0o755);
                        console.log('Yürütme izni eksikti, verildi.');
                    }
                }
            }

            // Şarkı bilgisi bul
            let song = null;

            // Basit URL kontrolü
            if (query.startsWith('http')) {
                try {
                    const metadata = await ytDlpWrap.getVideoInfo(query);
                    song = {
                        title: metadata.title,
                        url: query,
                        duration: metadata.duration_string || '??:??'
                    };
                } catch (e) {
                    console.error('URL için metadata alınamadı:', e.message);
                    return message.reply('❌ Geçersiz URL veya video bilgisi alınamadı.');
                }
            } else {
                message.channel.send(`🔍 **${query}** aranıyor...`);
                const searchResult = await ytSearch(query);
                if (!searchResult || !searchResult.videos.length) {
                    return message.channel.send('❌ Sonuç bulunamadı.');
                }
                const video = searchResult.videos[0];
                song = {
                    title: video.title,
                    url: video.url,
                    duration: video.timestamp
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
                    // Şarkı bitti, sıradakini al
                    queueContruct.songs.shift(); // Biteni çıkar

                    if (queueContruct.songs.length > 0) {
                        playSong(message.guild, queueContruct.songs[0], client);
                    } else {
                        // Queue bitti
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
                    // Hata olsa bile sıradakine geçmeyi dene
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

    if (!serverQueue) {
        // Queue yoksa veya silinmişse, işlemi durdur
        return;
    }

    if (!song) {
        // Şarkı yoksa queue'yu temizle ve bağlantıyı kes
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

        // Stream URL al - Android player client kullan (bot detection bypass)
        const streamUrlOutput = await ytDlpWrap.execPromise([
            song.url,
            '-f', 'ba',
            '-g',
            '--extractor-args', 'youtube:player_client=android'
        ]);
        const streamUrl = streamUrlOutput.trim();

        // Resource oluştur
        const resource = createAudioResource(streamUrl);
        serverQueue.player.play(resource);

        serverQueue.textChannel.send(`🎵 Çalıyor: **${song.title}** - \`${song.duration}\``);
        console.log(`▶️ Çalıyor: ${song.title}`);

    } catch (error) {
        console.error('Stream hatası:', error);
        serverQueue.textChannel.send(`❌ **${song.title}** çalınamadı: ${error.message}`);
        // Bir sonrakine geçmek için player'ı durdur (Idle tetikler)
        setTimeout(() => {
            if (serverQueue && serverQueue.player) serverQueue.player.stop();
        }, 1000);
    }
}
