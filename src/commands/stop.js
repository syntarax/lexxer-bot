export default {
    name: 'stop',
    description: 'Müziği durdurur ve kanaldan ayrılır',
    async execute(message) {
        const queue = message.client.distube.getQueue(message);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        try {
            await queue.stop();
            message.channel.send('⏹️ Müzik durduruldu!');
        } catch (error) {
            console.error('Stop Error:', error);
            message.channel.send('❌ Müzik durdurulamadı!');
        }
    },
};
