import React from 'react'
import SEO from './SEO'
import './About.css'

const About = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Hakkımızda - Perde Satış Uzmanı | Hiedra Perde',
    description: 'Hiedra Perde - 2010 yılından beri perde satış sektöründe hizmet veren güvenilir çözüm ortağınız.',
    url: typeof window !== 'undefined' ? window.location.href : 'https://hiedra.com/hakkimizda',
    mainEntity: {
      '@type': 'Organization',
      name: 'Hiedra Perde',
      alternateName: 'Hiedra Perde Satış',
      foundingDate: '2010',
      description: 'Perde satış ve dekorasyon sektöründe kaliteli ürünler ve profesyonel hizmet sunan öncü firma',
      numberOfEmployees: '50+',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'TR'
      },
      areaServed: {
        '@type': 'Country',
        name: 'Türkiye'
      },
      serviceType: 'Perde Satış ve Dekorasyon Hizmetleri',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://hiedra.com'
    }
  }

  return (
    <div className="about-container">
      <SEO
        title="Hakkımızda - Perde Satış Uzmanı | Hiedra Perde"
        description="Hiedra Perde - 2010'dan beri perde satış sektöründe güvenilir çözüm ortağınız. Kaliteli perde ürünleri, uygun fiyatlar, profesyonel hizmet. Perde satış için doğru adres."
        keywords="hakkımızda, hiedra perde, perde firması, perde şirketi, perde satış, perde hizmeti, perde montaj, perde satış şirketi, türkiye perde satış"
        url="/hakkimizda"
        structuredData={structuredData}
      />
      <div className="about-content">
        <header className="about-header">
          <h1>Hakkımızda - Bingöl Perde Satış Uzmanı</h1>
          <p className="about-subtitle">
            2010'dan beri <strong>Bingöl perde satış</strong> sektöründe güvenilir çözüm ortağınız. 
            <strong> Erzurum perde satışı</strong> ve Türkiye genelinde hizmet veriyoruz.
          </p>
        </header>

        <div className="about-sections">
          <section className="about-section">
            <div className="section-number">01</div>
            <h2>Biz Kimiz?</h2>
            <p>
              HIEDRA olarak, 2010 yılından beri perde ve dekorasyon sektöründe hizmet vermekteyiz. 
              Müşteri memnuniyetini ön planda tutarak, kaliteli ürünler ve profesyonel hizmet anlayışıyla 
              binlerce mutlu müşteriye ulaştık. Modern ve klasik tasarımları bir araya getirerek, 
              her zevke uygun perde çözümleri sunuyoruz.
            </p>
          </section>

          <section className="about-section">
            <div className="section-number">02</div>
            <h2>Misyonumuz</h2>
            <p>
              Evlerinizin ve iş yerlerinizin atmosferini değiştiren, yaşam kalitesini artıran 
              perde çözümleri sunmak. Müşterilerimize en kaliteli ürünleri, uygun fiyatlarla 
              ve mükemmel hizmet kalitesiyle sunarak, onların hayallerindeki mekanları yaratmalarına 
              yardımcı olmak.
            </p>
          </section>

          <section className="about-section">
            <div className="section-number">03</div>
            <h2>Vizyonumuz</h2>
            <p>
              Türkiye'nin önde gelen perde ve dekorasyon markası olmak. Sürekli gelişen 
              tasarım anlayışımız ve müşteri odaklı yaklaşımımızla, sektörde öncü olmak ve 
              uluslararası pazara açılmak.
            </p>
          </section>

          <section className="about-section features-section">
            <div className="section-number">04</div>
            <h2>Neden HIEDRA?</h2>
            <ul className="features-list">
              <li>
                <span className="feature-icon"></span>
                <span className="feature-text">Geniş ürün yelpazesi ve çeşitli tasarım seçenekleri</span>
              </li>
              <li>
                <span className="feature-icon"></span>
                <span className="feature-text">Yüksek kaliteli kumaşlar ve dayanıklı malzemeler</span>
              </li>
              <li>
                <span className="feature-icon"></span>
                <span className="feature-text">Uygun fiyatlar ve esnek ödeme seçenekleri</span>
              </li>
              <li>
                <span className="feature-icon"></span>
                <span className="feature-text">Profesyonel ölçü ve montaj hizmeti</span>
              </li>
              <li>
                <span className="feature-icon"></span>
                <span className="feature-text">Müşteri memnuniyeti garantisi</span>
              </li>
              <li>
                <span className="feature-icon"></span>
                <span className="feature-text">Hızlı teslimat ve güvenilir hizmet</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <h3>10+</h3>
            <p>Yıllık Deneyim</p>
          </div>
          <div className="stat-card">
            <h3>5000+</h3>
            <p>Mutlu Müşteri</p>
          </div>
          <div className="stat-card">
            <h3>100+</h3>
            <p>Ürün Çeşidi</p>
          </div>
          <div className="stat-card">
            <h3>50+</h3>
            <p>Uzman Ekip</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About

