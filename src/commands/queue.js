export default {
    name: 'queue',
    description: 'Müzik sırasını gösterir',
    async execute(message, args, client) {
        const queue = client.player.queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply('❌ Şu anda çalan bir şarkı yok!');
        }

        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.data.slice(0, 10).map((track, index) =>
            `${index + 1}. **${track.title}** - \`${track.duration}\``
        ).join('\n');

        const embed = {
            color: 0x0099ff,
            title: '🎵 Müzik Sırası',
            fields: [
                {
                    name: '▶️ Şu Anda Çalıyor',
                    value: `**${currentTrack.title}**\n\`${currentTrack.duration}\` | Talep eden: ${currentTrack.requestedBy}`,
                },
            ],
        };

        if (tracks) {
            embed.fields.push({
                name: '📜 Sıradaki Şarkılar',
                value: tracks || 'Sırada şarkı yok',
            });
        }

        message.channel.send({ embeds: [embed] });
    },
};
