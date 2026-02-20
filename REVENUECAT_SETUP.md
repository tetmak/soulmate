# Kader Premium — RevenueCat Kurulum Rehberi

## 1. Hesaplar

### RevenueCat
1. https://app.revenuecat.com adresinde hesap oluştur
2. Yeni proje: "Kader" adıyla oluştur

### Stripe
1. https://dashboard.stripe.com adresinde hesap oluştur
2. Stripe API key'lerini al (publishable + secret)

## 2. RevenueCat'te Stripe Bağlantısı
1. RevenueCat Dashboard → Project Settings → Billing
2. "Connect Stripe" → Stripe hesabını bağla

## 3. Web Billing Platform Ekle
1. RevenueCat Dashboard → Project Settings → Apps
2. "+ New" → "Web" seç
3. Ayarları doldur:
   - **App Name:** Kader
   - **Default Currency:** TRY
   - **Support Email:** senin@email.com
4. Kaydet → **Web Billing Public API Key** kopyala (`rcb_` ile başlar)

## 4. Ürünler Oluştur
1. RevenueCat Dashboard → Products
2. İki ürün oluştur:

   | Identifier | Fiyat | Süre |
   |---|---|---|
   | `kader_premium_monthly` | ₺79.99 | 1 ay |
   | `kader_premium_yearly` | ₺599.99 | 1 yıl |

## 5. Entitlement Oluştur
1. RevenueCat Dashboard → Entitlements
2. "+ New" → Identifier: `premium`
3. Her iki ürünü bu entitlement'a bağla

## 6. Offering Oluştur
1. RevenueCat Dashboard → Offerings
2. "default" offering'i düzenle (veya yeni oluştur)
3. İki paket ekle:
   - **Monthly:** `kader_premium_monthly` ürünü
   - **Annual:** `kader_premium_yearly` ürünü

## 7. API Key'i Koda Ekle
`js/premium.js` dosyasını aç, 48. satırdaki değeri değiştir:

```javascript
var RC_API_KEY = 'rcb_SENIN_API_KEYIN_BURAYA';
```

## 8. Test
1. Uygulamayı aç → Premium sayfasına git
2. Konsolu aç, kontrol et: `[Premium] RevenueCat hazır. Premium: false`
3. "Premium'a Geç" butonuna bas
4. Stripe test kartı kullan: `4242 4242 4242 4242`
5. Ödeme sonrası: `[Premium] RevenueCat hazır. Premium: true`

## 9. Canlıya Alma
- Stripe'ta canlı moduna geç (test → live)
- RevenueCat'te Sandbox API key yerine Production API key kullan
- `premium.js`'teki API key'i production key ile değiştir

## Dev Tools (Konsol)
```javascript
premium.simulate(30)  // 30 günlük premium simüle et
premium.clear()       // Premium'u temizle
premium.isReady()     // RC SDK durumu
premium.isPremium()   // Premium durumu
```

## Supabase Tabloları
`supabase_cosmic_match_migration.sql` dosyasını Supabase SQL Editor'de çalıştır.
Bu dosya `subscriptions` tablosunu da içerir (fallback olarak).

## Notlar
- RevenueCat SDK ödeme formunu otomatik render eder (Stripe Elements)
- Apple Pay ve Google Pay desteği Stripe Dashboard'dan aktif edilir
- SDK client-side çalışır, API key güvenlidir (public key)
- Müşteri portalı RevenueCat tarafından otomatik sağlanır
