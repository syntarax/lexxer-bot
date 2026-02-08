import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import ytsr from 'ytsr';

// Global player map (basitlik için memory'de tutuyoruz)
const players = new Map();

export default {
    name: 'play',
    description: 'Müzik çalar (Basit Mod)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Ses kanalına katılmalısın!');
        }

        if (!args.length) {
            return message.reply('❌ Şarkı adı veya linki girmelisin!');
        }

        const query = args.join(' ');
        let url = query;

        // Arama yap
        if (!ytdl.validateURL(query)) {
            message.channel.send(`🔍 Aranıyor: **${query}**`);
            try {
                const searchResults = await ytsr(query, { limit: 1 });
                if (searchResults && searchResults.items.length > 0) {
                    url = searchResults.items[0].url;
                    message.channel.send(`🎵 Bulundu: **${searchResults.items[0].name}**`);
                } else {
                    return message.reply('❌ Sonuç bulunamadı!');
                }
            } catch (error) {
                console.error('Arama hatası:', error);
                return message.reply('❌ Arama sırasında hata oluştu.');
            }
        }

        try {
            // Ses kanalına bağlan
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            // Player oluştur veya mevcut olanı al
            let player = players.get(message.guild.id);
            if (!player) {
                player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play
                    }
                });
                players.set(message.guild.id, player);

                // Bağlantı ve player hata yönetimi
                connection.on(VoiceConnectionStatus.Disconnected, () => {
                    console.log('Bağlantı kesildi.');
                    players.delete(message.guild.id);
                });

                player.on('error', error => {
                    console.error('Player hatası:', error);
                    message.channel.send(`❌ Çalma hatası: ${error.message}`);
                });
            }

            // Bağlantıyı player'a abone yap
            connection.subscribe(player);

            // Stream oluştur
            const stream = ytdl(url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });

            const resource = createAudioResource(stream, {
                inputType: StreamType.Arbitrary
            });

            player.play(resource);
            console.log(`Playing: ${url}`);
            message.channel.send('▶️ Çalıyor!');

        } catch (error) {
            console.error(error);
            message.reply(`❌ Hata: ${error.message}`);
        }
    },
};
