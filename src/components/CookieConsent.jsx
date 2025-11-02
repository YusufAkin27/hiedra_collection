import React, { useState, useEffect } from 'react'
import './CookieConsent.css'

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true, // Zorunlu çerezler her zaman aktif
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // LocalStorage'dan çerez onay durumunu kontrol et
    const cookieConsent = localStorage.getItem('cookieConsent')
    
    if (!cookieConsent) {
      // Eğer onay verilmemişse, 500ms sonra popup'ı göster
      setTimeout(() => {
        setShowConsent(true)
      }, 500)
    } else {
      // Eğer onay verilmişse, kaydedilen ayarları yükle
      const savedSettings = localStorage.getItem('cookieSettings')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          setCookieSettings(settings)
        } catch (e) {
          console.error('Çerez ayarları yüklenemedi:', e)
        }
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true
    }
    setCookieSettings(allAccepted)
    saveCookieSettings(allAccepted)
    setShowConsent(false)
    setShowSettings(false)
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false
    }
    setCookieSettings(onlyNecessary)
    saveCookieSettings(onlyNecessary)
    setShowConsent(false)
    setShowSettings(false)
  }

  const handleSaveSettings = () => {
    saveCookieSettings(cookieSettings)
    setShowConsent(false)
    setShowSettings(false)
  }

  const saveCookieSettings = (settings) => {
    localStorage.setItem('cookieConsent', 'accepted')
    localStorage.setItem('cookieSettings', JSON.stringify(settings))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    
    // Çerez ayarlarına göre script'leri yükle/kaldır
    manageCookieScripts(settings)
  }

  const manageCookieScripts = (settings) => {
    // Analytics çerezleri için (örnek: Google Analytics)
    if (settings.analytics) {
      // Analytics script'ini yükle
      console.log('Analytics çerezleri aktifleştirildi')
    } else {
      // Analytics script'ini kaldır
      console.log('Analytics çerezleri deaktifleştirildi')
    }

    // Marketing çerezleri için
    if (settings.marketing) {
      // Marketing script'ini yükle
      console.log('Marketing çerezleri aktifleştirildi')
    } else {
      // Marketing script'ini kaldır
      console.log('Marketing çerezleri deaktifleştirildi')
    }
  }

  const handleSettingsToggle = (type) => {
    if (type === 'necessary') return // Zorunlu çerezler değiştirilemez
    
    setCookieSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  if (!showConsent && !showSettings) {
    // Ayarlar butonu - sağ alt köşede
    return (
      <button 
        className="cookie-settings-btn" 
        onClick={() => setShowSettings(true)}
        title="Çerez Ayarları"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.364-4.636l-4.243 4.243m0-8.485l4.243 4.243M8.636 15.364l-4.243 4.243m0-8.485l4.243 4.243"/>
        </svg>
      </button>
    )
  }

  return (
    <>
      {(showConsent || showSettings) && (
        <div className="cookie-consent-overlay" onClick={() => !showSettings && setShowConsent(false)}>
          <div className="cookie-consent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cookie-consent-header">
              <h2>🍪 Çerez Politikası</h2>
              {showSettings && (
                <button 
                  className="cookie-close-btn"
                  onClick={() => {
                    setShowSettings(false)
                    setShowConsent(false)
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="cookie-consent-content">
              {showSettings ? (
                // Ayarlar görünümü
                <div className="cookie-settings">
                  <p className="cookie-info">
                    Web sitemiz, kullanıcı deneyimini iyileştirmek ve siteyi analiz etmek için çerezler kullanmaktadır.
                    Aşağıdan hangi çerezleri kabul etmek istediğinizi seçebilirsiniz.
                  </p>

                  <div className="cookie-categories">
                    <div className="cookie-category">
                      <div className="cookie-category-header">
                        <div>
                          <h3>Zorunlu Çerezler</h3>
                          <p>Bu çerezler sitenin çalışması için gereklidir ve kapatılamaz.</p>
                        </div>
                        <label className="cookie-toggle">
                          <input 
                            type="checkbox" 
                            checked={true} 
                            disabled 
                          />
                          <span className="cookie-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="cookie-category">
                      <div className="cookie-category-header">
                        <div>
                          <h3>Analitik Çerezler</h3>
                          <p>Web sitesinin nasıl kullanıldığını anlamamıza yardımcı olur.</p>
                        </div>
                        <label className="cookie-toggle">
                          <input 
                            type="checkbox" 
                            checked={cookieSettings.analytics}
                            onChange={() => handleSettingsToggle('analytics')}
                          />
                          <span className="cookie-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="cookie-category">
                      <div className="cookie-category-header">
                        <div>
                          <h3>Pazarlama Çerezleri</h3>
                          <p>Kişiselleştirilmiş reklamlar göstermek için kullanılır.</p>
                        </div>
                        <label className="cookie-toggle">
                          <input 
                            type="checkbox" 
                            checked={cookieSettings.marketing}
                            onChange={() => handleSettingsToggle('marketing')}
                          />
                          <span className="cookie-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // İlk onay görünümü
                <div className="cookie-intro">
                  <p>
                    Web sitemiz, size en iyi deneyimi sunmak için çerezler kullanmaktadır. 
                    Sitemizi kullanmaya devam ederek çerezlerin kullanılmasını kabul etmiş olursunuz.
                  </p>
                  <p className="cookie-detail">
                    <a href="/cerez-politikasi" target="_blank" rel="noopener noreferrer">
                      Çerez Politikası
                    </a> ve{' '}
                    <a href="/gizlilik-politikasi" target="_blank" rel="noopener noreferrer">
                      Gizlilik Politikası
                    </a>
                    'mızı inceleyebilirsiniz.
                  </p>
                </div>
              )}
            </div>

            <div className="cookie-consent-actions">
              {showSettings ? (
                <>
                  <button className="cookie-btn cookie-btn-secondary" onClick={handleRejectAll}>
                    Tümünü Reddet
                  </button>
                  <button className="cookie-btn cookie-btn-primary" onClick={handleSaveSettings}>
                    Ayarları Kaydet
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="cookie-btn cookie-btn-settings" 
                    onClick={() => {
                      setShowConsent(false)
                      setShowSettings(true)
                    }}
                  >
                    Ayarlar
                  </button>
                  <button className="cookie-btn cookie-btn-secondary" onClick={handleRejectAll}>
                    Reddet
                  </button>
                  <button className="cookie-btn cookie-btn-primary" onClick={handleAcceptAll}>
                    Tümünü Kabul Et
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ayarlar butonu - her zaman görünür */}
      <button 
        className="cookie-settings-btn" 
        onClick={() => setShowSettings(true)}
        title="Çerez Ayarları"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.364-4.636l-4.243 4.243m0-8.485l4.243 4.243M8.636 15.364l-4.243 4.243m0-8.485l4.243 4.243"/>
        </svg>
      </button>
    </>
  )
}

export default CookieConsent

