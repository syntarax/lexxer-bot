export default {
    name: 'resume',
    description: 'Duraklatılmış müziği devam ettirir',
    async execute(message, args, client) {
        const queue = client.player.queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        if (!queue.node.isPaused()) {
            return message.reply('▶️ Müzik zaten çalıyor!');
        }

        queue.node.resume();
        message.channel.send('▶️ Müzik devam ediyor!');
    },
};
