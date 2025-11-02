import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import ProductList from './components/ProductList'
import ProductDetail from './components/ProductDetail'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import OrderLookup from './components/OrderLookup'
import About from './components/About'
import Contact from './components/Contact'
import FAQ from './components/FAQ'
import OrderConfirmation from './components/OrderConfirmation'
import PaymentFailed from './components/PaymentFailed'
import Payment3DCallback from './components/Payment3DCallback'
import NotFound from './components/NotFound'
import CookieConsent from './components/CookieConsent'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Header />
            <main className="main-content" role="main">
              <Routes>
                <Route path="/" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/siparis-sorgula" element={<OrderLookup />} />
                <Route path="/hakkimizda" element={<About />} />
                <Route path="/iletisim" element={<Contact />} />
                <Route path="/sss" element={<FAQ />} />
                <Route path="/siparis-onayi" element={<OrderConfirmation />} />
                <Route path="/odeme-basarisiz" element={<PaymentFailed />} />
                <Route path="/payment/3d-callback" element={<Payment3DCallback />} />
                {/* Backend redirect route'ları */}
                <Route path="/payment-success" element={<OrderConfirmation />} />
                <Route path="/payment-failed" element={<PaymentFailed />} />
                {/* 404 Sayfası - En sonda olmalı */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <CookieConsent />
          </div>
        </Router>
      </CartProvider>
    </ThemeProvider>
  )
}

export default App

