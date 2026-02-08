# Google Gemini API Anahtarı ve Kurulumu

Botun yapay zeka özelliklerini kullanabilmek için **Generative Language API**'nin açık olduğu bir anahtar gereklidir.

## En Kolay Yöntem (Önerilen)

En garanti yöntem, Google AI Studio üzerinden **yeni bir proje** ile anahtar almaktır.

1. [Google AI Studio - API Key](https://aistudio.google.com/app/apikey) adresine gidin.
2. Oturum açın.
3. Sol üstteki **"Create API Key"** butonuna tıklayın.
4. Açılan menüden **"Create API key in new project"** seçeneğini seçin.
   - *Not: "New project" seçmek, API'nin otomatik olarak açılmasını sağlar.*
5. Size verilen ve `AIza` ile başlayan kodu kopyalayın.

## Mevcut Projede Açmak İsterseniz

Eğer mevcut bir anahtarı kullanacaksanız:

1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin.
2. Anahtarınızın bulunduğu projeyi seçin.
3. Arama çubuğuna **"Generative Language API"** yazın.
4. Çıkan sonuca tıklayın ve **"ENABLE"** (Etkinleştir) butonuna basın.

## Son Adım

Anahtarı aldıktan sonra bana gönderin, bota entegre edelim:

```
AIzaSy... (anahtarınız)
```
