# Ana sayfa kullanım incelemesi — v1.5.0

Sürücünün gerçek işi tek bir tekrar eden döngüdür: bulunduğu yeri seç → hedefi seç → o yönün ücretini gör → navigasyonu aç → vardığın hedefi yeni başlangıç olarak kullan.

Yapılan düzenlemeler:

- **Tek ana akış.** Ana sayfa yalnız `Nereden?`, `Nereye?`, ücret ve `Yol tarifini aç` kararlarını öne çıkarır.
- **Hedef fiyat kaydından bağımsızdır.** Her kayıtlı konum hedef seçilebilir. Seçilen yön için gerçek tarife varsa gösterilir; yoksa `Ücret kaydı yok` denir ve tutar üretilmez.
- **Hedef sonraki başlangıçtır.** Harita sağlayıcısına dokunulduğunda hedef, bir sonraki yolculuğun başlangıcı olur. Kullanıcının ayrıca dönüş düğmesi veya ters yön araması yapması gerekmez.
- **Konum favorileri.** Pop Art, Prime, Nurol ve Çilem Market yanındaki taksi durağı başlangıçta sık gidilenlerdedir. Her hedef buraya eklenebilir veya çıkarılabilir.
- **Bulunduğun yeri kaydetme.** Güncel GPS noktası isim ve 250–2000 metre esneklik alanıyla cihazda saklanır. Böylece eşleşme tek koordinat üstünde olmayı gerektirmez.
- **Esnek GPS eşleşmesi.** Uygun kayıtlı noktalar varsayılan 1 km alanla, kullanıcı favorileri kendi seçilen alanıyla değerlendirilir. En yakın uygun kayıt seçilir; şehir/bölge merkezleri otomatik başlangıç yapılmaz.
- **Doğru yön görünür.** Kartta başlangıç ve hedef birlikte yazılır. Örneğin `POP ART → KALE İÇİ` kaydı ile ters yön birbirinden ayrı kabul edilir.
- **Gelişmiş işler ikincildir.** Tüm tarife listesi, fiyat düzenleme, özel rota, koordinat ve yedekleme araçları ayrı sekmelerde kalır.

Kontroller: 320×568, 375×667, 390×844 ve 412×915 ekranlar; kesin yön fiyatı; kayıtsız yön; hedefin sonraki başlangıç olması; GPS favorisi ve yarıçapı; izin/hata senaryoları; `/` ve `/taksi-tarife/` altında çevrimdışı kullanım ve service-worker güncellemesi. Chromium otomasyonuyla doğrulandı; fiziksel araç içi kullanım testi ayrıca yapılmalıdır.
