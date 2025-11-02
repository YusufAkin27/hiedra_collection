import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { products } from '../data/products'
import { useCart } from '../context/CartContext'
import LazyImage from './LazyImage'
import SEO from './SEO'
import './ProductDetail.css'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const intervalRef = useRef(null)
  const isPausedRef = useRef(false)
  
  // Fiyatlandırma formu state'leri
  const [en, setEn] = useState('')
  const [boy, setBoy] = useState('')
  const [pileSikligi, setPileSikligi] = useState('pilesiz')
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const pileOptions = [
    { value: 'pilesiz', label: 'Pilesiz' },
    { value: '1x2', label: '1x2'  },
    { value: '1x3', label: '1x3' }
  ]

  const product = products.find(p => p.id === parseInt(id))

  // Tüm görselleri birleştir (ana görsel + detay görselleri) - Memoize edilmiş
  const allImages = useMemo(() => {
    if (!product) return []
    return product.detailImages 
      ? [product.image, ...product.detailImages]
      : [product.image]
  }, [product])

  // Otomatik fotoğraf geçişi
  useEffect(() => {
    // Ürün yoksa veya görsel yoksa çalıştırma
    if (!product || !allImages || allImages.length <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Önceki timer'ı temizle
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Otomatik geçiş timer'ı başlat
    const imagesCount = allImages.length
    
    const startAutoSlide = () => {
      intervalRef.current = setInterval(() => {
        setSelectedImage((prevIndex) => {
          return (prevIndex + 1) % imagesCount
        })
      }, 5000) // 5 saniye
    }

    // Pause durumunu kontrol et, değilse başlat
    if (!isPausedRef.current) {
      startAutoSlide()
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [product, allImages])

  // Manuel thumbnail seçildiğinde timer'ı resetle
  const handleThumbnailClick = (index) => {
    setSelectedImage(index)
    
    // Timer'ı temizle
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Hemen yeniden başlat (yeni seçilen görselden itibaren 5 saniye sayar)
    if (allImages.length > 1) {
      setTimeout(() => {
        if (!isPausedRef.current) {
          intervalRef.current = setInterval(() => {
            setSelectedImage((prevIndex) => {
              return (prevIndex + 1) % allImages.length
            })
          }, 5000)
        }
      }, 100)
    }
  }

  // Mouse hover'da duraklat
  const handleImageHover = () => {
    isPausedRef.current = true
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Mouse leave'de devam et
  const handleImageLeave = () => {
    isPausedRef.current = false
    if (allImages.length > 1 && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setSelectedImage((prevIndex) => {
          const nextIndex = (prevIndex + 1) % allImages.length
          return nextIndex
        })
      }, 5000)
    }
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Ürün bulunamadı</h2>
        <Link to="/">Ana Sayfaya Dön</Link>
      </div>
    )
  }

  // Fiyat hesaplama
  const calculatePrice = (enValue, boyValue, pileValue) => {
    if (!enValue || !boyValue || !pileValue) {
      setCalculatedPrice(0)
      return
    }
    
    const enNum = parseFloat(enValue)
    const boyNum = parseFloat(boyValue)
    
    if (isNaN(enNum) || isNaN(boyNum) || enNum <= 0 || boyNum <= 0) {
      setCalculatedPrice(0)
      return
    }
    
    // Pile sıklığı çarpanı
    const pileMultiplier = {
      'pilesiz': 1,
      '1x2': 2,
      '1x3': 3
    }[pileValue] || 1
    
    // Metre fiyatı * en (metre cinsinden) * pile çarpanı
    // En değeri cm cinsinden olduğu için 100'e bölüyoruz
    const enMetre = enNum / 100
    const calculated = product.price * enMetre * pileMultiplier
    
    setCalculatedPrice(Math.round(calculated * 100) / 100) // 2 ondalık basamak
  }
  
  // Form değişikliklerinde fiyatı hesapla
  useEffect(() => {
    if (product) {
      calculatePrice(en, boy, pileSikligi)
    }
  }, [en, boy, pileSikligi, product])
  
  const handleAddToCart = (e) => {
    e.preventDefault()
    
    // Validasyon
    if (!en || !boy) {
      alert('Lütfen en ve boy değerlerini giriniz.')
      return
    }
    
    const enNum = parseFloat(en)
    const boyNum = parseFloat(boy)
    
    if (isNaN(enNum) || isNaN(boyNum)) {
      alert('Lütfen geçerli sayısal değerler giriniz.')
      return
    }
    
    if (enNum <= 0 || enNum > 30000) {
      alert('En değeri 0 ile 30000 cm arasında olmalıdır.')
      return
    }
    
    if (boyNum <= 0 || boyNum > 500) {
      alert('Boy değeri 0 ile 500 cm arasında olmalıdır.')
      return
    }
    
    // Sepete ekle
    for (let i = 0; i < quantity; i++) {
      addToCart(product, {
        en: enNum,
        boy: boyNum,
        pileSikligi,
        calculatedPrice,
        quantity: 1
      })
    }
    
    navigate('/cart')
  }

  // Structured Data for Product
  const structuredData = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.name} - Perde Satış`,
    description: `${product.description} Perde satış için Hiedra'yı ziyaret edin. Kaliteli kumaş, uygun fiyat, hızlı teslimat.`,
    image: allImages.map(img => img.startsWith('http') ? img : `${typeof window !== 'undefined' ? window.location.origin : 'https://hiedra.com'}${img}`),
    sku: `PROD-${product.id}`,
    mpn: `HIEDRA-${product.id}`,
    category: `${product.category} Perde`,
    brand: {
      '@type': 'Brand',
      name: 'Hiedra Perde'
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Hiedra Perde'
    },
    offers: {
      '@type': 'Offer',
      url: typeof window !== 'undefined' ? window.location.href : `https://hiedra.com/product/${product.id}`,
      priceCurrency: 'TRY',
      price: product.price.toString(),
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Hiedra Perde'
      },
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceCurrency: 'TRY',
        price: product.price.toString(),
        unitCode: 'MTR',
        unitText: 'metre'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1'
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5'
        },
        author: {
          '@type': 'Person',
          name: 'Müşteri'
        },
        reviewBody: `${product.name} ürünü kaliteli ve hızlı teslimat ile memnun kaldık.`
      }
    ]
  } : null

  return (
    <div className="product-detail-container">
      {product && (
        <SEO
          title={`${product.name} - ${product.category} Perde Satış | Fiyat: ${product.price} ₺`}
          description={`${product.description} ${product.category} perde satış için en uygun fiyat: ${product.price} ₺. Kaliteli kumaş, hızlı teslimat. Perde satın al.`}
          keywords={`${product.name}, ${product.category} perde satış, ${product.category.toLowerCase()} perde, perde satış, online perde satış, ${product.price} TL perde, kaliteli perde`}
          image={product.image}
          url={`/product/${product.id}`}
          type="product"
          structuredData={structuredData}
        />
      )}
      <div className="product-detail-wrapper">
        {/* Üst Badge - Kategori */}
        <div className="product-detail-badge-container">
          <span className="product-detail-badge category-badge-top">
            {product.category}
          </span>
          {product.inStock && (
            <span className="product-detail-badge stock-badge-top">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Stokta
            </span>
          )}
        </div>

        <div className="product-detail-content">
          <section className="product-detail-images">
            {/* Sol üstte - Detay thumbnailleri */}
            {allImages.length > 1 && (
              <div className="product-side-thumbnails-inside">
                {allImages.slice(0, 3).map((img, index) => (
                  <button
                    key={index}
                    className={`side-thumbnail-inside ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => handleThumbnailClick(index)}
                    onMouseEnter={() => setSelectedImage(index)}
                  >
                    <LazyImage 
                      src={img} 
                      alt={`${product.name} - ${product.category} perde detay görüntüsü ${index + 1}`}
                      className="thumbnail-image"
                    />
                  </button>
                ))}
              </div>
            )}

            <div 
              className="main-image-container"
              onMouseEnter={handleImageHover}
              onMouseLeave={handleImageLeave}
            >
              <LazyImage 
                src={allImages[selectedImage]} 
                alt={`${product.name} - ${product.category} perde modeli. ${product.description.substring(0, 120)}`}
                className="main-image"
              />
              <div className="image-gradient-overlay"></div>
              <div className="image-count-indicator">
                {selectedImage + 1} / {allImages.length}
              </div>
              
              {allImages.length > 1 && (
                <div className="auto-slide-indicator">
                  <div className="slide-progress-bar">
                    <div 
                      className="slide-progress-fill"
                      key={selectedImage}
                    ></div>
                  </div>
                </div>
              )}

              {/* Sağ altta detay fotoğrafı butonu */}
              {allImages.length > 3 && (
                <button 
                  className="detail-photo-btn-inside"
                  onClick={() => setSelectedImage(allImages.length > 3 ? 3 : allImages.length - 1)}
                  title="Detay fotoğrafı görüntüle"
                >
                  <LazyImage 
                    src={allImages[allImages.length > 3 ? 3 : allImages.length - 1]} 
                    alt="Detay görüntüle"
                    className="detail-thumbnail"
                  />
                  <div className="detail-btn-overlay">
                    <svg className="zoom-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <span>Detay Gör</span>
                  </div>
                </button>
              )}
            </div>
          </section>

          <article className="product-detail-info">
            <div className="product-header-info">
              <span className="product-category">{product.category}</span>
              <h1 className="product-name">{product.name}</h1>
              {product.productCode && (
                <span className="product-code">Ürün Kodu: <strong>{product.productCode}</strong></span>
              )}
            </div>
            
            <p className="product-description">{product.description}</p>
            
            {/* Ürün Özellikleri */}
            <div className="product-features">
              <div className="feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Kaliteli Kumaş</span>
              </div>
              <div className="feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Hızlı Teslimat</span>
              </div>
              <div className="feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Uygun Fiyat</span>
              </div>
            </div>
            
            <div className="detail-price-section">
              <div className="price-info">
                <span className="price-label">Metre Fiyatı:</span>
                <span className="detail-price">{product.price} ₺</span>
              </div>
              {product.inStock && (
                <span className="detail-stock">Stokta</span>
              )}
            </div>

          {/* Fiyatlandırma Formu */}
          <form className="pricing-form" onSubmit={handleAddToCart}>
            <div className="form-section">
              <h2 className="form-title">Özel Fiyatlandırma</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="en">
                    En (cm) <span className="required">*</span>
                    <span className="form-hint">Max: 30000 cm</span>
                  </label>
                  <input
                    type="number"
                    id="en"
                    value={en}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 30000)) {
                        setEn(value)
                      }
                    }}
                    min="0"
                    max="30000"
                    step="0.1"
                    placeholder="Örn: 200"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="boy">
                    Boy (cm) <span className="required">*</span>
                    <span className="form-hint">Max: 500 cm</span>
                  </label>
                  <input
                    type="number"
                    id="boy"
                    value={boy}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 500)) {
                        setBoy(value)
                      }
                    }}
                    min="0"
                    max="500"
                    step="0.1"
                    placeholder="Örn: 250"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="pileSikligi">
                  Pile Sıklığı <span className="required">*</span>
                </label>
                <div className="custom-dropdown">
                  <button
                    type="button"
                    className="dropdown-trigger"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  >
                    <span className="dropdown-selected">
                      {pileOptions.find(opt => opt.value === pileSikligi)?.label}
                    </span>
                    <svg 
                      className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="dropdown-menu">
                      {pileOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`dropdown-option ${pileSikligi === option.value ? 'selected' : ''}`}
                          onClick={() => {
                            setPileSikligi(option.value)
                            setIsDropdownOpen(false)
                          }}
                        >
                          <span className="option-label">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="form-info">
                  Pile sıklığı fiyatlandırmayı etkiler: Pilesiz (x1), 1x2 (x2), 1x3 (x3)
                </p>
              </div>
              
              {calculatedPrice > 0 && (
                <div className="calculated-price-section">
                  <div className="price-breakdown">
                    <div className="breakdown-item">
                      <span>Metre Fiyatı:</span>
                      <span>{product.price} ₺</span>
                    </div>
                    <div className="breakdown-item">
                      <span>En:</span>
                      <span>{en} cm ({parseFloat(en) / 100} m)</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Pile Çarpanı:</span>
                      <span>{pileSikligi === 'pilesiz' ? '1x' : pileSikligi}</span>
                    </div>
                    <div className="breakdown-item total">
                      <span>Toplam Fiyat:</span>
                      <span className="total-price">{calculatedPrice.toFixed(2)} ₺</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="quantity-section">
              <label>Adet:</label>
              <div className="quantity-controls">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <button type="submit" className="add-to-cart-btn" disabled={!en || !boy || calculatedPrice === 0}>
              Sepete Ekle
            </button>
          </form>
        </article>
      </div>
      </div>

      {/* Benzer Ürünler - Ana kartın dışında, daha görünür */}
      <section className="related-products-section">
        <div className="related-products-header">
          <h2>Benzer Ürünler</h2>
          <p className="related-products-subtitle">Size uygun diğer perde modellerini keşfedin</p>
        </div>
        <div className="related-products-grid">
          {products
            .filter(p => p.id !== product.id && p.category === product.category)
            .slice(0, 3)
            .map(relatedProduct => (
              <Link 
                key={relatedProduct.id} 
                to={`/product/${relatedProduct.id}`}
                className="related-product-card"
              >
                <div className="related-product-image-wrapper">
                  <LazyImage 
                    src={relatedProduct.image}
                    alt={`${relatedProduct.name} - ${relatedProduct.category} perde satış`}
                    className="related-product-image"
                  />
                  <div className="related-product-overlay">
                    <span className="related-product-category">{relatedProduct.category}</span>
                    <span className="related-product-view">Görüntüle →</span>
                  </div>
                </div>
                <div className="related-product-info">
                  <h3>{relatedProduct.name}</h3>
                  <p className="related-product-description">{relatedProduct.description.substring(0, 60)}...</p>
                  <div className="related-product-footer">
                    <span className="related-product-price">{relatedProduct.price} ₺</span>
                    {relatedProduct.inStock && (
                      <span className="related-product-stock">Stokta</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          {products
            .filter(p => p.id !== product.id && p.category !== product.category)
            .slice(0, 3 - products.filter(p => p.id !== product.id && p.category === product.category).length)
            .map(relatedProduct => (
              <Link 
                key={relatedProduct.id} 
                to={`/product/${relatedProduct.id}`}
                className="related-product-card"
              >
                <div className="related-product-image-wrapper">
                  <LazyImage 
                    src={relatedProduct.image}
                    alt={`${relatedProduct.name} - ${relatedProduct.category} perde satış`}
                    className="related-product-image"
                  />
                  <div className="related-product-overlay">
                    <span className="related-product-category">{relatedProduct.category}</span>
                    <span className="related-product-view">Görüntüle →</span>
                  </div>
                </div>
                <div className="related-product-info">
                  <h3>{relatedProduct.name}</h3>
                  <p className="related-product-description">{relatedProduct.description.substring(0, 60)}...</p>
                  <div className="related-product-footer">
                    <span className="related-product-price">{relatedProduct.price} ₺</span>
                    {relatedProduct.inStock && (
                      <span className="related-product-stock">Stokta</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
        </div>

        {/* Kategori Linkleri */}
        <div className="category-links-section">
          <h3>Diğer Kategoriler</h3>
          <div className="category-links">
            <Link to="/" className="category-link">
              <span>Tüm Ürünler</span>
              <span className="category-count">({products.length} ürün)</span>
            </Link>
            {['Klasik', 'Stor', 'Zebra', 'Jaluzi'].map(category => {
              const categoryProducts = products.filter(p => p.category === category)
              return (
                <Link 
                  key={category}
                  to={`/?category=${category.toLowerCase()}`}
                  className="category-link"
                >
                  <span>{category} Perde</span>
                  <span className="category-count">({categoryProducts.length} ürün)</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductDetail

