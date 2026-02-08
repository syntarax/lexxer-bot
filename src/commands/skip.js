export default {
    name: 'skip',
    description: 'Çalan şarkıyı geçer',
    execute(message, args, client) {
        const serverQueue = client.queue.get(message.guild.id);
        if (!message.member.voice.channel) return message.reply('❌ Önce ses kanalına katılmalısın!');
        if (!serverQueue) return message.reply('❌ Şu an çalan bir şarkı yok!');

        message.channel.send('⏭️ Şarkı geçiliyor...');
        serverQueue.player.stop();
    },
};
