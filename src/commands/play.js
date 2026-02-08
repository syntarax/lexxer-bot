import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus
} from '@discordjs/voice';
import play from 'play-dl';
import fs from 'fs';

// Global player map
const players = new Map();

// VDS için basit cookie kontrolü (Varsa okur, yoksa zorlamaz)
if (fs.existsSync('./cookies.txt')) {
    try {
        const cookies = fs.readFileSync('./cookies.txt', 'utf-8');
        play.setToken({ youtube: { cookie: cookies } });
        console.log('✅ Cookie bulundu ve yüklendi (Ama zorunlu değil).');
    } catch (e) { }
}

export default {
    name: 'play',
    description: 'Müzik çalar (Saf YouTube Modu)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Ses kanalına katılmalısın!');
        if (!args.length) return message.reply('❌ Link veya isim gir.');

        const query = args.join(' ');
        const infoMessage = await message.channel.send(`🔍 Aranıyor: **${query}**`);

        try {
            let url = query;
            const validation = play.yt_validate(query);

            // Arama veya Link Kontrolü
            if (validation === 'search' || !query.startsWith('http')) {
                const results = await play.search(query, { limit: 1, source: { youtube: "video" } });
                if (!results.length) return infoMessage.edit('❌ Sonuç yok.');
                url = results[0].url;
            }

            console.log("Bulunan URL:", url);

            // Stream (Direkt YouTube)
            // discordPlayerCompatibility: false (Bazı sunucularda false daha iyidir)
            const stream = await play.stream(url);

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            let player = players.get(message.guild.id);
            if (!player) {
                player = createAudioPlayer({
                    behaviors: { noSubscriber: NoSubscriberBehavior.Play }
                });
                players.set(message.guild.id, player);

                connection.on(VoiceConnectionStatus.Disconnected, () => {
                    players.delete(message.guild.id);
                    try { connection.destroy(); } catch (e) { }
                });

                player.on('error', error => {
                    console.error('Player Error:', error);
                    // Hata mesajı atmıyoruz, kullanıcı istemiyor.
                });
            }

            connection.subscribe(player);
            const resource = createAudioResource(stream.stream, { inputType: stream.type });
            player.play(resource);

            infoMessage.edit(`🎵 Çalıyor: **${url}**`);

        } catch (error) {
            console.error("Play Error:", error);
            // Kullanıcıya detaylı hata verelim ki görsün
            infoMessage.edit(`❌ Hata: ${error.message}`);
        }
    },
};
