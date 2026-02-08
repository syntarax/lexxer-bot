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
            // Basit search
            const searchResult = await client.player.search(query, {
                requestedBy: message.author
            });

            if (!searchResult || !searchResult.tracks.length) {
                return message.reply('❌ Sonuç bulunamadı!');
            }

            // Play
            await client.player.play(voiceChannel, searchResult, {
                nodeOptions: {
                    metadata: {
                        channel: message.channel
                    }
                }
            });

        } catch (error) {
            console.error(error);
            return message.reply(`❌ Hata: ${error.message}`);
        }
    },
};
