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

// VDS Cookie (Varsa okur)
if (fs.existsSync('./cookies.txt')) {
    try {
        const cookies = fs.readFileSync('./cookies.txt', 'utf-8');
        play.setToken({ youtube: { cookie: cookies } });
    } catch (e) { }
}

export default {
    name: 'play',
    description: 'Akıllı Müzik Çalar (Kesintisiz)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Ses kanalına katılmalısın!');
        if (!args.length) return message.reply('❌ Şarkı adı gir.');

        const query = args.join(' ');
        const infoMessage = await message.channel.send(`🔍 **${query}** aranıyor...`);

        try {
            // 1. YOUTUBE DENEMESİ
            await this.playYouTube(message, voiceChannel, query, infoMessage);
        } catch (ytError) {
            console.error("YouTube Hata:", ytError.message);

            // 2. OTO-FALLBACK (SOUNDCLOUD)
            // Hata ne olursa olsun (IP block, Sign in, Invalid URL) buraya düşer.
            try {
                // Kullanıcıya çaktırmadan geçiş yapıyoruz veya bilgi veriyoruz
                await infoMessage.edit(`⚠️ YouTube erişimi kısıtlı (VDS IP). **SoundCloud** üzerinden çalınıyor...`);
                await this.playSoundCloud(message, voiceChannel, query, infoMessage);
            } catch (scError) {
                console.error("SC Hata:", scError);
                await infoMessage.edit(`❌ Maalesef şarkı bulunamadı.`);
            }
        }
    },

    async playYouTube(message, voiceChannel, query, infoMessage) {
        let url = query;
        const validation = play.yt_validate(query);

        if (validation === 'search' || !query.startsWith('http')) {
            const results = await play.search(query, { limit: 1, source: { youtube: "video" } });
            if (!results.length) throw new Error("YouTube sonuç yok");
            url = results[0].url;
        }

        // Direkt stream dene
        const stream = await play.stream(url);
        this.startStream(message, voiceChannel, stream, "YouTube", infoMessage);
    },

    async playSoundCloud(message, voiceChannel, query, infoMessage) {
        const results = await play.search(query, { limit: 1, source: { soundcloud: "tracks" } });
        if (!results.length) throw new Error("SoundCloud sonuç yok");

        const url = results[0].url;
        const stream = await play.stream(url);
        this.startStream(message, voiceChannel, stream, `SoundCloud (${results[0].name})`, infoMessage);
    },

    startStream(message, voiceChannel, stream, sourceName, infoMessage) {
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
        }

        connection.subscribe(player);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        player.play(resource);

        infoMessage.edit(`🎵 Çalıyor: **${sourceName}**`);
    }
};
