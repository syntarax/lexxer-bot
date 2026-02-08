export default {
    name: 'pause',
    description: 'Müziği duraklatır',
    execute(message, args, client) {
        const serverQueue = client.queue.get(message.guild.id);
        if (!serverQueue) return message.reply('❌ Şu an çalan bir şarkı yok!');

        serverQueue.player.pause();
        message.channel.send('⏸️ Müzik duraklatıldı.');
    },
};
