export default {
    name: 'pause',
    description: 'Müziği duraklatır',
    async execute(message, args, client) {
        const queue = client.player.queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        if (queue.node.isPaused()) {
            return message.reply('⏸️ Müzik zaten duraklatılmış!');
        }

        queue.node.pause();
        message.channel.send('⏸️ Müzik duraklatıldı!');
    },
};
