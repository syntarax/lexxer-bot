export default {
    name: 'stop',
    description: 'Müziği durdurur ve kanaldan ayrılır',
    execute(message, args, client) {
        const serverQueue = client.queue.get(message.guild.id);
        if (!message.member.voice.channel) return message.reply('❌ Önce ses kanalına katılmalısın!');
        if (!serverQueue) return message.reply('❌ Şu an çalan bir şarkı yok!');

        serverQueue.songs = [];
        serverQueue.player.stop();
        message.channel.send('🛑 Müzik durduruldu.');
    },
};
