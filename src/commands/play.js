export default {
    name: 'play',
    description: 'Müzik çalar veya sıraya ekler',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Önce bir ses kanalına katılmalısın!');
        }

        if (!args.length) {
            return message.reply('❌ Lütfen bir şarkı adı veya linki gir!');
        }

        const query = args.join(' ');

        try {
            const searchResult = await client.player.search(query, {
                requestedBy: message.author
            });

            if (!searchResult.hasTracks()) {
                return message.reply('❌ Sonuç bulunamadı!');
            }

            try {
                const { track } = await client.player.play(voiceChannel, searchResult, {
                    nodeOptions: {
                        metadata: {
                            channel: message.channel,
                            client: message.guild.members.me,
                            requestedBy: message.author
                        }
                    }
                });

                // İlk şarkı ise mesaj gönder
                if (!client.player.queues.get(message.guild.id).tracks.data.length) {
                    return message.channel.send(`🎵 Çalıyor: **${track.title}**`);
                }
            } catch (error) {
                console.error('Play error:', error);
                return message.channel.send(`❌ Çalma hatası: ${error.message}`);
            }
        } catch (error) {
            console.error('Search error:', error);
            return message.reply(`❌ Arama hatası: ${error.message}`);
        }
    },
};
