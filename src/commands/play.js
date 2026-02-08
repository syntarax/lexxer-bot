import { QueryType } from 'discord-player';

export default {
    name: 'play',
    description: 'Müzik çalar (Discord-Player)',
    async execute(message, args, client) {
        // Ses kanalına katılma kontrolü
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Bir ses kanalına girin!');
        if (!args.length) return message.reply('❌ Şarkı adı veya link girin.');

        const query = args.join(' ');

        // Kuyruk oluştur veya al
        const queue = client.player.nodes.create(message.guild, {
            metadata: {
                channel: message.channel
            },
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 300000,
            leaveOnEnd: true,
            leaveOnEndCooldown: 300000,
        });

        try {
            if (!queue.connection) await queue.connect(voiceChannel);
        } catch {
            queue.delete();
            return message.reply('❌ Kanala katılamadım!');
        }

        const infoMessage = await message.channel.send(`🔍 Aranıyor: **${query}**`);

        try {
            // Arama ve Çalma
            const result = await client.player.search(query, {
                requestedBy: message.author,
                searchEngine: QueryType.AUTO
            });

            if (!result || !result.tracks.length) {
                return infoMessage.edit('❌ Sonuç bulunamadı.');
            }

            const track = result.tracks[0];
            queue.addTrack(track);

            if (!queue.isPlaying()) await queue.node.play();

            infoMessage.edit(`✅ Kuyruğa eklendi: **${track.title}**`);

        } catch (e) {
            console.error(e);
            return infoMessage.edit(`❌ Hata: ${e.message}`);
        }
    },
};
