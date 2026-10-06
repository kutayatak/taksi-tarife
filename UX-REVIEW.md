# Ana sayfa kullanım incelemesi — v1.2.0

Taksi sürücüsü için ana akış doğru: sık kullanılan rota → büyük ücret → mevcut konumdan navigasyon. Önceki düzenin sorunu, altı kartın üç satır kaplayıp başlangıç ve arama alanını aşağı itmesiydi. Bağımsız navigasyon formu da sürekli açık olduğundan ana sayfayı gereksiz uzatıyordu.

Yapılan düzenlemeler:

- **Sık kullanılanlar ilk sırada.** Altı rota tek yatay sırada; favoriler, son kullanılanlar ve seçili başlangıçtan öneriler bu sırayla yer alır. Başlangıç ve varış adları her kartta görünür. Favoriler sekmesinde tam listeye erişilir. Hiç geçmiş yokken öneriler olduğu açıkça belirtilir.
- **Başlangıç ve Nereye? ilk ekranda.** 320×568 dahil test edilen telefon boyutlarında arama alanı alt menünün arkasında kalmaz. GPS önerisi konum satırında yer alır; seçilen başlangıç kendiliğinden değişmez.
- **Gece ve gündüz modu görünür.** Üstteki düğme geçilecek modu adıyla gösterir. Başlık kaydırırken görünür kaldığı için ücret kartında da tema değiştirilebilir. Seçim yerelde saklanır ve sayfa açılırken ilk boyamadan önce uygulanır. Sistem teması seçeneği de vardır.
- **Navigasyon alanı açılıp kapanır.** Sürücü tarife seçmeden herhangi bir kayıtlı hedefe gitmek istediğinde açar. Ücret kartındaki mevcut konumdan navigasyon düğmesi doğrudan kullanılabilir.
- **Ücret ilk bakışta okunur.** Rota seçiminde kart görünür alana gelir; fiyat üst başlık veya alt menü altında kalmaz. Eylem düğmeleri en az 44 piksel yüksekliğindedir.
- **Gündüz odak işareti belirgin.** Klavye ile kullanılan kontrollerin odak çizgisi açık zeminde koyu yeşildir; gece modunda açık renktir.

Kontroller: 320×568, 375×667, 390×844 ve 412×915 ekranlar; gece/gündüz geçişi; yeniden açılışta ve çevrimdışı tema kalıcılığı; sistem temasını izleme; yatay liste ve sayfa taşması; GPS; mevcut konumdan navigasyon; tarife işlemleri; `/` ve `/taksi-tarife/` altında çevrimdışı kullanım ve sürüm güncellemesi. Chromium tarayıcı otomasyonuyla kontrol edildi; fiziksel cihazda araç içi kullanım testi yapılmadı.

Kullanım önerisi: sık kullanılan altı rotayı favorilere kaydetmek en kısa akışı sağlar. Bu rotaların fiyatı tek dokunuşla açılır; navigasyon ikinci dokunuşla seçilir.
