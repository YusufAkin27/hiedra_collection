import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './Cart.css'

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
  } = useCart()
  const navigate = useNavigate()

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <h2>Sepetiniz boş</h2>
          <p>Alışverişe başlamak için ürünlerimizi inceleyin</p>
          <Link to="/" className="shop-btn">
            Alışverişe Başla
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>Sepetim</h2>
        <button className="clear-cart-btn" onClick={clearCart}>
          Sepeti Temizle
        </button>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item, index) => (
            <div key={item.itemKey || `${item.id}_${index}`} className="cart-item">
              <Link to={`/product/${item.id}`} className="cart-item-image">
                <img src={item.image} alt={item.name} />
              </Link>
              <div className="cart-item-info">
                <Link to={`/product/${item.id}`} className="cart-item-name">
                  {item.name}
                </Link>
                <span className="cart-item-category">{item.category}</span>
                {item.customizations && (
                  <div className="cart-item-customizations">
                    <div className="customization-item">
                      <span>En:</span>
                      <span>{item.customizations.en} cm</span>
                    </div>
                    <div className="customization-item">
                      <span>Boy:</span>
                      <span>{item.customizations.boy} cm</span>
                    </div>
                    <div className="customization-item">
                      <span>Pile:</span>
                      <span>{item.customizations.pileSikligi === 'pilesiz' ? 'Pilesiz' : item.customizations.pileSikligi}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="cart-item-controls">
                <div className="cart-quantity">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.itemKey)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.itemKey)}>
                    +
                  </button>
                </div>
                <div className="cart-item-price">
                  {((item.customizations?.calculatedPrice || item.price) * item.quantity).toFixed(2)} ₺
                </div>
                <button
                  className="remove-item-btn"
                  onClick={() => removeFromCart(item.id, item.itemKey)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Sipariş Özeti</h3>
          <div className="summary-row">
            <span>Ara Toplam:</span>
            <span>{getCartTotal().toFixed(2)} ₺</span>
          </div>
          <div className="summary-row">
            <span>Kargo:</span>
            <span className="free-shipping">Ücretsiz</span>
          </div>
          <div className="summary-row total">
            <span>Toplam:</span>
            <span>{getCartTotal().toFixed(2)} ₺</span>
          </div>
          <button className="checkout-btn" onClick={() => navigate('/checkout')}>
            Ödemeye Geç
          </button>
          <Link to="/" className="continue-shopping">
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cart

