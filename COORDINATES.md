# Konum araştırması ve eksik noktalar — v1.4.1

Araştırma tarihi: 6 Ekim 2026. **64 konumun 43’ünde koordinat var: 28 işletme/nokta ve 15 bölge referansı. 21 kayıt tamamlanmadı.** 166 rota ve tüm fiyatlar korunmuştur. İnternet araştırması geliştirme sırasında yapıldı; uygulama çalışma sırasında harita/arama/Overpass hizmetine bağlanmaz.

Koordinatlar sahibin verdiği üç pin, harita nesneleri ve adlandırılmış işletme sayfalarından alınmıştır. Harita kaydını doğrulamak, şoförün kullandığı giriş veya buluşma noktasını sahada doğrulamak anlamına gelmez. Bina/alan kayıtlarında yayınlanan referans nokta kullanıldı; giriş, taksi durağı veya ara nokta tahmin edilmedi. Her konumun `coordinateSource`, `sourceName`, `coordinateKind` ve `coordinateCheckedAt` alanı vardır.

`poi` işletme veya kayıtlı noktadır. `area` şehir/köy/bölge referansıdır; tam adres veya durak değildir. Bölge referansları GPS başlangıç önerilerine katılmaz ve navigasyon seçicisinde türü belirtilir. Bölgeye gerçek bir teslimat yapılacaksa adres/pin kullanılmalıdır. Ücretler mesafeden hesaplanmaz.

Kısa etiketlerin bağlamdan eşleştirildiği noktalar: KUNTER → Kunter Güven Hastanesi, LIONS → Lion’s Garden, SİLVER → Silver Beach, ÖNDER → Önder Alışveriş Merkezi, PRIME → Prime Living öğrenci yurdu, PERA → Pera Mackenzie. Görünen kaynak tarife adları değiştirilmedi. EZİÇ VOLA için Eziç Yeniboğaziçi restoran kaydı kullanıldı; Volâ bitişik ayrı işletmedir. Bunların kullanılan buluşma/giriş pinleri farklıysa Ayarlar’dan yerel koordinat girilebilir. ERCAN, eski terminal/airfield merkezi yerine yeni terminaldeki giden yolcu harita noktasını kullanır. SEMA OTEL, sahibinin verdiği Euro Tombala Gazimağusa referansına göre eşleşir.

## Harita bağlantısı veya tam nokta beklenen 21 kayıt

Aşağıdaki adların yanında kısa etiket yerine uzun harita pin bağlantısını veya enlem/boylamı paylaşın. Bir tarife grubu birkaç gerçek yeri kapsıyorsa hangisinin başlangıç sayılacağını da belirtin. “2” etiketlerini Vito diye kesinleştirmeden birleştirmiyoruz.

| Kaynak adı | Neden eksik? |
| --- | --- |
| ÇANAKKALE | Mahalle adı; şoförün kullandığı buluşma noktası gerekli. |
| ÇİN PAZARI | Gazimağusa / Ayluka çevresi bulunuyor; aynı adla başka şehirde de kayıt var. Tam işletme noktası gerekli. |
| GRANDSAPHIRE | Grand Sapphire Resort & Casino adayı bulundu; GRANDSAPPIRE ile aynı yer olduğu henüz teyit edilmedi. |
| KENT PLUS | Gazimağusa/Çanakkale ve Güvercinlik olarak farklı işaretlenmiş ilanlar var; proje veya giriş pinini teyit edin. |
| LİMAN | Hangi liman girişinin/buluşma noktasının kullanıldığı belirtilmeli. |
| MERİT OTEL | Merit Cyprus Gardens adayı var; başka Merit otelleri de olduğundan kesin otel teyidi gerekli. |
| TIR PARKI | Sahibinin Koruk Kafe / Tır Parkı bağlantısı ve açıklaması kayıtlı. Bağlantının sayfası koordinat vermedi; açık koordinat veya uzun pin bağlantısı gerekli. |
| VİYAPARK | Bu kısa etiket için güvenilir, eşleşen nokta bulunamadı. |
| K BATI | Kısaltmanın hangi işletme/bölgeyi gösterdiği belirsiz. |
| ANIT | Zafer Anıtı, Anıt Parkı ve başka anıtlar var; hangisinin kullanıldığı teyit edilmeli. |
| ARKIN OTEL | The Arkin Iskele ile Arkin Palm Beach ayrı oteller; kesin otel pinini belirtin. |
| BEACH CLUB 2 | Vito fiyatı olabilir; kullanıcı henüz kesin teyit vermedi. İlgili ana işletmeyle aynı fiziksel nokta olduğu teyit edilmeli. |
| CITYMALL 2 | Vito fiyatı olabilir; kullanıcı henüz kesin teyit vermedi. İlgili ana işletmeyle aynı fiziksel nokta olduğu teyit edilmeli. |
| LIONS 2 | Vito fiyatı olabilir; kullanıcı henüz kesin teyit vermedi. İlgili ana işletmeyle aynı fiziksel nokta olduğu teyit edilmeli. |
| LOOF BEACH 2 | Vito fiyatı olabilir; kullanıcı henüz kesin teyit vermedi. İlgili ana işletmeyle aynı fiziksel nokta olduğu teyit edilmeli. |
| POP ART GECE | Gece tarifesi etiketi; POP ART ile aynı fiziksel nokta olduğu teyit edilirse ayrı etiket korunarak pin atanabilir. |
| MERKEZ | Tek bir şehir merkezi/buluşma noktası belirtilmedi. |
| GRAND ARAS DURAK | Grand Aras Dormitory binası bulundu (35.140695, 33.9058728); durak/buluşma noktası bina merkeziyle aynı kabul edilmedi. |
| GRANDSAPPIRE | Grand Sapphire Resort & Casino adayı bulundu; GRANDSAPHIRE ile aynı yer olduğu henüz teyit edilmedi. |
| MERİT+ARKIN | Birden fazla yeri kapsayan tarife grubu; tek bir GPS başlangıcı belirlemek için kullanılan noktayı belirtin. |
| MERKEZ+KALİLAND | Birden fazla bölgeyi kapsayan tarife grubu; tek bir GPS başlangıcı belirlemek için kullanılan noktayı belirtin. |

Araştırılmış fakat kullanılmamış adaylar: [Grand Aras Dormitory](https://www.waze.com/live-map/directions/gazimagusa/grand-aras-dormitory?to=place.ChIJ12ktqr_J3xQRodWF23WwJmQ), [Grand Sapphire Resort & Casino](https://www.openstreetmap.org/way/1164908262), [Merit Cyprus Gardens](https://www.openstreetmap.org/node/4328123190), [Arkin Palm Beach](https://www.openstreetmap.org/way/641322494), [The Arkin Iskele](https://www.meinreisebuero24.com/hotel/the-arkin-iskele-yeni-iskele-trikomo), [Kent Plus projesi](https://www.hangiev.com/kentplus). Aday bulunması kaynak etiketiyle aynı yer olduğunun teyidi sayılmadı.

## Kayıtlı koordinatlar ve kaynaklar

| Konum | Enlem, boylam | Tür | Kaynakta görünen ad / bağlantı |
| --- | --- | --- | --- |
| POP ART | 35.1393257, 33.9069061 | Nokta | [Pop Art Dormitory](https://www.openstreetmap.org/way/719295353) |
| CITYMALL | 35.125871, 33.920825 | Nokta | [City Mall AVM](https://mapcarta.com/W437715123) |
| COURTYARD | 35.257007, 33.898254 | Nokta | [Courtyard](https://mapcarta.com/W1122452084) |
| EZİÇ VOLA | 35.2201962, 33.9035225 | Nokta | [Eziç Yeniboğaziçi](https://www.openstreetmap.org/way/1319462815) |
| GÜVERCİNLİK | 35.100633, 33.861417 | Bölge referansı | [Acheritou](https://mapcarta.com/12639362) |
| İTÜ | 35.119348, 33.942301 | Nokta | [İTÜ Kuzey Kıbrıs](https://mapcarta.com/N11347162046) |
| İLARMA | 35.1152952, 33.9301882 | Nokta | [İlarma Market](https://www.openstreetmap.org/way/347155394) |
| KALE İÇİ | 35.125, 33.94167 | Bölge referansı | [Famagusta Walled City](https://mapcarta.com/13174630) |
| KUNTER | 35.1168594, 33.9359325 | Nokta | [Kunter Güven Hastanesi](https://www.openstreetmap.org/node/8205795217) |
| KYBLE ÖNÜ | 35.1593598, 33.90279 | Nokta | [Uygulama sahibinin paylaştığı nokta](https://maps.app.goo.gl/zBgps6Q9JkpBmmKM7) |
| LIONS | 35.1637211, 33.901177 | Nokta | [Lion's Garden](https://www.openstreetmap.org/way/697635146) |
| LOOF BEACH | 35.161464, 33.913083 | Nokta | [Loof Beach](https://yandex.com/maps/org/loof_beach/63660619854/) |
| MORMENEKŞE | 35.20184, 33.859695 | Bölge referansı | [Limnia](https://mapcarta.com/N1097029713) |
| MUTLUYAKA | 35.172422, 33.834864 | Bölge referansı | [Stylloi](https://mapcarta.com/12637784) |
| ÖNDER | 35.130493, 33.9301107 | Nokta | [Önder Alışveriş Merkezi](https://www.openstreetmap.org/way/334156232) |
| PERA | 35.2487169, 33.9029728 | Nokta | [Pera Mackenzie](https://www.openstreetmap.org/way/1488499480) |
| PERŞEMBE PAZ | 35.121126, 33.932413 | Nokta | [Belediye Perşembe Pazarı](https://mapcarta.com/W339338407) |
| SALAMİS OTEL | 35.205815, 33.89911 | Nokta | [Salamis Bay Conti Resort Hotel & Casino](https://mapcarta.com/N4233844289) |
| SEMA OTEL | 35.124228, 33.928364 | Nokta | [Euro Tombala Gazimağusa](https://mapcarta.com/N12706557218) |
| SİLVER | 35.171497, 33.9090805 | Nokta | [Silver Beach](https://www.openstreetmap.org/way/606238632) |
| TUZLA | 35.161103, 33.883089 | Bölge referansı | [Enkomi](https://mapcarta.com/12638954) |
| VERGİ DAİRESİ | 35.121851, 33.949018 | Nokta | [Gelir Ve Vergi Dairesi Gazimağusa](https://www.waze.com/live-map/directions/famagusta/gelir-ve-vergi-dairesi-gazimagusa?to=place.ChIJIVznRDzI3xQRTvdXtdZA2RQ) |
| YENİBOĞAZİÇİ | 35.196197, 33.878042 | Bölge referansı | [Agios Sergios](https://mapcarta.com/12639084) |
| ZAGATO | 35.12059, 33.956 | Nokta | [Zagato · Palm Beach, Famagusta](https://cyprus.worldplaces.me/el/review/85033081-zagato.html) |
| BAFRA | 35.379518, 34.071254 | Bölge referansı | [Vokolida](https://mapcarta.com/12637656) |
| BEACH CLUB | 35.166949, 33.9102003 | Nokta | [Beach Club](https://www.openstreetmap.org/way/606238633) |
| BEDİS | 35.1875062, 33.903938 | Nokta | [Bedis Beach Pavillion](https://www.waze.com/live-map/directions/yeni-bogazici/bedis-beach-pavillion?to=place.ChIJiVnzJ9m33xQRrxHeGYNmSlA) |
| BOGAZ | 35.315032, 33.950562 | Bölge referansı | [Bogazi / Boğaz, İskele](https://mapcarta.com/12639032) |
| CESAR BLUE | 35.328534, 33.97338 | Nokta | [Caesar Blue](https://mapcarta.com/N11004063605) |
| CESAR RESORT | 35.262796, 33.901884 | Nokta | [Caesar Resort](https://mapcarta.com/W355443885) |
| PRIME | 35.1509203, 33.9051441 | Nokta | [Prime Living Lüks Öğrenci Yurdu](https://www.waze.com/live-map/directions/gazimagusa/prime-living-luks-ogrenci-yurdu?to=place.ChIJO-oPVR623xQROL2yagsepsQ) |
| ÇEMBER | 35.129723, 33.9285231 | Nokta | [Uygulama sahibinin paylaştığı nokta](https://maps.app.goo.gl/BBANfNPw5dFMXEzN8) |
| TEKANT | 35.1431035, 33.9148607 | Nokta | [Tekant Market](https://www.openstreetmap.org/node/5595409237) |
| ERCAN | 35.147718, 33.503031 | Nokta | [Ercan · Yeni terminal giden yolcu (Departure Passenger)](https://mapcarta.com/N11072498478) |
| PALM BEACH | 35.118152, 33.95836 | Bölge referansı | [Palm beach](https://mapcarta.com/W396559851) |
| MAĞOSA | 35.120526, 33.938792 | Bölge referansı | [Famagusta](https://mapcarta.com/Famagusta) |
| ALSANCAK | 35.339408, 33.196075 | Bölge referansı | [Karavas](https://mapcarta.com/12638768) |
| GİRNE | 35.339629, 33.320529 | Bölge referansı | [Kyrenia](https://mapcarta.com/Kyrenia) |
| GÖNYELİ | 35.216417, 33.305817 | Bölge referansı | [Gönyeli](https://mapcarta.com/12638878) |
| HASPOLAT | 35.206372, 33.42002 | Bölge referansı | [Haspolat](https://mapcarta.com/12638280) |
| LEFKOŞA | 35.211704, 33.321149 | Bölge referansı | [Nicosia](https://mapcarta.com/Nicosia_%28North%29) |
| NUROL ARKASI | 35.1398173, 33.9082698 | Nokta | [Uygulama sahibinin paylaştığı nokta](https://maps.app.goo.gl/iYDrUtG9YZUa5pDo8) |
| TAKSİ DURAĞI | 35.1311375, 33.9254844 | Nokta | [Göçmen Taksi · 8G7M4WJG+F55, Çilem Market yanı](https://www.cybo.com/CY/famagusta/taxis/) |

## Konumumu Bul davranışı

- Telefon konumu, kayıtlı yerlerin koordinatları eksik olsa bile alınabilir. HTTPS, telefonun Konum Servisleri ve siteye konum izni gerekir; izin tarayıcı tarafından yönetilir.
- Yeni ölçüm yüksek doğrulukla istenir (`enableHighAccuracy: true`, `maximumAge: 0`, 15 saniye). Tarayıcı geri dönüş yapmazsa ek sonlandırma süresi arayüzü serbest bırakır. Geç gelen cevap önceki başarısız isteği değiştirmez. Yeniden deneme mümkündür.
- Aynı anda tek Konumumu Bul isteği çalışır; Ana Sayfa, Ayarlar ve koordinat formundaki GPS düğmeleri birlikte kilitlenir ve her sonuçta tekrar açılır.
- En fazla 750 metre uzaktaki, doğruluğu ±150 metre veya daha iyi ölçülmüş işletme/durak başlangıcı önerilebilir. İki başlangıç ölçüm belirsizliğinde çakışıyorsa öneri yapılmaz. Kullanıcı öneriye dokunmadan başlangıç, seçili rota ve fiyat değiştirilmez.
- İzin reddi, konum belirlenememesi, zaman aşımı ve düşük hassasiyet ayrı mesajlar verir. Elle tarife seçimi kullanılabilir kalır. Düşük doğrulukta veya yakında uygun başlangıç yokken ücret türetilmez.
- GPS cihaz konumu ve doğruluk Ayarlar’da gösterilir; GPS izi/geçmişi kaydedilmez. “Bu noktadayım · GPS kullan” yalnızca formu doldurur. Doğruluk ±100 metreden kötüyse koordinat doldurmaz; kullanıcı Kaydet’e basmadan yerel konum değişmez.
- Yerel koordinatlar `coordinateOverrides` içinde tutulur. Değişiklik dışa aktarma ve tam yedek dahil JSON ile taşınabilir. Eski sürüm yedekleri de kabul edilir. Her konumun yerel değişikliği tek düğmeyle varsayılana döner.

## Veri atıfları

OpenStreetMap kaynaklı koordinatlar © OpenStreetMap katkıcıları, [ODbL](https://www.openstreetmap.org/copyright). İlgili açık veri bağlantıları yukarıda verilmiştir. Mapcarta sayfaları kendi OSM/GeoNames kaynaklarını belirtir; OSM ve GeoNames tabanlı referanslar bu sayfalardan alınmıştır. GeoNames verisi [CC BY](https://www.geonames.org/about.html) kapsamında kaynak sayfalarıyla atfedilmiştir. Diğer işletme kayıtları Waze, Yandex ve WorldPlaces sayfalarının açık nokta bilgileriyle kaynaklandırılmıştır. Sayfa fotoğrafları, metinleri veya harita karoları uygulamaya alınmadı.
