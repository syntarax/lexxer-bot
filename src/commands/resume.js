export default {
    name: 'resume',
    description: 'Duraklatılmış müziği devam ettirir',
    async execute(message) {
        const queue = message.client.distube.getQueue(message);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        if (!queue.paused) {
            return message.reply('▶️ Müzik zaten çalıyor!');
        }

        try {
            queue.resume();
            message.channel.send('▶️ Müzik devam ediyor!');
        } catch (error) {
            console.error('Resume Error:', error);
            message.channel.send('❌ Müzik devam ettirilemedi!');
        }
    },
};
