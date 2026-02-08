import { QueryType } from 'discord-player';

export default {
    name: 'play',
    description: 'Müzik çalar',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Ses kanalına katılmalısın!');
        }

        if (!args.length) {
            return message.reply('❌ Şarkı adı girmelisin!');
        }

        const query = args.join(' ');

        try {
            const searchResult = await client.player.search(query, {
                requestedBy: message.author,
                searchEngine: QueryType.AUTO
            });

            if (!searchResult || !searchResult.tracks.length) {
                return message.reply('❌ Sonuç bulunamadı!');
            }

            // Basit play fonksiyonu
            await client.player.play(voiceChannel, searchResult, {
                nodeOptions: {
                    metadata: {
                        channel: message.channel
                    },
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    selfDeaf: false
                }
            });

            // İlk şarkı ekleniyorsa mesaj atmasına gerek yok, playerStart event'i halleder.
            // Sadece sıraya eklenenleri belirtebiliriz ama basitlik için şimdilik kaldırıyorum.

        } catch (error) {
            console.error(error);
            return message.reply(`❌ Hata: ${error.message}`);
        }
    },
};
