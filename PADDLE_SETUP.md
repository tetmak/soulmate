# Numerael Premium — Paddle Kurulum Rehberi

## 1. Paddle Hesabı
1. https://vendors.paddle.com adresinde hesap oluştur
2. Şirket/bireysel bilgilerini doldur
3. Onay sürecini tamamla

> Paddle "Merchant of Record" olarak çalışır — vergi, KDV ve fatura işlemlerini otomatik halleder.

## 2. Ürün Oluştur
1. Paddle Dashboard → **Catalog** → **Products** → **+ New Product**
2. Ürün adı: **Numerael Premium**
3. Açıklama: Sınırsız AI analiz, Cosmic Match, tam numeroloji

## 3. Fiyatlar Oluştur
Ürünü oluşturduktan sonra **Prices** sekmesinden 2 fiyat ekle:

| Fiyat Adı | Tutar | Periyot | Para Birimi |
|---|---|---|---|
| Numerael Premium Aylık | ₺79.99 | Aylık (monthly) | TRY |
| Numerael Premium Yıllık | ₺599.99 | Yıllık (yearly) | TRY |

Her fiyatın **Price ID**'sini kopyala (`pri_` ile başlar).

## 4. Client-Side Token Al
1. Paddle Dashboard → **Developer Tools** → **Authentication**
2. **Client-side token** kopyala (`test_` veya `live_` ile başlar)

## 5. Koda Ekle
`js/premium.js` dosyasını aç, üstteki yapılandırma bölümünü doldur:

```javascript
var PADDLE_CLIENT_TOKEN = 'test_SENIN_TOKEN';         // Client-side token
var PADDLE_PRICE_MONTHLY = 'pri_AYLIK_FIYAT_ID';      // Aylık fiyat ID
var PADDLE_PRICE_YEARLY = 'pri_YILLIK_FIYAT_ID';      // Yıllık fiyat ID
var PADDLE_ENV = 'sandbox';                             // Test: 'sandbox', Canlı: 'production'
```

## 6. Webhook Kurulumu

Webhook, abonelik olaylarını (yenileme, iptal, süre bitimi) otomatik olarak
Supabase veritabanına yazar.

### 6a. Vercel Environment Variables
Vercel Dashboard → Settings → Environment Variables → ekle:

| Variable | Değer | Açıklama |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase Dashboard → Settings → API → service_role key |
| `PADDLE_WEBHOOK_SECRET` | `pdl_ntfset_...` | Paddle Dashboard'dan al (aşağıda) |

### 6b. Paddle Dashboard'da Webhook Ekle
1. Paddle Dashboard → **Developer Tools** → **Notifications** → **+ New destination**
2. Ayarlar:
   - **Type:** Webhook
   - **URL:** `https://soulmate-kohl.vercel.app/api/paddle-webhook`
   - **Events:** Aşağıdakileri seç:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `subscription.past_due`
     - `subscription.activated`
     - `transaction.completed`
3. Kaydet → **Webhook Secret** kopyala → Vercel'e `PADDLE_WEBHOOK_SECRET` olarak ekle

### 6c. Webhook Olayları
Webhook otomatik olarak şu olayları işler:
- `subscription.created` → Yeni abonelik oluşturur
- `subscription.updated` → Aboneliği günceller (yenileme, plan değişikliği)
- `subscription.canceled` → İptal (süre sonuna kadar aktif kalır)
- `subscription.past_due` → Ödeme sorunu
- `transaction.completed` → Ödeme başarılı

## 7. Test
1. `PADDLE_ENV = 'sandbox'` olduğundan emin ol
2. Uygulamayı aç → Premium sayfasına git
3. Konsolu aç, kontrol et: `[Premium] Paddle başlatıldı (sandbox)`
4. "Premium'a Geç" butonuna bas
5. Paddle checkout overlay açılacak
6. Sandbox test kartı: `4242 4242 4242 4242`, tarih: gelecek tarih, CVV: 3 hane
7. Ödeme sonrası sayfa otomatik yenilenir, premium aktif olur

## 8. Canlıya Alma
1. Paddle Dashboard'da sandbox → live geçiş yap
2. `js/premium.js`'te:
   ```javascript
   var PADDLE_CLIENT_TOKEN = 'live_CANLI_TOKEN';
   var PADDLE_ENV = 'production';
   ```
3. Fiyat ID'leri aynı kalır (sandbox ve production aynı catalog)
4. Webhook URL'i aynı kalır, secret'ı production'a göre güncelle

## Dev Tools (Konsol)
```javascript
premium.simulate(30)  // 30 günlük premium simüle et (sadece test)
premium.clear()       // Premium'u temizle
premium.isReady()     // Paddle SDK durumu
premium.isPremium()   // Premium durumu
```

## Mimari

```
Kullanıcı → Paywall/Store → premium.startPurchase(plan)
                               ↓
                    Paddle.Checkout.open() → Overlay Checkout
                               ↓
                    checkout.completed event → localStorage + Supabase
                               ↓
                    Paddle Webhook → /api/paddle-webhook
                               ↓
                    Supabase subscriptions tablosu güncelle
                    (yenileme, iptal, süre bitimi otomatik)
```

## Premium Durum Kontrolü (2 Katmanlı)
1. **localStorage** — Hızlı cache (checkout.completed event'inde yazılır)
2. **Supabase** — Server-side yedek (webhook ile güncel tutuluyor)

## Paddle Avantajları
- Merchant of Record: KDV/vergi otomatik hesaplanır ve fatura kesilir
- Stripe hesabı gerekmez
- Overlay checkout: Kullanıcı uygulamadan ayrılmaz
- Otomatik para birimi dönüşümü
- Fraud protection dahil
