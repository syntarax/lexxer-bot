export default {
    name: 'pause',
    description: 'Müziği duraklatır',
    async execute(message) {
        const queue = message.client.distube.getQueue(message);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        if (queue.paused) {
            return message.reply('⏸️ Müzik zaten duraklatılmış!');
        }

        try {
            queue.pause();
            message.channel.send('⏸️ Müzik duraklatıldı!');
        } catch (error) {
            console.error('Pause Error:', error);
            message.channel.send('❌ Müzik duraklatılamadı!');
        }
    },
};
