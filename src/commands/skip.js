export default {
    name: 'skip',
    description: 'Çalan şarkıyı atlar',
    async execute(message, args, client) {
        const queue = client.player.queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        queue.node.skip();
        message.channel.send('⏭️ Şarkı atlandı!');
    },
};
