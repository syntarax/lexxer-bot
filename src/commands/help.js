import { EmbedBuilder } from 'discord.js';

export default {
    name: 'yardım',
    description: 'Tüm komutları ve açıklamalarını gösterir',
    execute(message, args, client) {
        const commands = client.commands;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 Müzik Botu Komutları')
            .setDescription('Aşağıda kullanabileceğiniz komutlar listelenmiştir:')
            .setFooter({ text: 'Youtube Music Bot' })
            .setTimestamp();

        commands.forEach(cmd => {
            embed.addFields({
                name: `!${cmd.name}`,
                value: cmd.description || 'Açıklama yok',
                inline: false
            });
        });

        message.channel.send({ embeds: [embed] });
    },
};
