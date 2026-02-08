#!/bin/bash

# Discord Bot VDS Güncelleme Scripti
# GitHub'dan son değişiklikleri çeker ve botu yeniden başlatır

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Bot güncelleniyor...${NC}"

# Bot klasörüne git
cd ~/discord-bot || {
    echo -e "${RED}❌ discord-bot klasörü bulunamadı!${NC}"
    exit 1
}

# PM2'de botu durdur
echo -e "${YELLOW}⏸️  Bot durduruluyor...${NC}"
pm2 stop lexxer-bot

# GitHub'dan son değişiklikleri çek
echo -e "${YELLOW}📥 GitHub'dan güncellemeler çekiliyor...${NC}"
git pull origin main

# Bağımlılıkları güncelle
echo -e "${YELLOW}📦 Bağımlılıklar güncelleniyor...${NC}"
npm install

# Botu yeniden başlat
echo -e "${YELLOW}🚀 Bot yeniden başlatılıyor...${NC}"
pm2 restart lexxer-bot

# Mevcut durumu kaydet
pm2 save

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Güncelleme Tamamlandı!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📊 Bot durumunu görmek için:${NC}"
echo "   pm2 status"
echo ""
echo -e "${YELLOW}📝 Logları görmek için:${NC}"
echo "   pm2 logs lexxer-bot"
echo ""

# Logları göster
sleep 2
pm2 logs lexxer-bot --lines 20
