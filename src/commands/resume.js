export default {
    name: 'resume',
    description: 'Müziği devam ettirir',
    execute(message, args, client) {
        const serverQueue = client.queue.get(message.guild.id);
        if (!serverQueue) return message.reply('❌ Şu an çalan bir şarkı yok!');

        serverQueue.player.unpause();
        message.channel.send('▶️ Müzik devam ediyor.');
    },
};
