# 🎵 Discord Müzik Botu

Tam özellikli Discord müzik botu! YouTube'dan müzik çalar, kuyruk yönetimi yapar ve daha fazlası.

## ✨ Özellikler

- 🎶 YouTube'dan müzik çalma
- ⏯️ Temel kontroller (çal, duraklat, devam, atla, durdur)
- 📋 Kuyruk yönetimi
- 🔀 Karıştırma (shuffle)
- 🔁 Döngü modları (tek şarkı, tüm kuyruk)
- 🔊 Ses seviyesi kontrolü
- 🎨 Güzel görünümlü embed mesajları
- 📊 İlerleme çubuğu

## 📋 Gereksinimler

- Node.js v16.9.0 veya üzeri
- Discord hesabı ve sunucusu
- Discord Developer Portal'da oluşturulmuş bir bot

## 🚀 Kurulum

### 1. Node.js Kurulumu

Eğer yüklü değilse, [Node.js web sitesinden](https://nodejs.org/) indirin ve kurun.

### 2. Discord Bot Oluşturma

1. [Discord Developer Portal](https://discord.com/developers/applications)'a gidin
2. "New Application" butonuna tıklayın
3. Botunuza bir isim verin ve "Create" butonuna basın
4. Sol menüden "Bot" sekmesine gidin
5. "Add Bot" butonuna tıklayın
6. "Reset Token" butonuna basıp tokenınızı kopyalayın (GÜVENLİ BİR YERE KAYDEDIN!)
7. Aşağı kaydırıp "Privileged Gateway Intents" bölümünden şunları aktif edin:
   - ✅ PRESENCE INTENT
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
8. Sol menüden "OAuth2" > "URL Generator" sekmesine gidin
9. **SCOPES** bölümünden şunları seçin:
   - ✅ `bot`
   - ✅ `applications.commands`
10. **BOT PERMISSIONS** bölümünden şunları seçin:
    - ✅ Send Messages
    - ✅ Embed Links
    - ✅ Attach Files
    - ✅ Use External Emojis
    - ✅ Connect
    - ✅ Speak
    - ✅ Use Voice Activity
11. En alttaki URL'yi kopyalayın ve tarayıcınıza yapıştırın
12. Botunuzu eklemek istediğiniz sunucuyu seçin

### 3. Projeyi Kurma

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env.example` dosyasını `.env` olarak kopyalayın:
```bash
copy .env.example .env
```

3. `.env` dosyasını düzenleyin ve bilgilerinizi girin:
```env
DISCORD_TOKEN=your_bot_token_here
PREFIX=!
CLIENT_ID=your_client_id_here
```

- `DISCORD_TOKEN`: Bot tokenınız (Developer Portal'dan aldığınız)
- `PREFIX`: Komut prefix'i (varsayılan: !)
- `CLIENT_ID`: Uygulama ID'niz (Developer Portal > General Information > Application ID)

### 4. Botu Başlatma

```bash
npm start
```

Bot çalışmaya başladığında şu mesajı göreceksiniz:
```
🤖 Bot hazır! BotIsminiz#0000 olarak giriş yapıldı.
```

## 🎮 Komutlar

### 🎶 Müzik Kontrolleri
- `!play <şarkı adı/URL>` - YouTube'dan şarkı çalar
- `!pause` - Şarkıyı duraklatır
- `!resume` - Şarkıyı devam ettirir
- `!skip` - Şarkıyı atlar
- `!stop` - Müziği durdurur ve ses kanalından ayrılır

### 📋 Kuyruk Yönetimi
- `!queue` - Kuyruğu gösterir
- `!nowplaying` veya `!np` - Şu anki şarkıyı gösterir
- `!shuffle` - Kuyruğu karıştırır

### ⚙️ Ayarlar
- `!volume <0-100>` - Ses seviyesini ayarlar (örn: `!volume 50`)
- `!loop <track/queue/off>` - Döngü modunu ayarlar
  - `track` - Şu anki şarkıyı tekrarlar
  - `queue` - Tüm kuyruğu tekrarlar
  - `off` - Döngüyü kapatır

### ℹ️ Bilgi
- `!help` - Tüm komutları gösterir

## 📝 Kullanım Örnekleri

```
!play Imagine Dragons Believer
!play https://www.youtube.com/watch?v=dQw4w9WgXcQ
!volume 75
!loop track
!shuffle
```

## ⚠️ Önemli Notlar

- **Token Güvenliği**: Bot tokenınızı asla kimseyle paylaşmayın ve GitHub'a yüklemeyin!
- **Ses Kanalı**: Komutları kullanmak için bir ses kanalında olmalısınız
- **İzinler**: Bot'un ses kanallarına bağlanma ve konuşma izni olmalı

## 🐛 Sorun Giderme

### Bot çevrimiçi değil
- `.env` dosyasındaki token'ın doğru olduğundan emin olun
- Bot'un Message Content Intent izninin açık olduğunu kontrol edin

### Müzik çalınmıyor
- Bot'un ses kanalında konuşma izninin olduğunu kontrol edin
- Bir ses kanalında olduğunuzdan emin olun
- Geçerli bir YouTube URL'si veya şarkı adı girdiğinizi kontrol edin

### "Cannot find module" hatası
- `npm install` komutunu çalıştırın

## 📦 Kullanılan Teknolojiler

- [discord.js](https://discord.js.org/) - Discord API wrapper
- [discord-player](https://discord-player.js.org/) - Müzik çalma kütüphanesi
- [ytdl-core](https://github.com/fent/node-ytdl-core) - YouTube video indirme
- [FFmpeg](https://ffmpeg.org/) - Ses işleme

## 📄 Lisans

MIT License - İstediğiniz gibi kullanabilirsiniz!

## 🎉 Keyifli Dinlemeler!

Sorularınız varsa Discord'dan destek alabilirsiniz.
