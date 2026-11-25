const fs = require("fs");
const db = require('croxydb')
const config = require("./config.json");
const Discord = require("discord.js");
const { EmbedBuilder } = require('discord.js');
const Rest = require("@discordjs/rest");
const DiscordApi = require("discord-api-types/v10");
const { GatewayIntentBits, Partials } = require('discord.js')
const client = new Discord.Client({
	intents:  [
		"AutoModerationConfiguration",
		"AutoModerationExecution",
		"DirectMessageReactions",
		"DirectMessageTyping",
		"DirectMessages",
		"GuildBans",
		"GuildEmojisAndStickers",
		"GuildIntegrations",
		"GuildInvites",
		"GuildMembers",
		"GuildMessageReactions",
		"GuildMessageTyping",
		"GuildMessages",
		"GuildModeration",
		"GuildPresences",
		"GuildScheduledEvents",
		"GuildVoiceStates",
		"GuildWebhooks",
		"Guilds",
		"MessageContent"
	],
    partials: [
		Partials.Channel,
		Partials.GuildMember,
		Partials.Message
	],
});
global.client = client;
client.commands = (global.commands = []);

//
console.log(`[-] ${fs.readdirSync("./commands").length} komut algılandı.`)

for(let commandName of fs.readdirSync("./commands")) {
	if(!commandName.endsWith(".js")) return;

	const command = require(`./commands/${commandName}`);	
	client.commands.push({
		name: command.name.toLowerCase(),
		description: command.description.toLowerCase(),
		options: command.options,
		dm_permission: false,
		type: 1
	});

	console.log(`[+] ${commandName} komutu başarıyla yüklendi.`)
}


console.log(`[-] ${fs.readdirSync("./events").length} olay algılandı.`)

for(let eventName of fs.readdirSync("./events")) {
	if(!eventName.endsWith(".js")) return;

	const event = require(`./events/${eventName}`);	
	const evenet_name = eventName.split(".")[0];

	client.on(event.name, (...args) => {
		event.run(client, ...args)
	});

	console.log(`[+] ${eventName} olayı başarıyla yüklendi.`)
}

// const { joinVoiceChannel } = require('@discordjs/voice');
// client.on('ready', () =>
// joinVoiceChannel({
  //  channelId: "1574486302374502452",
//     guildId: "1482080570296242178",
 //   adapterCreator: client.guilds.cache.get("1482080570296242178").voiceAdapterCreator
//   });
// });


client.once("ready", async() => {
	const rest = new Rest.REST({ version: "10" }).setToken(process.env.token);
  try {
    await rest.put(DiscordApi.Routes.applicationCommands(client.user.id), {
      body: client.commands,  //
    });
	console.log(`${client.user.tag} Aktif! 💕`);

  } catch (error) {
    throw error;
  }
});

client.login(process.env.token)
.catch((err) => {
	console.log(`[x] Discord API'ye istek gönderimi başarısız(token girmeyi unutmuşsun).` + err);
});    


   ////////////////////// LOG AYARLARI //////////////////////

   client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "kapat2") {
        const yetkii = new Discord.EmbedBuilder()
            .setTitle("Yetersiz Yetki!")
            .setDescription("Bu komutu kullanabilmek için `Yönetici` yetkisine ihtiyacın var!")
            .setColor("Red")

        const embed1 = new Discord.EmbedBuilder()
            .setTitle("Başarıyla Sıfırlandı!")
            .setDescription("Log sistemi başarıyla **sıfırlandı**!")
            .setColor("Green")

        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.ManageChannels)) return interaction.reply({ embeds: [yetkii], ephemeral: true })

        db.delete(`mesaj-log_${interaction.guild.id}`)
        db.delete(`kanal-log_${interaction.guild.id}`)
        db.delete(`rol-log_${interaction.guild.id}`)
        db.delete(`emoji-log_${interaction.guild.id}`)
        db.delete(`sunucu-log_${interaction.guild.id}`)
        db.delete(`gelen-giden-log_${interaction.guild.id}`)
        return interaction.reply({ embeds: [embed1], ephemeral: true })
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "ayarlar2") {
        let mesajlog = db.get(`mesaj-log_${interaction.guild.id}`)
        let kanallog = db.get(`kanal-log_${interaction.guild.id}`)
        let rollog = db.get(`rol-log_${interaction.guild.id}`)
        let emojilog = db.get(`emoji-log_${interaction.guild.id}`)
        let sunuculog = db.get(`sunucu-log_${interaction.guild.id}`)
        let gelengidenlog = db.get(`gelen-giden-log_${interaction.guild.id}`)

        const mesaj = new Discord.EmbedBuilder()
            .setTitle("Log Sistem Ayarları")
            .addFields(
                { name: "**Mesaj Log Kanalı**", value: `<#${mesajlog || "Ayarlanmamış"}>`, inline: true },
                { name: "**Kanal Log Kanalı**", value: `<#${kanallog || "Ayarlanmamış"}>`, inline: true },
                { name: "**Rol Log Kanalı**", value: `<#${rollog || "Ayarlanmamış"}>`, inline: true },
                { name: "**Emoji Log Kanalı**", value: `<#${emojilog || "Ayarlanmamış"}>`, inline: true },
                { name: "**Sunucu Log Kanalı**", value: `<#${sunuculog || "Ayarlanmamış"}>`, inline: true },
                { name: "**gelen giden kanalı**", value: `<#${gelengidenlog || "Ayarlanmamış"}>`, inline: true },
            )
            .setColor("Yellow")

        const yetki = new Discord.EmbedBuilder()
            .setTitle("Yetersiz Yetki!")
            .setDescription("Bu komutu kullanabilmek için `Yönetici` yetkisine ihtiyacın var!")
            .setColor("Red")
        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.ManageChannels)) return interaction.reply({ embeds: [yetki], ephemeral: true });

        interaction.reply({ embeds: [mesaj], ephemeral: true })
    }
})


client.on('messageDelete', async (message) => {
    if (!message.author || message.author.bot) return;

    const mesajlog = db.get(`mesaj-log_${message.guild.id}`);
    if (!mesajlog) return console.log('Silme günlüğü bulunamadı');

    try {
        const logs = await message.guild.fetchAuditLogs({
            limit: 1,
            type: 72 
        });

        const entry = logs.entries.first();
        if (!entry) return;

        const { executor } = entry;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${message.author.username}#${message.author.discriminator}`, iconURL: message.author.displayAvatarURL() })
            .setDescription(`${message.channel} kanalında bir mesaj silindi.\nMesaj içeriği: \`${message.content}\`\nMesaj sahibi: ${message.author}\nSilen kişi: ${executor}`);

        client.channels.cache.get(mesajlog).send({ embeds: [embed] });
    } catch (error) {
        console.error('Audit log alınırken bir hata oluştu:', error);
    }
});
client.on(Discord.Events.GuildUpdate, async (oldGuild, newGuild) => {
    if (oldGuild.name === newGuild.name && oldGuild.region === newGuild.region && oldGuild.afkChannelID === newGuild.afkChannelID) {
        return; 
    }

    const sunucuLog = db.get(`sunucu-log_${newGuild.id}`);
    if (!sunucuLog) return;

    const embed = new Discord.MessageEmbed()
        .setTitle(`Sunucu Bilgileri Güncellendi`)
        .setColor('Blue')
        .setTimestamp();

    if (oldGuild.name !== newGuild.name) {
        embed.addField('Eski Sunucu Adı', oldGuild.name, true);
        embed.addField('Yeni Sunucu Adı', newGuild.name, true);
    }

    if (oldGuild.region !== newGuild.region) {
        embed.addField('Eski Sunucu Bölgesi', oldGuild.region, true);
        embed.addField('Yeni Sunucu Bölgesi', newGuild.region, true);
    }

    if (oldGuild.afkChannelID !== newGuild.afkChannelID) {
        const oldAfkChannel = oldGuild.afkChannel ? oldGuild.afkChannel.name : 'Yok';
        const newAfkChannel = newGuild.afkChannel ? newGuild.afkChannel.name : 'Yok';
        embed.addField('Eski AFK Kanalı', oldAfkChannel, true);
        embed.addField('Yeni AFK Kanalı', newAfkChannel, true);
    }

    client.channels.cache.get(sunucuLog).send({ embeds: [embed] });
});
client.on(Discord.Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!newMessage.author || newMessage.author.bot) return;

    const mesajlog = db.get(`mesaj-log_${newMessage.guild.id}`);
    if (!mesajlog) return;

    const embed = new EmbedBuilder()
        .setAuthor({ name: `${newMessage.author.username}#${newMessage.author.discriminator}`, iconURL: newMessage.author.displayAvatarURL() })
        .setDescription(`${newMessage.channel} kanalında bir mesaj güncellendi.\nEski Mesaj: \`${oldMessage.content}\`\nYeni Mesaj: \`${newMessage.content}\``);

    client.channels.cache.get(mesajlog).send({ embeds: [embed] });
});

client.on(Discord.Events.MessageBulkDelete, async (messages) => {
    if (!messages.first().author || messages.first().author.bot) return;

    const mesajlog = db.get(`mesaj-log_${messages.first().guild.id}`);
    if (!mesajlog) return;

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Toplu Mesaj Silindi`, iconURL: messages.first().guild.iconURL() })
        .setDescription(`${messages.first().channel} kanalında mesaj silindi.\nSilinen Mesaj Sayısı: ${messages.size}`);

    client.channels.cache.get(mesajlog).send({ embeds: [embed] });
});

client.on(Discord.Events.ChannelCreate, async (channelLink) => {
    try {
        const kanallog = db.get(`kanal-log_${channelLink.guild.id}`);
        if (!kanallog) return;

        let logChannel = client.channels.cache.get(kanallog);

        if (!logChannel) {
            try {
                logChannel = await channelLink.guild.channels.fetch(kanallog);
            } catch (fetchError) {
                console.error(`Log kanalı bulunamadı veya erişilemedi: ${kanallog}`, fetchError);
                return;
            }
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kanal Açıldı`, iconURL: channelLink.guild.iconURL() })
            .setDescription(`${channelLink} kanalı oluşturuldu.\nKanalın idsi: \`${channelLink.id}\`\nKanalın türü: \`${channelLink.type.toString().replace("0", "Yazı Kanalı").replace("2", "Ses Kanalı").replace("4", "Kategori")}\``);

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Kanal oluşturma log gönderme hatası:', error);
    }
});

client.on(Discord.Events.ChannelDelete, async (channelLink) => {

    const kanallog = db.get(`kanal-log_${channelLink.guild.id}`)
    if(!kanallog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Kanal Silindi`, iconURL: channelLink.guild.iconURL()})
    .setDescription(`\`${channelLink.name}\` kanalı silindi.\nKanalın idsi: \`${channelLink.id}\`\nKanalın türü: \`${channelLink.type.toString().replace("0", "Yazı Kanalı").replace("2", "Ses Kanalı").replace("4", "Kategori")}\``)
    client.channels.cache.get(kanallog).send({ embeds: [embed] })
})

client.on(Discord.Events.ChannelUpdate, async (oldChannel, newChannel) => {
    try {
        const kanallog = db.get(`kanal-log_${newChannel.guild.id}`);
        if (!kanallog) return;

        let logChannel = client.channels.cache.get(kanallog);

        if (!logChannel) {
            try {
                logChannel = await newChannel.guild.channels.fetch(kanallog);
            } catch (fetchError) {
                console.error(`Log kanalı bulunamadı veya erişilemedi: ${kanallog}`);
                return;
            }
        }

        const changedProperties = [];

        if (oldChannel.name !== newChannel.name) {
            changedProperties.push(`İsim: \`${oldChannel.name}\` => \`${newChannel.name}\``);
        }

        if (oldChannel.type !== newChannel.type) {
            const getChannelType = (type) => {
                return type.toString().replace("0", "Yazı Kanalı").replace("2", "Ses Kanalı").replace("4", "Kategori");
            };
            changedProperties.push(`Tür: \`${getChannelType(oldChannel.type)}\` => \`${getChannelType(newChannel.type)}\``);
        }

        

        if (changedProperties.length === 0) {
            return; 
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kanal Güncellendi`, iconURL: newChannel.guild.iconURL() })
            .setDescription(`${newChannel} kanalı güncellendi.\nKanalın ID'si: \`${newChannel.id}\`\n\nDeğişiklikler:\n${changedProperties.join('\n')}`);

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Kanal güncelleme log gönderme hatası:');
    }
});

client.on(Discord.Events.ChannelPinsUpdate, async (channelLink, channelPins) => {

    const kanallog = db.get(`kanal-log_${channelLink.guild.id}`)
    if(!kanallog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Mesaj Sabitlendi`, iconURL: channelLink.guild.iconURL()})
    .setDescription(`${channelLink} kanalında [Bu Mesaj](https://discord.com/channels/1067022779481870357/1068817883381108837/${channelPins}) sabitlendi.`)
    client.channels.cache.get(kanallog).send({ embeds: [embed] })
})

client.on(Discord.Events.GuildRoleCreate, async (roleMention) => {

    const rollog = db.get(`rol-log_${roleMention.guild.id}`)
    if(!rollog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Rol Oluşturuldu`, iconURL: roleMention.guild.iconURL()})
    .setDescription(`${roleMention} rolü oluşturuldu.\nRolün idsi: ${roleMention.id}\nRolün hex kodu: ${roleMention.hexColor}`)
    client.channels.cache.get(rollog).send({ embeds: [embed] })
})

client.on(Discord.Events.GuildRoleDelete, async (roleMention) => {

    const rollog = db.get(`rol-log_${roleMention.guild.id}`)
    if(!rollog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Rol Silindi`, iconURL: roleMention.guild.iconURL()})
    .setDescription(`\`${roleMention.name}\` rolü silindi.\nRolün idsi: ${roleMention.id}\nRolün hex kodu: ${roleMention.hexColor}`)
    client.channels.cache.get(rollog).send({ embeds: [embed] })
})

client.on(Discord.Events.GuildRoleUpdate, async (roleMention, role) => {

    const rollog = db.get(`rol-log_${roleMention.guild.id}`)
    if(!rollog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Rol Güncellendi`, iconURL: roleMention.guild.iconURL()})
    .setDescription(`\`${roleMention.name}\` rolü ${role} olarak güncellendi.\nRolün idsi: ${roleMention.id}\nRolün eski hex kodu: ${roleMention.hexColor}`)
    client.channels.cache.get(rollog).send({ embeds: [embed] })
})

client.on(Discord.Events.GuildEmojiCreate, async (formatEmoji) => {

    const emojilog = db.get(`emoji-log_${formatEmoji.guild.id}`)
    if(!emojilog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Emoji Oluşturuldu`, iconURL: formatEmoji.guild.iconURL()})
    .setDescription(`${formatEmoji} emojisi oluşturuldu.\nEmoji adı: \`${formatEmoji.name}\`\nEmoji türü: ${formatEmoji.animated.toString().replace("true","`Hareketli`").replace("false","`Hareketsiz`")}`)
    client.channels.cache.get(emojilog).send({ embeds: [embed] })
})

client.on(Discord.Events.GuildEmojiDelete, async (formatEmoji) => {

    const emojilog = db.get(`emoji-log_${formatEmoji.guild.id}`)
    if(!emojilog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Emoji Silindi`, iconURL: formatEmoji.guild.iconURL()})
    .setDescription(`\`${formatEmoji.name}\` emojisi silindi.\nEmoji türü: ${formatEmoji.animated.toString().replace("true","`Hareketli`").replace("false","`Hareketsiz`")}`)
    client.channels.cache.get(emojilog).send({ embeds: [embed] })
})

client.on(Discord.Events.GuildEmojiUpdate, async (formatEmoji, emoji) => {

    const emojilog = db.get(`emoji-log_${formatEmoji.guild.id}`)
    if(!emojilog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Emoji Güncellendi`, iconURL: formatEmoji.guild.iconURL()})
    .setDescription(`${formatEmoji} emojisinin adı \`${emoji.name}\` olarak değiştirildi.\nEmojinin eski adı: \`${formatEmoji.name}\``)
    client.channels.cache.get(emojilog).send({ embeds: [embed] })
})

client.on(Discord.Events.GuildBanAdd, async (user) => {

    const cezaLog = db.get(`ceza-log_${user.guild.id}`)
    if(!cezaLog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Kullanıcı Banlandı`, iconURL: user.user.displayAvatarURL()})
    .setDescription(`Banlanan kişi: <@${user.user.id}> (\`${user.user.id}\` - \`${user.user.username}#${user.user.discriminator}\`)`)
    client.channels.cache.get(cezaLog).send({ embeds: [embed] })
})

client.on(Discord.Events.GuildBanRemove, async (user) => {

    const banlog = db.get(`ban-log_${user.guild.id}`)
    if(!banlog) return;

    const embed = new EmbedBuilder()
    .setAuthor({ name: `Bir Kullanıcının Banı Açıldı`, iconURL: user.user.displayAvatarURL()})
    .setDescription(`Banı açılan kişi: <@${user.user.id}> (\`${user.user.id}\` - \`${user.user.username}#${user.user.discriminator}\`)`)
    client.channels.cache.get(cezaLog).send({ embeds: [embed] })
})
client.on(Discord.Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
        const cezaLog = db.get(`ceza-log_${newMember.guild.id}`);
        if (!cezaLog) return;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kullanıcı Zaman Aşımı Aldı`, iconURL: newMember.user.displayAvatarURL() })
            .setDescription(`Zaman aşımı alan kişi: <@${newMember.user.id}> (\`${newMember.user.id}\` - \`${newMember.user.username}#${newMember.user.discriminator}\`)`)
            .addFields({ name: 'Süre', value: `${newMember.communicationDisabledUntil}` });

        client.channels.cache.get(cezaLog).send({ embeds: [embed] });
    }

    if (oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil) {
        const cezaLog = db.get(`ceza-log_${newMember.guild.id}`);
        if (!cezaLog) return;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kullanıcının Zaman Aşımı Kaldırıldı`, iconURL: newMember.user.displayAvatarURL() })
            .setDescription(`Zaman aşımı kaldırılan kişi: <@${newMember.user.id}> (\`${newMember.user.id}\` - \`${newMember.user.username}#${newMember.user.discriminator}\`)`);

        client.channels.cache.get(cezaLog).send({ embeds: [embed] });
    }
});

client.on(Discord.Events.GuildMemberAdd, async (member) => {
    const gelengidenlog = db.get(`gelen-giden-log_${member.guild.id}`);
    
    if(!gelengidenlog) return;
    
    const embed = new EmbedBuilder()
        .setAuthor({ name: `Sunucuya Bir Kullanıcı Katıldı`, iconURL: member.user.displayAvatarURL()})
        .setDescription(`Sunucuya katılan kişi: <@${member.user.id}> (\`${member.user.id}\` - \`${member.user.username}#${member.user.discriminator}\`)`);
    
    client.channels.cache.get(gelengidenlog).send({ embeds: [embed] });
});

client.on(Discord.Events.VoiceStateUpdate, async (oldState, newState) => {
    const sesLog = db.get(`ses-log_${newState.guild.id}`);
    if (!sesLog) return;

    const user = newState.member.user;
    let embed;

    if (!oldState.channelId && newState.channelId) {
        db.set(`voiceJoin_${user.id}`, Date.now());

        embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kullanıcı Ses Kanalına Katıldı`, iconURL: user.displayAvatarURL() })
            .setDescription(`Ses kanalına katılan kişi: <@${user.id}> (\`${user.id}\` - \`${user.username}#${user.discriminator}\`)\nKatıldığı kanal: \`${newState.channel.name}\``);
    }

    else if (oldState.channelId && !newState.channelId) {
        const joinTime = db.get(`voiceJoin_${user.id}`);
        const duration = joinTime ? Date.now() - joinTime : 0;
        const durationString = msToTime(duration);

        db.delete(`voiceJoin_${user.id}`);

        embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kullanıcı Ses Kanalından Ayrıldı`, iconURL: user.displayAvatarURL() })
            .setDescription(`Ses kanalından ayrılan kişi: <@${user.id}> (\`${user.id}\` - \`${user.username}#${user.discriminator}\`)\nAyrıldığı kanal: \`${oldState.channel.name}\`\nBulunduğu süre: ${durationString}`);
    }

    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kullanıcı Başka Bir Ses Kanalına Taşındı`, iconURL: user.displayAvatarURL() })
            .setDescription(`Kullanıcı: <@${user.id}> (\`${user.id}\` - \`${user.username}#${user.discriminator}\`)\nEski kanal: \`${oldState.channel.name}\`\nYeni kanal: \`${newState.channel.name}\``);
    }

    else if (!oldState.serverMute && newState.serverMute) {
        embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kullanıcı Ses Kanalında Susturuldu`, iconURL: user.displayAvatarURL() })
            .setDescription(`Ses kanalında susturulan kişi: <@${user.id}> (\`${user.id}\` - \`${user.username}#${user.discriminator}\`)\nBulunduğu kanal: \`${newState.channel.name}\``);
    }

    else if (oldState.serverMute && !newState.serverMute) {
        embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kullanıcının Ses Kanalındaki Susturulması Kaldırıldı`, iconURL: user.displayAvatarURL() })
            .setDescription(`Ses kanalında susturulması kaldırılan kişi: <@${user.id}> (\`${user.id}\` - \`${user.username}#${user.discriminator}\`)\nBulunduğu kanal: \`${newState.channel.name}\``);
    }
    if (!oldState.serverDeaf && newState.serverDeaf) {
        embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kullanıcı Ses Kanalında Sağırlaştırıldı`, iconURL: user.displayAvatarURL() })
            .setDescription(`Ses kanalında sağırlaştırılan kişi: <@${user.id}> (\`${user.id}\` - \`${user.username}#${user.discriminator}\`)\nBulunduğu kanal: \`${newState.channel.name}\``);
    }

    else if (oldState.serverDeaf && !newState.serverDeaf) {
        embed = new EmbedBuilder()
            .setAuthor({ name: `Bir Kullanıcının Ses Kanalındaki Sağırlaştırması Kaldırıldı`, iconURL: user.displayAvatarURL() })
            .setDescription(`Ses kanalındaki sağırlaştırması kaldırılan kişi: <@${user.id}> (\`${user.id}\` - \`${user.username}#${user.discriminator}\`)\nBulunduğu kanal: \`${newState.channel.name}\``);
    }
    if (embed) {
        client.channels.cache.get(sesLog).send({ embeds: [embed] });
    }
});

function msToTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return `${days} gün, ${hours} saat, ${minutes} dakika, ${seconds} saniye`;
}
client.on(Discord.Events.GuildMemberRemove, async (member) => {
    const gelengidenlog = db.get(`gelen-giden-log_${member.guild.id}`);
    if (!gelengidenlog) return;

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Sunucudan Bir Kullanıcı Ayrıldı`, iconURL: member.user.displayAvatarURL() })
        .setDescription(`Sunucudan ayrılan kişi: <@${member.user.id}> (\`${member.user.id}\` - \`${member.user.username}#${member.user.discriminator}\`)`);

    client.channels.cache.get(gelengidenlog).send({ embeds: [embed] });
});
client.on(Discord.Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const rollog = db.get(`rol-log_${newMember.guild.id}`);
    if (!rollog) return;

    const oldRoles = oldMember.roles.cache.map(role => role.id);
    const newRoles = newMember.roles.cache.map(role => role.id);

    const addedRoles = newRoles.filter(role => !oldRoles.includes(role));
    const removedRoles = oldRoles.filter(role => !newRoles.includes(role));

    const executor = await getExecutor(oldMember, newMember);
    
    if (addedRoles.length > 0) {
        const addedRolesInfo = addedRoles.map(roleId => {
            const role = newMember.guild.roles.cache.get(roleId);
            return `${role.name} (\`${role.id}\`)`;
        }).join(", ");

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Rol Eklendi`, iconURL: newMember.user.displayAvatarURL() })
            .setDescription(`Kullanıcıya roller eklendi:\n${addedRolesInfo}\nKullanıcı: <@${newMember.user.id}> (\`${newMember.user.id}\` - \`${newMember.user.username}#${newMember.user.discriminator}\`)\nYetkili: ${executor}`);

        client.channels.cache.get(rollog).send({ embeds: [embed] });
    }

    if (removedRoles.length > 0) {
        const removedRolesInfo = removedRoles.map(roleId => {
            const role = newMember.guild.roles.cache.get(roleId);
            return `${role.name} (\`${role.id}\`)`;
        }).join(", ");

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Rol Kaldırıldı`, iconURL: newMember.user.displayAvatarURL() })
            .setDescription(`Kullanıcıdan roller kaldırıldı:\n${removedRolesInfo}\nKullanıcı: <@${newMember.user.id}> (\`${newMember.user.id}\` - \`${newMember.user.username}#${newMember.user.discriminator}\`)\nYetkili: ${executor}`);

        client.channels.cache.get(rollog).send({ embeds: [embed] });
    }
});

async function getExecutor(oldMember, newMember) {
    const logs = await newMember.guild.fetchAuditLogs({
        type: 72
    });

    const entry = logs.entries.first();
    if (!entry) return "Bilinmiyor";

    return `<@${entry.executor.id}> (\`${entry.executor.id}\` - \`${entry.executor.username}#${entry.executor.discriminator}\`)`;
}
