import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SEO from './SEO'
import './Payment3DCallback.css'

// Backend base URL
const BACKEND_BASE_URL = 'https://api.yusufakin.com.tr/'
const API_BASE_URL = `${BACKEND_BASE_URL}api/payment`
// Backend endpoint: /api/payment/3d-callback

const Payment3DCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState('')

  // Payment response'u handle et (başarılı veya başarısız) - Backend'den gelen response'a göre yönlendir
  const handlePaymentResponse = (data) => {
    // Backend response formatları:
    // Başarılı: { success: true, data: "ORD-123", message: "Ödeme başarılı..." }
    // Başarısız: { success: false, message: "Ödeme başarısız..." }
    // veya: { isSuccess: true/false, ... }
    
    const isSuccess = data.success === true || data.isSuccess === true
    
    if (isSuccess) {
      // Ödeme başarılı - Backend'den gelen order numarasını kullan
      const orderNumber = data.data || data.orderNumber || data.order || null
      
      const sessionData = JSON.parse(sessionStorage.getItem('checkoutData') || '{}')
      
      const orderData = {
        orderNumber: orderNumber || 'SİPARİŞ-' + Date.now(),
        contactInfo: sessionData.contactInfo || {},
        addressInfo: sessionData.addressInfo || {},
        cardInfo: sessionData.cardInfo || {},
        items: sessionData.items || [],
        totalPrice: sessionData.totalPrice || 0
      }
      
      // Bekleyen parametreleri temizle
      sessionStorage.removeItem('checkoutData')
      sessionStorage.removeItem('pendingPaymentId')
      sessionStorage.removeItem('pendingConversationId')
      sessionStorage.setItem('lastOrderData', JSON.stringify(orderData))
      
      // Sipariş onay sayfasına yönlendir
      window.location.replace('/siparis-onayi')
    } else {
      // Ödeme başarısız - Backend'den gelen hata mesajını kullan
      const errorMessage = data.message || data.error || 'Ödeme işlemi başarısız oldu.'
      
      // Bekleyen parametreleri temizle
      sessionStorage.removeItem('pendingPaymentId')
      sessionStorage.removeItem('pendingConversationId')
      sessionStorage.setItem('paymentError', errorMessage)
      
      // Hemen yönlendir - sayfada kalmasın
      window.location.replace('/odeme-basarisiz')
    }
  }

  // Sayfa içeriğinde JSON ara (SMS doğrulama sayfasından gelen response için)
  const checkForDirectResponse = () => {
    // Pre element içinde JSON olabilir
    const preElements = document.querySelectorAll('pre')
    for (const pre of preElements) {
      const text = pre.textContent || pre.innerText
      if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
        try {
          const jsonData = JSON.parse(text.trim())
          return jsonData
        } catch (e) {
          // JSON parse error
        }
      }
    }
    
    // Body text içinde JSON ara
    const bodyText = document.body.innerText || document.body.textContent || ''
    const jsonMatch = bodyText.match(/\{[\s\S]*"success"[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0])
        return jsonData
      } catch (e) {
        // JSON parse error
      }
    }
    
    // Textarea veya input içinde JSON olabilir
    const textareaElements = document.querySelectorAll('textarea, input[type="text"]')
    for (const elem of textareaElements) {
      const text = elem.value || elem.textContent || ''
      if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
        try {
          const jsonData = JSON.parse(text.trim())
          return jsonData
        } catch (e) {
          // JSON parse error
        }
      }
    }
    
    return null
  }

  // Normal callback işlemi (URL parametreleri ile)
  const processCallback = async (paymentId, conversationId) => {
    try {
      // Backend endpoint: /api/payment/3d-callback
      const url = `${API_BASE_URL}/3d-callback?paymentId=${encodeURIComponent(paymentId)}&conversationId=${encodeURIComponent(conversationId)}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      // Response içeriğini önce al (response.text() sadece bir kez çağrılabilir)
      const contentType = response.headers.get('content-type') || ''
      const responseText = await response.text()
      const status = response.status
      

      // HTML error page kontrolü
      if (responseText.includes('Whitelabel Error Page') || 
          responseText.includes('This application has no explicit mapping') ||
          responseText.trim().startsWith('<!DOCTYPE') ||
          (responseText.trim().startsWith('<html') && !responseText.includes('iyzico'))) {
        const errorMessage = 'Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.'
        sessionStorage.setItem('paymentError', errorMessage)
        window.location.replace('/odeme-basarisiz')
        return
      }

      // HTTP hata durumları
      if (!response.ok || status >= 400) {
        let errorMessage = 'Ödeme işlemi sırasında bir hata oluştu.'
        
        if (responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
          try {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch (e) {
            // JSON parse error
          }
        }
        
        sessionStorage.setItem('paymentError', errorMessage)
        window.location.replace('/odeme-basarisiz')
        return
      }

      let data
      
      // JSON response kontrolü
      if (contentType.includes('application/json') || 
          (responseText.trim().startsWith('{') && responseText.trim().endsWith('}'))) {
        try {
          if (!responseText || responseText.trim() === '') {
            sessionStorage.setItem('paymentError', 'Sunucudan yanıt alınamadı.')
            window.location.replace('/odeme-basarisiz')
            return
          }
          data = JSON.parse(responseText)
        } catch (parseError) {
          sessionStorage.setItem('paymentError', `Sunucu yanıtı işlenemedi: ${parseError.message}`)
          window.location.replace('/odeme-basarisiz')
          return
        }
      } else {
        sessionStorage.setItem('paymentError', `Beklenmeyen yanıt formatı: ${contentType || 'bilinmiyor'}`)
        window.location.replace('/odeme-basarisiz')
        return
      }

      // Backend'den gelen response'u handle et ve yönlendir
      // Bu fonksiyon success/error durumuna göre otomatik olarak uygun sayfaya yönlendirecek
      handlePaymentResponse(data)
    } catch (err) {
      const errorMessage = err.message || 'Ödeme işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.'
      sessionStorage.setItem('paymentError', errorMessage)
      window.location.replace('/odeme-basarisiz')
    }
  }

  useEffect(() => {
    const completePayment = async () => {
      // ÖNCE: Backend redirect ile gönderilmiş order parametresi var mı kontrol et
      // Backend ModelAndView redirect ile gönderebilir: redirect:http://localhost:3002/payment/3d-callback?order=ORD-123
      const urlParams = new URLSearchParams(window.location.search)
      const orderNumber = urlParams.get('order') || searchParams.get('order')
      
      if (orderNumber) {
        // Backend redirect with order number
        // Backend başarılı bir şekilde redirect yapmış, order numarası var
        const sessionData = JSON.parse(sessionStorage.getItem('checkoutData') || '{}')
        const orderData = {
          orderNumber: orderNumber,
          contactInfo: sessionData.contactInfo || {},
          addressInfo: sessionData.addressInfo || {},
          cardInfo: sessionData.cardInfo || {},
          items: sessionData.items || [],
          totalPrice: sessionData.totalPrice || 0
        }
        sessionStorage.removeItem('checkoutData')
        sessionStorage.setItem('lastOrderData', JSON.stringify(orderData))
        window.location.replace('/siparis-onayi')
        return
      }
      
      // İKİNCİ: URL parametrelerini kontrol et (paymentId ve conversationId)
      // SMS doğrulama sonrası backend'e yönlendirildiyse paymentId ve conversationId URL'de olabilir
      let paymentId = urlParams.get('paymentId') || searchParams.get('paymentId')
      let conversationId = urlParams.get('conversationId') || searchParams.get('conversationId')
      
      // URL parametreleri varsa direkt API'ye istek at
      if (paymentId && conversationId) {
        // Parametreleri sessionStorage'a kaydet (eğer sayfa yenilenirse tekrar kullanmak için)
        sessionStorage.setItem('pendingPaymentId', paymentId)
        sessionStorage.setItem('pendingConversationId', conversationId)
        
        // Backend'e istek at ve response'u yakala
        await processCallback(paymentId, conversationId)
        return
      }
      
      // ANINDA: Sayfa yüklendiğinde body'de sadece JSON var mı kontrol et
      // Backend direkt JSON döndürdüyse, body'de sadece JSON olacak
      const immediateBodyCheck = () => {
        if (document.body) {
          // InnerHTML de kontrol et (JSON direkt body'de olabilir)
          const bodyHTML = document.body.innerHTML?.trim() || ''
          const bodyText = document.body.textContent?.trim() || document.body.innerText?.trim() || ''
          
          // Önce innerHTML'de JSON var mı kontrol et (HTML tag'leri yoksa)
          if (bodyHTML && 
              bodyHTML.startsWith('{') && 
              bodyHTML.endsWith('}') &&
              !bodyHTML.includes('<html') &&
              !bodyHTML.includes('<body') &&
              !bodyHTML.includes('<!DOCTYPE')) {
            try {
              const jsonData = JSON.parse(bodyHTML)
              if (jsonData.success !== undefined || jsonData.isSuccess !== undefined || jsonData.message) {
                handlePaymentResponse(jsonData)
                return true
              }
            } catch (e) {
              // JSON parse error
            }
          }
          
          // Eğer body'de sadece JSON varsa (HTML yok, sadece JSON text)
          if (bodyText && 
              (bodyText.startsWith('{') && bodyText.endsWith('}')) &&
              !bodyText.includes('<') && 
              !bodyText.includes('html') &&
              !bodyText.includes('HTML')) {
            try {
              const jsonData = JSON.parse(bodyText)
              // Payment response kontrolü (success field'ı olmalı)
              if (jsonData.success !== undefined || jsonData.isSuccess !== undefined || jsonData.message) {
                handlePaymentResponse(jsonData)
                return true
              }
            } catch (e) {
              // JSON parse error
            }
          }
        }
        return false
      }
      
      // İlk anında kontrol et
      if (immediateBodyCheck()) {
        return // Zaten yönlendirildi
      }
      
      // DOMContentLoaded event'inde de kontrol et
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (immediateBodyCheck()) {
            return
          }
        })
      }
      
      // Window load event'inde de kontrol et
      if (document.readyState !== 'complete') {
        window.addEventListener('load', () => {
          if (immediateBodyCheck()) {
            return
          }
        })
      }
      
      // Mevcut URL'yi kontrol et - backend URL'sine direkt yönlendirilmiş olabilir
      const currentUrl = window.location.href
      const currentPath = window.location.pathname
      
      // Backend URL'sine direkt yönlendirilmişse (örnek: https://api.yusufakin.com.tr/api/payment/3d-callback?paymentId=...)
      if (currentUrl.includes('api.yusufakin.com.tr') || currentUrl.includes(BACKEND_BASE_URL)) {
        // Önce body'de JSON var mı kontrol et
        if (immediateBodyCheck()) {
          return // Zaten yönlendirildi
        }
        
        // URL'den parametreleri al
        const urlObj = new URL(currentUrl)
        const paymentId = urlObj.searchParams.get('paymentId')
        const conversationId = urlObj.searchParams.get('conversationId')
        
        if (paymentId && conversationId) {
          await processCallback(paymentId, conversationId)
          return
        }
      }
      
      // ÖNCE: Sayfa içeriğinde direkt JSON response var mı kontrol et
      // SMS doğrulama sayfasından sonra backend direkt JSON döndürebilir
      const directResponse = checkForDirectResponse()
      if (directResponse) {
        handlePaymentResponse(directResponse)
        return
      }
      
      // Eğer direkt response yoksa, URL parametrelerini kullan
      if (paymentId && conversationId) {
        await processCallback(paymentId, conversationId)
        return
      }
      
      // URL parametreleri de yoksa
      // Önce sessionStorage'da bekleyen parametreler var mı kontrol et
      const pendingPaymentId = sessionStorage.getItem('pendingPaymentId')
      const pendingConversationId = sessionStorage.getItem('pendingConversationId')
      if (pendingPaymentId && pendingConversationId) {
        // Parametreleri temizle
        sessionStorage.removeItem('pendingPaymentId')
        sessionStorage.removeItem('pendingConversationId')
        await processCallback(pendingPaymentId, pendingConversationId)
        return
      }
      
      // SessionStorage'da hata mesajı var mı kontrol et
      const storedError = sessionStorage.getItem('paymentError')
      if (storedError) {
        // Hata mesajını koru ve yönlendir
        window.location.replace('/odeme-basarisiz')
        return
      }
      
      // Eğer hiçbir şey yoksa, sayfanın tamamen yüklenmesini bekle ve tekrar kontrol et
      // SMS doğrulama sayfasından yönlendirme biraz geç olabilir
      // Birkaç kez kontrol et - sayfa yüklenene kadar bekle
      let checkCount = 0
      const maxChecks = 10
      const checkInterval = setInterval(() => {
        checkCount++
        
        // Sayfa içeriğinde JSON ara
        const delayedResponse = checkForDirectResponse()
        if (delayedResponse) {
          clearInterval(checkInterval)
          handlePaymentResponse(delayedResponse)
          return
        }
        
        // Eğer body içeriği yüklendiyse ve sadece JSON varsa, onu parse et
        if (document.body && document.body.textContent) {
          const bodyText = document.body.textContent.trim()
          // JSON formatını kontrol et
          if ((bodyText.startsWith('{') && bodyText.endsWith('}')) || 
              (bodyText.startsWith('[') && bodyText.endsWith(']'))) {
            try {
              const jsonData = JSON.parse(bodyText)
              // Eğer success field'ı varsa, bu bizim payment response'umuz
              if (jsonData.success !== undefined || jsonData.isSuccess !== undefined || jsonData.message) {
                clearInterval(checkInterval)
                handlePaymentResponse(jsonData)
                return
              }
            } catch (e) {
              // JSON parse error
            }
          }
        }
        
        // Eğer window.location backend URL'sine gelmişse
        if (window.location.href.includes(BACKEND_BASE_URL)) {
          // Body'de JSON varsa direkt işle
          const bodyText = document.body?.textContent?.trim() || document.body?.innerText?.trim() || ''
          if (bodyText.startsWith('{') && bodyText.endsWith('}')) {
            try {
              const jsonData = JSON.parse(bodyText)
              if (jsonData.success !== undefined || jsonData.isSuccess !== undefined || jsonData.message) {
                clearInterval(checkInterval)
                handlePaymentResponse(jsonData)
                return
              }
            } catch (e) {
              // JSON parse error
            }
          }
          
          // Response'u fetch ile tekrar almayı dene
          if (checkCount === 1) {
            const urlParams = new URLSearchParams(window.location.search)
            const paymentId = urlParams.get('paymentId')
            const conversationId = urlParams.get('conversationId')
            
            if (paymentId && conversationId) {
              clearInterval(checkInterval)
              processCallback(paymentId, conversationId)
              return
            }
          }
        }
        
        // Maksimum kontrol sayısına ulaştıysa durdur
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval)
          sessionStorage.setItem('paymentError', 'Ödeme bilgileri bulunamadı. Lütfen tekrar deneyiniz.')
          window.location.replace('/odeme-basarisiz')
        }
      }, 300) // Her 300ms'de bir kontrol et
    }

    completePayment()
  }, [searchParams, navigate])

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '3D Ödeme Doğrulama',
    description: '3D Secure ödeme işleminiz tamamlanıyor.'
  }

  return (
    <div className="payment-3d-callback-container">
      <SEO
        title="Ödeme İşleniyor"
        description="3D Secure ödeme işleminiz tamamlanıyor. Lütfen bekleyiniz."
        keywords="3d ödeme, ödeme doğrulama, güvenli ödeme"
        url="/payment/3d-callback"
        structuredData={structuredData}
      />
      
      <div className="callback-content">
        {isProcessing ? (
          <>
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <h2>Ödeme İşleniyor</h2>
            <p>3D Secure ödeme işleminiz tamamlanıyor. Lütfen bekleyiniz...</p>
            <p className="redirect-note">Yönlendiriliyorsunuz...</p>
          </>
        ) : error ? (
          <>
            <div className="error-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>İşlem Başarısız</h2>
            <p className="error-text">{error}</p>
            <button onClick={() => window.location.replace('/checkout')} className="btn-retry">
              Ödemeyi Tekrar Dene
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default Payment3DCallback
