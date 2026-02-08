export default {
    name: 'queue',
    description: 'Müzik kuyruğunu gösterir',
    execute(message, args, client) {
        const serverQueue = client.queue.get(message.guild.id);
        if (!serverQueue || !serverQueue.songs.length) return message.reply('❌ Şu an kuyrukta şarkı yok!');

        const q = serverQueue.songs.slice(0, 10).map((song, i) => `${i + 1}. **${song.title}** - \`${song.duration}\` ${i === 0 ? '(Çalıyor)' : ''}`).join('\n');
        message.channel.send(`🎵 **Müzik Kuyruğu** ${serverQueue.songs.length > 10 ? '(İlk 10)' : ''}:\n${q}`);
    },
};
