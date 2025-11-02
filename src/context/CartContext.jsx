import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

// LocalStorage key
const CART_STORAGE_KEY = 'hiedra_cart'
const CART_EXPIRY_DAYS = 30 // 30 gün süre

// LocalStorage'dan sepeti yükle
const loadCartFromStorage = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return []
    
    const cartData = JSON.parse(stored)
    
    // Süre kontrolü
    if (cartData.expiry && new Date().getTime() > cartData.expiry) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return []
    }
    
    return cartData.items || []
  } catch (error) {
    console.error('Sepet yüklenirken hata:', error)
    return []
  }
}

// LocalStorage'a sepeti kaydet
const saveCartToStorage = (items) => {
  try {
    const expiryDate = new Date().getTime() + (CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    const cartData = {
      items,
      expiry: expiryDate,
      savedAt: new Date().getTime()
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData))
  } catch (error) {
    console.error('Sepet kaydedilirken hata:', error)
  }
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  // İlk yüklemede localStorage'dan sepeti yükle
  const [cartItems, setCartItems] = useState(() => loadCartFromStorage())

  // Sepet her değiştiğinde localStorage'a kaydet
  useEffect(() => {
    saveCartToStorage(cartItems)
  }, [cartItems])

  const addToCart = (product, customizations = {}) => {
    setCartItems((prevItems) => {
      // Özel fiyatlandırma bilgileri varsa ekle
      const cartItem = {
        ...product,
        quantity: customizations.quantity || 1,
        customizations: customizations.en || customizations.boy || customizations.pileSikligi 
          ? {
              en: customizations.en,
              boy: customizations.boy,
              pileSikligi: customizations.pileSikligi,
              calculatedPrice: customizations.calculatedPrice || product.price
            }
          : null
      }
      
      // Özel fiyatlandırmalı ürünler için benzersiz key oluştur
      const itemKey = customizations.en || customizations.boy || customizations.pileSikligi
        ? `${product.id}_${customizations.en}_${customizations.boy}_${customizations.pileSikligi}`
        : product.id
      
      const existingItem = prevItems.find((item) => {
        if (item.customizations && cartItem.customizations) {
          return item.id === product.id && 
                 item.customizations.en === cartItem.customizations.en &&
                 item.customizations.boy === cartItem.customizations.boy &&
                 item.customizations.pileSikligi === cartItem.customizations.pileSikligi
        }
        return item.id === product.id && !item.customizations && !cartItem.customizations
      })
      
      if (existingItem) {
        return prevItems.map((item) => {
          const isSameItem = item.customizations && cartItem.customizations
            ? item.id === product.id && 
              item.customizations.en === cartItem.customizations.en &&
              item.customizations.boy === cartItem.customizations.boy &&
              item.customizations.pileSikligi === cartItem.customizations.pileSikligi
            : item.id === product.id && !item.customizations && !cartItem.customizations
          
          if (isSameItem) {
            return { 
              ...item, 
              quantity: item.quantity + (customizations.quantity || 1)
            }
          }
          return item
        })
      }
      return [...prevItems, { ...cartItem, itemKey }]
    })
  }

  const removeFromCart = (productId, itemKey = null) => {
    setCartItems((prevItems) => {
      if (itemKey) {
        // Özel fiyatlandırmalı ürün ise itemKey ile sil
        return prevItems.filter((item) => item.itemKey !== itemKey)
      }
      // Normal ürün ise id ile sil (ilk eşleşeni)
      return prevItems.filter((item) => item.id !== productId)
    })
  }

  const updateQuantity = (productId, quantity, itemKey = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, itemKey)
      return
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (itemKey) {
          // Özel fiyatlandırmalı ürün ise itemKey ile bul
          return item.itemKey === itemKey ? { ...item, quantity } : item
        }
        // Normal ürün ise id ile bul (ilk eşleşeni)
        return item.id === productId && !item.itemKey ? { ...item, quantity } : item
      })
    )
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.customizations?.calculatedPrice || item.price
      return total + itemPrice * item.quantity
    }, 0)
  }

  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

