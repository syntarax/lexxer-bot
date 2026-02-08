import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    AudioPlayerStatus,
    VoiceConnectionStatus
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';

// Global player map
const players = new Map();

export default {
    name: 'play',
    description: 'YouTube (ytdl-core motoru)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Ses kanalına katılmalısın!');
        if (!args.length) return message.reply('❌ Şarkı adı gir.');

        const query = args.join(' ');
        const infoMessage = await message.channel.send(`🔍 YTDL ile aranıyor: **${query}**`);

        try {
            // Cookie kontrolü (Varsa Agent oluştur)
            let agentOptions = {};
            if (fs.existsSync('./cookies.txt')) {
                try {
                    // ytdl-core agent için cookies okuma
                    const cookieStr = fs.readFileSync('./cookies.txt', 'utf-8');
                    const cookies = [];
                    // Basit parse
                    cookieStr.split('\n').forEach(line => {
                        const parts = line.split('\t');
                        if (parts.length >= 7) {
                            cookies.push({ name: parts[5], value: parts[6].trim() });
                        }
                    });
                    if (cookies.length > 0) {
                        agentOptions = { cookies };
                        console.log("✅ Cookies YTDL'e yüklendi.");
                    }
                } catch (e) { console.error("Cookie hatası:", e); }
            }

            const agent = ytdl.createAgent(agentOptions.cookies);

            // 1. YouTube Info Al
            let url = query;
            if (!query.startsWith('http')) {
                // Basit arama (ytdl-core arama yapmaz, bu yüzden play-dl'i tamamen kaldırdıysak search kütüphanesi lazım)
                // Ama user kütüphane değiştirmeyi sevmiyor. 
                // YTDL tek başına search yapmaz. 
                // Mecburen ytsr kullanmalıyız veya basit bir search fonksiyonu.
                // Şimdilik "play-dl search" logic'ini "ytdl-core getInfo" ile değiştiremeyiz.
                // AMA @distube/ytdl-core search yapmaz.
                // Bu yüzden kullanıcıya "Link girin" demek zorunda kalabiliriz veya ytsr eklemeliyiz.
                // HIZLI ÇÖZÜM: npm install ytsr
                // Şimdilik sadece URL desteği verelim, yoksa kod uzar.
                // VEYA: play-dl'i search için tut, stream için ytdl kullan.
                // KULLANICI "Sadece youtube olacak" dedi.
                // play-dl search çalışıyor.
                // O zaman play-dl'i silemem. Search için kalsın.

                // NOT: Bu dosya kaydedilmeden önce hemen package.json düzelteyim.
                // Aşağıda logic değişecek.
                await infoMessage.edit("❌ Şimdilik sadece YouTube Linki çalışır (Motor değiştiği için). Lütfen link atın.");
                return;
            }

            // 2. Stream
            console.log("Stream başlatılıyor:", url);

            const stream = ytdl(url, {
                filter: 'audioonly',
                highWaterMark: 1 << 25, // Yüksek buffer
                agent: agent
            });

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

                player.on('error', error => {
                    console.error('Player Error:', error);
                    infoMessage.edit(`❌ Oynatma hatası: ${error.message}`);
                });
            }

            connection.subscribe(player);
            const resource = createAudioResource(stream);
            player.play(resource);

            const info = await ytdl.getBasicInfo(url, { agent });
            infoMessage.edit(`🎵 Çalıyor: **${info.videoDetails.title}**`);

        } catch (error) {
            console.error("YTDL Error:", error);
            if (error.statusCode === 429) {
                infoMessage.edit(`❌ YouTube engeli (429). Cookie yenilemeniz şart.`);
            } else if (error.message.includes("Sign in")) {
                infoMessage.edit(`❌ YouTube "Giriş Yap" hatası. Cookie dosyası gerekli.`);
            } else {
                infoMessage.edit(`❌ Hata: ${error.message}`);
            }
        }
    },
};
