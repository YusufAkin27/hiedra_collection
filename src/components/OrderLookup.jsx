import React, { useState, useRef, useEffect } from 'react'
import SEO from './SEO'
import './OrderLookup.css'

// Backend base URL
const BACKEND_BASE_URL = 'http://localhost:8080'
const API_BASE_URL = `${BACKEND_BASE_URL}/api/orders`

const OrderLookup = () => {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [userCaptcha, setUserCaptcha] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [orderFound, setOrderFound] = useState(false)
  const [orderData, setOrderData] = useState(null)
  const [error, setError] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('Müşteri isteği')
  const [refundReason, setRefundReason] = useState('İade talebi')
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const captchaRef = useRef(null)
  
  // Toast bildirim göster
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 4000)
  }

  // Adres güncelleme formu state
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    addressDetail: '',
    city: '',
    district: '',
    postalCode: ''
  })

  // Basit captcha oluştur
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Component mount olduğunda captcha oluştur
  useEffect(() => {
    setCaptcha(generateCaptcha())
  }, [])

  // Captcha'yı yenile
  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha())
    setUserCaptcha('')
    if (captchaRef.current) {
      captchaRef.current.focus()
    }
  }

  // Form validasyonu
  const validateForm = () => {
    if (!orderNumber.trim()) {
      showToast('Lütfen sipariş numaranızı giriniz.', 'error')
      return false
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Lütfen geçerli bir e-posta adresi giriniz.', 'error')
      return false
    }
    if (!userCaptcha.trim()) {
      showToast('Lütfen güvenlik kodunu giriniz.', 'error')
      return false
    }
    if (userCaptcha.toUpperCase() !== captcha.toUpperCase()) {
      showToast('Güvenlik kodu hatalı! Lütfen tekrar deneyiniz.', 'error')
      refreshCaptcha()
      return false
    }
    return true
  }

  // Sipariş sorgula (API çağrısı)
  const fetchOrder = async (orderNum, customerEmail) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderNum.trim(),
          customerEmail: customerEmail.trim()
        })
      })

      const contentType = response.headers.get('content-type') || ''
      
      if (!contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error('Beklenmeyen yanıt formatı')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Sipariş bulunamadı')
      }

      // Backend'den gelen order verisini set et
      if (data.success && data.data) {
        const order = data.data
        setOrderData({
          ...order,
          // Address listesinden ilk adresi al (varsa)
          shippingAddress: order.addresses && order.addresses.length > 0 
            ? order.addresses[0] 
            : {}
        })
        setAddressForm({
          fullName: order.customerName || '',
          phone: order.customerPhone || '',
          addressLine: order.addresses && order.addresses.length > 0 ? order.addresses[0].addressLine || '' : '',
          addressDetail: order.addresses && order.addresses.length > 0 ? order.addresses[0].addressDetail || '' : '',
          city: order.addresses && order.addresses.length > 0 ? order.addresses[0].city || '' : '',
          district: order.addresses && order.addresses.length > 0 ? order.addresses[0].district || '' : '',
          postalCode: order.addresses && order.addresses.length > 0 ? order.addresses[0].postalCode || '' : ''
        })
        setOrderFound(true)
      } else {
        throw new Error(data.message || 'Sipariş bulunamadı')
      }
    } catch (err) {
      setError(err.message || 'Sipariş sorgulanırken bir hata oluştu')
      setOrderFound(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Form submit handler
  const handleLookup = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    
    if (!validateForm()) {
      return
    }

    await fetchOrder(orderNumber, email)
  }

  // Yeni sorgulama yap
  const handleNewLookup = () => {
    setOrderNumber('')
    setEmail('')
    setUserCaptcha('')
    setOrderFound(false)
    setOrderData(null)
    setError('')
    setShowAddressForm(false)
    setShowCancelModal(false)
    setShowRefundModal(false)
    refreshCaptcha()
  }

  // Adres güncelleme
  const handleAddressChange = (e) => {
    setAddressForm({
      ...addressForm,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdateAddress = async () => {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine || 
        !addressForm.city || !addressForm.district || !addressForm.postalCode) {
      showToast('Lütfen tüm zorunlu alanları doldurunuz.', 'error')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/${orderData.orderNumber}/address?email=${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderData.orderNumber,
          fullName: addressForm.fullName,
          phone: addressForm.phone,
          addressLine: addressForm.addressLine,
          addressDetail: addressForm.addressDetail || '',
          city: addressForm.city,
          district: addressForm.district,
          postalCode: addressForm.postalCode
        })
      })

      const contentType = response.headers.get('content-type') || ''
      let data

      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error('Beklenmeyen yanıt formatı')
      }

      if (!response.ok) {
        throw new Error(data.message || 'Adres güncellenemedi')
      }

      if (data.success) {
        showToast('Adres başarıyla güncellendi!', 'success')
        setShowAddressForm(false)
        // Siparişi tekrar sorgula
        await fetchOrder(orderData.orderNumber, email)
      }
    } catch (err) {
      setError(err.message || 'Adres güncellenirken bir hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  // Sipariş iptali
  const handleCancelOrder = async () => {
    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/${orderData.orderNumber}/cancel?email=${encodeURIComponent(email)}&reason=${encodeURIComponent(cancelReason)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const contentType = response.headers.get('content-type') || ''
      let data

      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error('Beklenmeyen yanıt formatı')
      }

      if (!response.ok) {
        throw new Error(data.message || 'Sipariş iptal edilemedi')
      }

      if (data.success) {
        showToast('Sipariş iptal talebiniz alındı!', 'success')
        setShowCancelModal(false)
        // Siparişi tekrar sorgula
        await fetchOrder(orderData.orderNumber, email)
      }
    } catch (err) {
      setError(err.message || 'Sipariş iptal edilirken bir hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  // İade talebi
  const handleRequestRefund = async () => {
    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/${orderData.orderNumber}/refund?email=${encodeURIComponent(email)}&reason=${encodeURIComponent(refundReason)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const contentType = response.headers.get('content-type') || ''
      let data

      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error('Beklenmeyen yanıt formatı')
      }

      if (!response.ok) {
        throw new Error(data.message || 'İade talebi oluşturulamadı')
      }

      if (data.success) {
        showToast('İade talebiniz alındı!', 'success')
        setShowRefundModal(false)
        // Siparişi tekrar sorgula
        await fetchOrder(orderData.orderNumber, email)
      }
    } catch (err) {
      setError(err.message || 'İade talebi oluşturulurken bir hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  // Sipariş iptal edilebilir mi?
  const canCancel = () => {
    if (!orderData || !orderData.status) return false
    const status = orderData.status.toUpperCase()
    return status === 'PENDING' || status === 'PAID' || status === 'PROCESSING'
  }

  // İade talep edilebilir mi?
  const canRefund = () => {
    if (!orderData || !orderData.status) return false
    const status = orderData.status.toUpperCase()
    return status === 'SHIPPED' || status === 'DELIVERED'
  }

  // Status'u Türkçe'ye çevir
  const getStatusText = (status) => {
    if (!status) return 'Bilinmiyor'
    const statusMap = {
      'PENDING': 'Beklemede',
      'PAID': 'Ödendi',
      'PROCESSING': 'Hazırlanıyor',
      'SHIPPED': 'Kargoya Verildi',
      'DELIVERED': 'Teslim Edildi',
      'CANCELLED': 'İptal Edildi',
      'REFUNDED': 'İade Edildi'
    }
    return statusMap[status.toUpperCase()] || status
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Sipariş Sorgula - Perde Satış Sipariş Takibi',
    description: 'Perde satış sipariş durumu sorgulama sayfası. Sipariş numaranız ile siparişinizin durumunu takip edin.',
    url: typeof window !== 'undefined' ? window.location.href : 'https://hiedra.com/siparis-sorgula'
  }

  return (
    <div className="order-lookup-container">
      <SEO
        title="Sipariş Sorgula - Perde Satış Sipariş Takibi | Hiedra Perde"
        description="Perde satış sipariş sorgulama sayfası. Siparişinizin durumunu öğrenmek için sipariş numaranızı ve e-posta adresinizi giriniz. Hiedra Perde sipariş takip sistemi."
        keywords="sipariş sorgula, sipariş takip, perde satış sipariş sorgulama, sipariş durumu, kargo takip, perde sipariş takibi"
        url="/siparis-sorgula"
        structuredData={structuredData}
      />
      <header className="lookup-header">
        <h1>Sipariş Sorgula - Perde Satış Sipariş Takibi</h1>
        <p>Perde satış siparişinizin durumunu takip etmek için bilgilerinizi giriniz</p>
      </header>

      {!orderFound ? (
        <div className="lookup-form-container">
          {error && (
            <div className="error-message" style={{ 
              padding: '1rem', 
              backgroundColor: '#fee', 
              color: '#c33', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}
          <form className="lookup-form" onSubmit={handleLookup}>
            <div className="form-group">
              <label htmlFor="orderNumber">
                Sipariş Numarası <span className="required">*</span>
              </label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="Örn: ORD-2024-001234"
                required
                maxLength="20"
              />
              <p className="form-hint">Sipariş onay e-postanızdaki sipariş numaranızı giriniz</p>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                E-posta Adresi <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siparis@email.com"
                required
              />
              <p className="form-hint">Sipariş verdiğiniz e-posta adresini giriniz</p>
            </div>

            <div className="form-group">
              <label htmlFor="captcha">
                Güvenlik Kodu <span className="required">*</span>
              </label>
              <div className="captcha-container">
                <div className="captcha-display" onClick={refreshCaptcha}>
                  <span className="captcha-text">{captcha}</span>
                  <button
                    type="button"
                    className="captcha-refresh"
                    onClick={(e) => {
                      e.preventDefault()
                      refreshCaptcha()
                    }}
                    title="Yenile"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </button>
                </div>
                <input
                  ref={captchaRef}
                  type="text"
                  id="captcha"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value.toUpperCase())}
                  placeholder="Yukarıdaki kodu giriniz"
                  required
                  maxLength="5"
                  className="captcha-input"
                />
              </div>
              <p className="form-hint">Yukarıdaki kodu giriniz (büyük/küçük harf duyarsız)</p>
            </div>

            <button type="submit" className="lookup-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Sorgulanıyor...
                </>
              ) : (
                'Siparişi Sorgula'
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="order-details-container">
          {error && (
            <div className="error-message" style={{ 
              padding: '1rem', 
              backgroundColor: '#fee', 
              color: '#c33', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}
          
          <div className="order-header-actions">
            <button onClick={handleNewLookup} className="new-lookup-btn">
              ← Yeni Sorgulama
            </button>
            <div className="action-buttons">
              {canCancel() && (
                <button 
                  onClick={() => setShowCancelModal(true)} 
                  className="cancel-btn"
                  disabled={isProcessing}
                >
                  Siparişi İptal Et
                </button>
              )}
              {canRefund() && (
                <button 
                  onClick={() => setShowRefundModal(true)} 
                  className="refund-btn"
                  disabled={isProcessing}
                >
                  İade Talep Et
                </button>
              )}
              <button 
                onClick={() => setShowAddressForm(!showAddressForm)} 
                className="update-address-btn"
              >
                {showAddressForm ? 'Adres Formunu Kapat' : 'Adresi Güncelle'}
              </button>
            </div>
          </div>

          <div className="order-status-card">
            <div className="status-header">
              <div className="status-info">
                <h3>Sipariş No: {orderData.orderNumber}</h3>
                <span className={`status-badge ${(orderData.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                  {getStatusText(orderData.status)}
                </span>
              </div>
              <div className="order-date">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Tarih bilgisi yok'}
              </div>
            </div>
          </div>

          {showAddressForm && (
            <div className="order-section address-form-section">
              <h3>Adres Güncelle</h3>
              <div className="address-form">
                <div className="form-group">
                  <label>Ad Soyad <span className="required">*</span></label>
                  <input
                    type="text"
                    name="fullName"
                    value={addressForm.fullName}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefon <span className="required">*</span></label>
                  <input
                    type="text"
                    name="phone"
                    value={addressForm.phone}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Adres Satırı <span className="required">*</span></label>
                  <input
                    type="text"
                    name="addressLine"
                    value={addressForm.addressLine}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Adres Detayı</label>
                  <input
                    type="text"
                    name="addressDetail"
                    value={addressForm.addressDetail}
                    onChange={handleAddressChange}
                  />
                </div>
                <div className="form-group">
                  <label>Şehir <span className="required">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>İlçe <span className="required">*</span></label>
                  <input
                    type="text"
                    name="district"
                    value={addressForm.district}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Posta Kodu <span className="required">*</span></label>
                  <input
                    type="text"
                    name="postalCode"
                    value={addressForm.postalCode}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <button 
                  onClick={handleUpdateAddress} 
                  className="lookup-btn"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Güncelleniyor...' : 'Adresi Güncelle'}
                </button>
              </div>
            </div>
          )}

          <div className="order-section">
            <h3>Sipariş Detayları</h3>
            <div className="order-items">
              {orderData.orderItems && orderData.orderItems.length > 0 ? (
                orderData.orderItems.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <h4>{item.productName || 'Ürün'}</h4>
                      <div className="item-customizations">
                        {item.width && <span>En: {item.width} cm</span>}
                        {item.height && <span>Boy: {item.height} cm</span>}
                        {item.pleatType && (
                          <span>Pile: {item.pleatType === 'pilesiz' ? 'Pilesiz' : item.pleatType}</span>
                        )}
                      </div>
                      <span className="item-quantity">Adet: {item.quantity || 1}</span>
                    </div>
                    <div className="item-price">{item.price ? parseFloat(item.price).toFixed(2) : '0.00'} ₺</div>
                  </div>
                ))
              ) : (
                <p>Sipariş detayı bulunamadı</p>
              )}
            </div>
            <div className="order-total">
              <span>Toplam:</span>
              <span>{orderData.totalAmount ? parseFloat(orderData.totalAmount).toFixed(2) : '0.00'} ₺</span>
            </div>
          </div>

          <div className="order-section">
            <h3>Teslimat Adresi</h3>
            <div className="address-details">
              {orderData.shippingAddress && (
                <>
                  {orderData.shippingAddress.addressLine && (
                    <p>{orderData.shippingAddress.addressLine}</p>
                  )}
                  {orderData.shippingAddress.addressDetail && (
                    <p>{orderData.shippingAddress.addressDetail}</p>
                  )}
                  {(orderData.shippingAddress.district || orderData.shippingAddress.city) && (
                    <p>{orderData.shippingAddress.district || ''} {orderData.shippingAddress.district && orderData.shippingAddress.city ? '/' : ''} {orderData.shippingAddress.city || ''}</p>
                  )}
                  {orderData.shippingAddress.postalCode && (
                    <p>Posta Kodu: {orderData.shippingAddress.postalCode}</p>
                  )}
                </>
              )}
              {(!orderData.shippingAddress || (!orderData.shippingAddress.addressLine && !orderData.shippingAddress.city)) && (
                <p>Adres bilgisi bulunamadı</p>
              )}
            </div>
          </div>

          {orderData.cancelReason && (
            <div className="order-section">
              <h3>İptal Bilgisi</h3>
              <div className="address-details">
                <p><strong>Sebep:</strong> {orderData.cancelReason}</p>
                {orderData.cancelledAt && (
                  <p><strong>İptal Tarihi:</strong> {new Date(orderData.cancelledAt).toLocaleDateString('tr-TR')}</p>
                )}
              </div>
            </div>
          )}

          {orderData.refundedAt && (
            <div className="order-section">
              <h3>İade Bilgisi</h3>
              <div className="address-details">
                <p><strong>İade Tarihi:</strong> {new Date(orderData.refundedAt).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          )}

          {/* İptal Modal */}
          {showCancelModal && (
            <div className="modal-overlay" onClick={() => !isProcessing && setShowCancelModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Siparişi İptal Et</h3>
                <p>Siparişinizi iptal etmek istediğinizden emin misiniz?</p>
                <div className="form-group">
                  <label>İptal Sebebi</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows="3"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div className="modal-actions">
                  <button onClick={() => setShowCancelModal(false)} disabled={isProcessing}>İptal</button>
                  <button onClick={handleCancelOrder} disabled={isProcessing} className="confirm-btn">
                    {isProcessing ? 'İşleniyor...' : 'Onayla'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* İade Modal */}
          {showRefundModal && (
            <div className="modal-overlay" onClick={() => !isProcessing && setShowRefundModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>İade Talebi Oluştur</h3>
                <p>İade talebi oluşturmak istediğinizden emin misiniz?</p>
                <div className="form-group">
                  <label>İade Sebebi</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows="3"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div className="modal-actions">
                  <button onClick={() => setShowRefundModal(false)} disabled={isProcessing}>İptal</button>
                  <button onClick={handleRequestRefund} disabled={isProcessing} className="confirm-btn">
                    {isProcessing ? 'İşleniyor...' : 'Onayla'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast Bildirim */}
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' && (
              <svg className="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
            <span className="toast-message">{toast.message}</span>
          </div>
          <button 
            className="toast-close" 
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
            aria-label="Kapat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default OrderLookup

