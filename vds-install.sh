#!/bin/bash

# Discord Bot VDS İlk Kurulum Scripti
# Bu script VDS'inizde çalıştırılmalıdır

echo "🚀 Discord Bot Kurulumu Başlıyor..."

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Sistem güncellemesi
echo -e "${YELLOW}📦 Sistem güncelleniyor...${NC}"
sudo apt update && sudo apt upgrade -y

# Node.js kurulumu
echo -e "${YELLOW}📦 Node.js kuruluyor...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js kuruldu: $(node --version)${NC}"
else
    echo -e "${GREEN}✅ Node.js zaten yüklü: $(node --version)${NC}"
fi

# Git kurulumu
echo -e "${YELLOW}📦 Git kuruluyor...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt install git -y
    echo -e "${GREEN}✅ Git kuruldu${NC}"
else
    echo -e "${GREEN}✅ Git zaten yüklü${NC}"
fi

# FFmpeg kurulumu
echo -e "${YELLOW}📦 FFmpeg kuruluyor...${NC}"
if ! command -v ffmpeg &> /dev/null; then
    sudo apt install ffmpeg -y
    echo -e "${GREEN}✅ FFmpeg kuruldu${NC}"
else
    echo -e "${GREEN}✅ FFmpeg zaten yüklü${NC}"
fi

# PM2 kurulumu
echo -e "${YELLOW}📦 PM2 kuruluyor...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 kuruldu${NC}"
else
    echo -e "${GREEN}✅ PM2 zaten yüklü${NC}"
fi

# Proje klonlama
echo -e "${YELLOW}📥 Proje indiriliyor...${NC}"
cd ~
if [ -d "discord-bot" ]; then
    echo -e "${RED}⚠️  discord-bot klasörü zaten var. Siliniyor...${NC}"
    rm -rf discord-bot
fi

git clone https://github.com/syntarax/lexxer-bot.git discord-bot
cd discord-bot

# Bağımlılıklar
echo -e "${YELLOW}📦 Bağımlılıklar yükleniyor...${NC}"
npm install

# .env dosyası kontrolü
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 .env dosyası oluşturuluyor...${NC}"
    echo "DISCORD_TOKEN=your_token_here" > .env
    echo "PREFIX=!" >> .env
    echo -e "${RED}⚠️  ÖNEMLI: .env dosyasında DISCORD_TOKEN değerini değiştirmeyi unutmayın!${NC}"
    echo -e "${YELLOW}Komut: nano ~/discord-bot/.env${NC}"
fi

# Bot başlatma
echo -e "${YELLOW}🚀 Bot başlatılıyor...${NC}"
pm2 start src/index.js --name lexxer-bot
pm2 save

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Kurulum Tamamlandı!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 Sonraki Adımlar:${NC}"
echo "1. .env dosyasını düzenleyin:"
echo "   nano ~/discord-bot/.env"
echo ""
echo "2. DISCORD_TOKEN değerini gerçek token'ınızla değiştirin"
echo ""
echo "3. Botu yeniden başlatın:"
echo "   pm2 restart lexxer-bot"
echo ""
echo "4. Logları kontrol edin:"
echo "   pm2 logs lexxer-bot"
echo ""
echo -e "${YELLOW}🔄 PM2'yi otomatik başlatmak için:${NC}"
echo "   pm2 startup"
echo "   (Verdiği komutu çalıştırın)"
echo "   pm2 save"
echo ""
