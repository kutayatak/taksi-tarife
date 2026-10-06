# Ana sayfa kullanım incelemesi — v1.4.0

Taksi sürücüsünün gerçek ana akışı: bulunduğu yer → sık gidilen çalışma noktası → müşteri hedefi → çalışma noktasına dönüş. Önceki düzen ücret rotalarını en üste taşıyor, çalışma noktasına gitmeyi ise kapalı ve alfabetik bir hedef seçicinin içine saklıyordu. Doğrudan navigasyon ayrıca seçilen tarife başlangıcını değiştirmediğinden sürücü yeni noktaya vardığında yanlış başlangıç tarifesini arayabiliyordu.

Yapılan düzenlemeler:

- **Çalışma noktaları ilk sırada.** Pop Art, Prime, Nurol ve Durak tek ekranda dört büyük düğme olarak görünür. Dokunmak mevcut konumdan navigasyonu açar ve aynı noktayı bir sonraki müşteri tarifesinin başlangıcı yapar.
- **Yanlış başlangıç tarifesi engellenir.** Ana sayfa hedef araması yalnızca seçili tarife başlangıcının rotalarını gösterir. Tüm başlangıçlarda arama Tarifeler sekmesinde korunur.
- **Dönüş tek dokunuştur.** Ücret kartında Pop Art, Prime, Nurol ve Durak dönüş düğmeleri bulunur; dönüş hedefi aynı anda sonraki tarife başlangıcı olur.
- **Hızlı tarifeler ikincil sırada.** Altı rota tek yatay sırada; favoriler, son kullanılanlar ve seçili başlangıçtan öneriler bu sırayla yer alır. Favoriler sekmesinde tam listeye erişilir.
- **Başlangıç ve Nereye? ilk ekranda.** 320×568 dahil test edilen telefon boyutlarında arama alanı alt menünün arkasında kalmaz. GPS önerisi konum satırında yer alır; seçilen başlangıç kendiliğinden değişmez.
- **Gece ve gündüz modu görünür.** Üstteki düğme geçilecek modu adıyla gösterir. Başlık kaydırırken görünür kaldığı için ücret kartında da tema değiştirilebilir. Seçim yerelde saklanır ve sayfa açılırken ilk boyamadan önce uygulanır. Sistem teması seçeneği de vardır.
- **Navigasyon alanı açılıp kapanır.** Sürücü tarife seçmeden herhangi bir kayıtlı hedefe gitmek istediğinde açar. Ücret kartındaki mevcut konumdan navigasyon düğmesi doğrudan kullanılabilir.
- **Ücret ilk bakışta okunur.** Rota seçiminde kart görünür alana gelir; fiyat üst başlık veya alt menü altında kalmaz. Eylem düğmeleri en az 44 piksel yüksekliğindedir.
- **Gündüz odak işareti belirgin.** Klavye ile kullanılan kontrollerin odak çizgisi açık zeminde koyu yeşildir; gece modunda açık renktir.

Kontroller: 320×568, 375×667, 390×844 ve 412×915 ekranlar; gece/gündüz geçişi; yeniden açılışta ve çevrimdışı tema kalıcılığı; sistem temasını izleme; yatay liste ve sayfa taşması; GPS; mevcut konumdan navigasyon; tarife işlemleri; `/` ve `/taksi-tarife/` altında çevrimdışı kullanım ve sürüm güncellemesi. Chromium tarayıcı otomasyonuyla kontrol edildi; fiziksel cihazda araç içi kullanım testi yapılmadı.

Kullanım önerisi: Ayarlar'dan Apple Maps veya Google Maps'i varsayılan seçmek, çalışma noktası ve dönüş navigasyonlarını doğrudan tek dokunuşa indirir. Grand Aras Durak için kesin koordinat kaydedilene kadar harita uygulaması hedef adını arar.
