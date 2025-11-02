import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import './Header.css'

const Header = () => {
  const { getCartItemsCount } = useCart()
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // URL'deki arama terimini kontrol et
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const search = params.get('search') || ''
    setSearchTerm(search)
  }, [location])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      navigate('/')
    }
    setIsSearchOpen(false)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
  }

  return (
    <header className="header" role="banner">
      <div className="header-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src="/logo.png" alt="Hiedra Collection" className="logo-img" />
          <div className="logo-text">
            <h1>HIEDRA</h1>
            <span>Perde Satış</span>
          </div>
        </Link>

        {/* Arama Kutusu */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchOpen(true)}
            />
            <button type="submit" className="search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </form>

        {/* Masaüstü Navigasyon */}
        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`} role="navigation" aria-label="Ana navigasyon">
          <Link to="/" className="nav-link" onClick={closeMenu}>
            Ana Sayfa
          </Link>
          <Link to="/hakkimizda" className="nav-link" onClick={closeMenu}>
            Hakkımızda
          </Link>
          <Link to="/iletisim" className="nav-link" onClick={closeMenu}>
            İletişim
          </Link>
          <Link to="/sss" className="nav-link" onClick={closeMenu}>
            SSS
          </Link>
          <Link to="/siparis-sorgula" className="nav-link" onClick={closeMenu}>
            Sipariş Sorgula
          </Link>
          <button className="nav-link theme-toggle" onClick={toggleTheme} aria-label="Tema Değiştir">
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          <Link to="/cart" className="nav-link cart-link" onClick={closeMenu}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 2L7 6m6-4l2 4M3 8h18l-1 8H4L3 8z" />
              <circle cx="7" cy="20" r="2" />
              <circle cx="17" cy="20" r="2" />
            </svg>
            {getCartItemsCount() > 0 && (
              <span className="cart-count">{getCartItemsCount()}</span>
            )}
          </Link>
        </nav>

        {/* Mobil Menü Butonu */}
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Menü">
          <span className={isMenuOpen ? 'active' : ''}></span>
          <span className={isMenuOpen ? 'active' : ''}></span>
          <span className={isMenuOpen ? 'active' : ''}></span>
        </button>
      </div>
    </header>
  )
}

export default Header
