import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { products } from '../data/products'
import ProductCard from './ProductCard'
import SEO from './SEO'
import './ProductList.css'

const ProductList = () => {
  const [expandedCollections, setExpandedCollections] = useState({})
  const location = useLocation()
  
  // URL'den arama terimini al
  const searchParams = new URLSearchParams(location.search)
  const searchTerm = searchParams.get('search') || ''
  
  // Koleksiyonları ve alt kategorilerini grupla
  const collections = useMemo(() => {
    const collectionMap = {}
    
    products.forEach(product => {
      const collectionName = product.category
      if (!collectionMap[collectionName]) {
        collectionMap[collectionName] = []
      }
      collectionMap[collectionName].push(product)
    })
    
    // Koleksiyonları alfabetik sırala ve her koleksiyonun ürünlerini sırala
    return Object.keys(collectionMap)
      .sort()
      .map(collectionName => ({
        name: collectionName,
        products: collectionMap[collectionName].sort((a, b) => a.name.localeCompare(b.name))
      }))
  }, [])

  // Arama sonuçlarını filtrele
  const filteredProducts = searchTerm
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products

  // Koleksiyonları aç/kapa
  const toggleCollection = (collectionName) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionName]: !prev[collectionName]
    }))
  }

  // İlk render'da tüm koleksiyonları aç
  useEffect(() => {
    const initialExpanded = {}
    collections.forEach(collection => {
      initialExpanded[collection.name] = true
    })
    setExpandedCollections(initialExpanded)
  }, [collections])

  // Arama modunda tüm ürünleri göster
  if (searchTerm) {
    return (
      <div className="product-list-container">
      <SEO
        title={`"${searchTerm}" Arama Sonuçları`}
        description={`"${searchTerm}" için ${filteredProducts.length} ürün bulundu`}
        url={`/?search=${encodeURIComponent(searchTerm)}`}
      />
      <header className="product-list-header">
        <h1>Koleksiyonlar</h1>
        <p>Modern ve şık perde seçenekleri</p>
        <div className="search-results-info">
          <span>"{searchTerm}" için {filteredProducts.length} sonuç bulundu</span>
        </div>
      </header>

        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>Üzgünüz, aradığınız kriterlere uygun ürün bulunamadı.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Perde Satış - Online Perde Satın Al',
    description: 'Türkiye\'nin en kaliteli perde satış sitesi. Zebra perde, Klasik perde, Stor perde ve Jaluzi perde modelleri.',
    url: typeof window !== 'undefined' ? window.location.href : 'https://hiedra.com',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.image,
          url: typeof window !== 'undefined' ? `${window.location.origin}/product/${product.id}` : `https://hiedra.com/product/${product.id}`,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'TRY',
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
          }
        }
      }))
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Ana Sayfa',
          item: typeof window !== 'undefined' ? window.location.origin : 'https://hiedra.com'
        }
      ]
    }
  }

  return (
    <div className="product-list-container">
      <SEO
        title="Perde Satış - Online Perde Satın Al | Bingöl Perde Satışı | Hiedra Perde"
        description="Bingöl ve Türkiye'nin en kaliteli perde satış sitesi. Zebra perde, Klasik perde, Stor perde ve Jaluzi perde modelleri. Bingöl perde satışı, Erzurum perde satışı. Hızlı teslimat, uygun fiyat garantisi."
        keywords="bingöl perde, bingöl perde satışı, erzurum perde, erzurum perde satışı, perde satış, online perde satış, perde satın al, perdeler, zebra perde satış, klasik perde, stor perde, jaluzi perde, perde fiyatları, uygun perde, kaliteli perde satış"
        url="/"
        structuredData={structuredData}
      />
      <header className="product-list-header">
        <h1>Perde Satış - Modern ve Şık Perde Koleksiyonları</h1>
        <p className="seo-subtitle">
          Bingöl ve Türkiye'nin en kaliteli perde satış sitesi. Zebra, Klasik, Stor ve Jaluzi perde modelleri. 
          <strong> Bingöl perde satışı</strong> ve <strong>Erzurum perde satışı</strong> için güvenilir çözüm ortağınız. 
          Hızlı teslimat, uygun fiyat garantisi ile perde satın al.
        </p>
      </header>

      <div className="collections-list">
        {collections.map(collection => {
          const isExpanded = expandedCollections[collection.name] ?? true
          
          return (
            <div key={collection.name} className="collection-section">
              <button
                className="collection-header"
                onClick={() => toggleCollection(collection.name)}
              >
                <div className="collection-header-content">
                  <h2 className="collection-name">{collection.name} Perde Satış - {collection.name} Koleksiyonu</h2>
                  <span className="collection-count">
                    {collection.products.length} Model
                  </span>
                </div>
                <svg 
                  className={`collection-arrow ${isExpanded ? 'expanded' : ''}`}
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              
              {isExpanded && (
                <div className="collection-products">
                  <div className="product-grid">
                    {collection.products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProductList

