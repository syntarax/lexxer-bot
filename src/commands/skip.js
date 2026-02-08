export default {
    name: 'skip',
    description: 'Çalan şarkıyı atlar',
    async execute(message) {
        const queue = message.client.distube.getQueue(message);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        try {
            await queue.skip();
            message.channel.send('⏭️ Şarkı atlandı!');
        } catch (error) {
            console.error('Skip Error:', error);
            message.channel.send('❌ Şarkı atlanamadı!');
        }
    },
};
