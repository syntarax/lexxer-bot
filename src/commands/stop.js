export default {
    name: 'stop',
    description: 'Müziği durdurur ve kanaldan ayrılır',
    async execute(message, args, client) {
        const queue = client.player.queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        queue.delete();
        message.channel.send('⏹️ Müzik durduruldu!');
    },
};
