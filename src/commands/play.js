export default {
    name: 'play',
    description: 'Müzik çalar veya sıraya ekler',
    async execute(message, args) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Önce bir ses kanalına katılmalısın!');
        }

        if (!args.length) {
            return message.reply('❌ Lütfen bir şarkı adı veya linki gir!');
        }

        const query = args.join(' ');

        try {
            await message.client.distube.play(voiceChannel, query, {
                member: message.member,
                textChannel: message.channel,
                message
            });
        } catch (error) {
            console.error('Play Error:', error);
            message.channel.send(`❌ Hata: ${error.message}`);
        }
    },
};
