export default {
    name: 'queue',
    description: 'Müzik sırasını gösterir',
    async execute(message) {
        const queue = message.client.distube.getQueue(message);

        if (!queue) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        const currentSong = queue.songs[0];
        const queueList = queue.songs.slice(1, 11).map((song, index) =>
            `${index + 1}. **${song.name}** - \`${song.formattedDuration}\``
        ).join('\n');

        const embed = {
            color: 0x0099ff,
            title: '🎵 Müzik Sırası',
            fields: [
                {
                    name: '▶️ Şu Anda Çalıyor',
                    value: `**${currentSong.name}**\n\`${currentSong.formattedDuration}\` | Talep eden: ${currentSong.user}`,
                },
            ],
            footer: {
                text: `Toplam ${queue.songs.length} şarkı | Toplam süre: ${queue.formattedDuration}`,
            },
        };

        if (queueList) {
            embed.fields.push({
                name: '📜 Sıradaki Şarkılar',
                value: queueList || 'Sırada şarkı yok',
            });
        }

        message.channel.send({ embeds: [embed] });
    },
};
