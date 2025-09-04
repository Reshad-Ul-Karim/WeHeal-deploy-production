import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Inline style overrides for greyscale/neutral theme
const greyscaleStyles = {
  navbar: {
    backgroundColor: "#222", // dark grey
    borderBottom: "1px solid #444",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1050
  },
  navLink: {
    color: "#f4f4f4"
  },
  navBtn: {
    borderColor: "#888",
    color: "#f4f4f4",
    background: "transparent"
  },
  heroSection: {
    background: "linear-gradient(120deg, #e0e0e0 0%, #bdbdbd 100%)"
  },
  heroText: {
    color: "#222"
  },
  heroSubText: {
    color: "#444"
  },
  btnPrimary: {
    background: "#444",
    color: "#fff",
    border: "2px solid #444"
  },
  btnLight: {
    background: "#f4f4f4",
    color: "#222",
    border: "2px solid #bbb"
  },
  sectionTitle: {
    color: "#222"
  },
  sectionBg: {
    background: "#f4f4f4"
  },
  iconBox: {
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  textLight: {
    color: "#222"
  }
};

const departments = [
  { name: "Neurology", icon: "neurology" },
  { name: "Eye care", icon: "eye-care" },
  { name: "Cardiac care", icon: "cardiac" },
  { name: "Heart care", icon: "heart" },
  { name: "Osteoporosis", icon: "osteoporosis" },
  { name: "ENT", icon: "ent" }
];

const Landing = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        setIsAuthenticated(true);
        setCurrentUser(JSON.parse(storedUser));
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (_) {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  }, []);

  // Load Novena CSS assets
  useEffect(() => {
    const links = [];
    const addStylesheet = (href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      links.push(link);
    };
    // Load Bootstrap (required for navbar layout/collapse) and icons/theme
    addStylesheet('/novena/plugins/bootstrap/css/bootstrap.min.css');
    addStylesheet('/novena/plugins/icofont/icofont.min.css');
    addStylesheet('/novena/css/style.css');
    addStylesheet('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600&display=swap');
    return () => {
      links.forEach((l) => document.head.removeChild(l));
    };
  }, []);

  const dashboardPath = useMemo(() => {
    const role = currentUser?.role;
    switch (role) {
      case 'Admin':
        return '/dashboard/admin';
      case 'Doctor':
        return '/dashboard/doctor';
      case 'Driver':
        return '/dashboard/driver';
      case 'Nurse':
        return '/dashboard/nurse';
      case 'ClinicStaff':
        return '/dashboard/clinic-staff';
      case 'CustomerCare':
        return '/dashboard/customer-care';
      default:
        return '/dashboard/patient';
    }
  }, [currentUser]);

  const handleNavAuthRedirect = (pathIfAuthed = dashboardPath) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(pathIfAuthed);
    setIsNavOpen(false);
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  // Counter-up animation for CTA section
  useEffect(() => {
    const counters = Array.from(document.querySelectorAll('.cta-section .counter-stat span.h3'));
    if (counters.length === 0) return;

    let hasAnimated = false;
    const durationMs = 1200;

    const animate = (el) => {
      const target = Number(el.getAttribute('data-target') || el.textContent || 0);
      const start = 0;
      const startTime = performance.now();

      const step = (now) => {
        const progress = Math.min((now - startTime) / durationMs, 1);
        const value = Math.floor(start + (target - start) * progress);
        el.textContent = String(value);
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    };

    const onIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          counters.forEach((el) => animate(el));
          observer.disconnect();
        }
      });
    };

    const observer = new IntersectionObserver(onIntersect, { threshold: 0.3 });
    const section = document.querySelector('.cta-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  // Runtime visibility check for the navbar
  useEffect(() => {
    const nav = document.getElementById('navbar');
    if (!nav) {
      console.warn('Navbar not found in DOM');
      return;
    }
    const styles = window.getComputedStyle(nav);
    const rect = nav.getBoundingClientRect();
    const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && rect.height > 0;
    console.log('Navbar visible:', isVisible, { height: rect.height, top: rect.top, zIndex: styles.zIndex });
  }, []);

  return (
    <main className="main" id="top" style={{ background: "#fff" }}>
      {/* Global/reset and desktop spacing/layout overrides */}
      <style>{`
        html, body { margin: 0; padding: 0 !important; }
        #root { padding: 0 !important; margin: 0 !important; max-width: none !important; }
        @media (min-width: 992px) {
          /* Reduce excessive vertical gaps */
          .header-top-bar { padding: 6px 0; }
          .banner .block { padding: 48px 0 96px; }
          .section { padding: 72px 0; }
          .section-sm { padding: 48px 0; }
          .cta-section { margin-bottom: 0; }

          /* Container tightening */
          .container { max-width: 1140px; }

          /* Feature/action cards: responsive wrap with gap */
          .features .feature-block { display: flex; flex-wrap: wrap; gap: 24px; }
          .features .feature-item {
            flex: 1 1 320px;
            margin: 0; /* override theme margin */
            padding: 28px 24px; /* slightly tighter */
          }

          /* Reduce oversized headings/margins for desktop density */
          .banner .block h1 { margin-bottom: 12px; }
          .banner .block .btn-container { margin-top: 8px; }
          .about .about-content .btn { margin-top: 8px; }
        }

        /* General tweaks for all sizes */
        .navbar.navigation { padding-top: 8px; padding-bottom: 8px; }
        .navbar.navigation .nav-link { padding: 6px 10px; }

        /* New lightweight navbar */
        .simple-navbar { position: sticky; top: 0; z-index: 1050; background: #0f0f10; border-bottom: 1px solid #2a2a2a; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
        .simple-nav-container { display: flex; align-items: center; justify-content: space-between; padding: 10px 18px; max-width: 1200px; margin: 0 auto; }
        .simple-brand { color: #f5f5f5; font-weight: 700; letter-spacing: .5px; text-decoration: none; font-size: 20px; }
        .simple-brand:hover, .simple-brand:focus { color: #ffffff; text-decoration: none; }
        .simple-toggler { background: transparent; border: 1px solid #3a3a3a; color: #e5e5e5; padding: 6px 10px; border-radius: 6px; display: none; transition: background .2s ease, border-color .2s ease; }
        .simple-toggler:hover { background: #1a1a1a; border-color: #555; }
        .simple-nav-links { display: flex; align-items: center; gap: 18px; }
        .simple-nav-links button { color: #e8e8e8; background: transparent; border: none; padding: 8px 4px; cursor: pointer; font-weight: 500; letter-spacing: .2px; transition: color .2s ease; }
        .simple-nav-links button:hover, .simple-nav-links button:focus { color: #ffffff; outline: none; }
        .simple-nav-links button::after { content: ""; display: block; height: 2px; background: #e5e5e5; transform: scaleX(0); transition: transform .2s ease; margin-top: 6px; }
        .simple-nav-links button:hover::after, .simple-nav-links button:focus::after { transform: scaleX(1); }
        .simple-signin { color: #fff; border: 1px solid #5a5a5a; background: #161616; padding: 6px 12px; border-radius: 20px; transition: background .2s ease, border-color .2s ease; }
        .simple-signin:hover, .simple-signin:focus { background: #1f1f1f; border-color: #777; outline: none; }
        /* Footer */
        .footer { background: #0f0f10; color: #d6d6d6; padding: 40px 16px; border-top: 1px solid #2a2a2a; margin-top: 40px; }
        .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(12, 1fr); gap: 20px; }
        .footer h5 { color: #fff; margin-bottom: 12px; font-size: 16px; }
        .footer p, .footer a, .footer li { font-size: 14px; }
        .footer a { color: #e8e8e8; text-decoration: none; }
        .footer a:hover { text-decoration: underline; color: #fff; }
        .footer .brand { grid-column: span 4; }
        .footer .links { grid-column: span 3; }
        .footer .services { grid-column: span 3; }
        .footer .newsletter { grid-column: span 2; }
        .footer .newsletter input { width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #3a3a3a; background: #151515; color: #fff; margin-bottom: 8px; }
        .footer .newsletter button { width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #3a3a3a; background: #1b1b1b; color: #fff; cursor: pointer; }
        .footer .newsletter button:hover { background: #222; }
        .footer-bottom { border-top: 1px solid #2a2a2a; margin-top: 24px; padding-top: 16px; text-align: center; color: #bdbdbd; font-size: 13px; }
        @media (max-width: 991px) { .footer .brand, .footer .links, .footer .services, .footer .newsletter { grid-column: span 12; } }
      `}</style>
      {/* Novena header top bar */}
      <div className="header-top-bar">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <ul className="top-bar-info list-inline-item pl-0 mb-0">
                <li className="list-inline-item"><a href="mailto:support.weheal@gmail.com"><i className="icofont-support-faq mr-2"></i>support.weheal@gmail.com</a></li>
                <li className="list-inline-item"><i className="icofont-location-pin mr-2"></i>Merul Badda, Dhaka, Bangladesh</li>
              </ul>
            </div>
            <div className="col-lg-6">
              <div className="text-lg-right top-right-bar mt-2 mt-lg-0">
                <a href="tel:+23-345-67890" >
                  <span>Call Now : </span>
                  <span className="h4">823-4565-13456</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* New lightweight navbar */}
      <nav id="navbar" className="simple-navbar">
        <div className="simple-nav-container">
          <a href="#top" className="simple-brand" onClick={(e) => { e.preventDefault(); handleNavAuthRedirect(); }}>WeHeal</a>
          <button className="simple-toggler" onClick={() => setIsNavOpen((v) => !v)} aria-label="Toggle navigation">Menu</button>
          <div className={`simple-nav-links ${isNavOpen ? 'open' : ''}`}>
            <button onClick={() => handleNavAuthRedirect()}>Home</button>
            <button onClick={() => handleNavAuthRedirect()}>About Us</button>
            <button onClick={() => handleNavAuthRedirect()}>Set Appointment</button>
            <button onClick={() => handleNavAuthRedirect('/emergency')}>Emergency</button>
            <button onClick={() => handleNavAuthRedirect()}>Contact</button>
            {isAuthenticated ? (
              <button onClick={() => handleNavAuthRedirect()} style={{ padding: 0 }}>
                <img src={currentUser?.profilePicture || '/img/default-avatar.png'} alt={currentUser?.name || 'User'} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
              </button>
            ) : (
              <button className="simple-signin" onClick={() => { handleSignIn(); setIsNavOpen(false); }}>Sign In</button>
            )}
          </div>
        </div>
      </nav>
      {/* Banner */}
      <section className="banner">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-12 col-xl-7">
              <div className="block">
                <div className="divider mb-3"></div>
                <span className="text-uppercase text-sm letter-spacing ">Total Health care solution</span>
                <h1 className="mb-3 mt-3">Your most trusted health partner</h1>
                <p className="mb-4 pr-5" style={{ fontFamily: 'Noto Sans Bengali, sans-serif' }}>
                  আপনার প্রয়োজনের সময়ে, যে কোনো জায়গা থেকে বিশ্বস্ত স্বাস্থ্যসেবা।
                  অনলাইনে সহজেই পরামর্শ নিন, জরুরি সহায়তা পান, আর রিপোর্ট দেখুন — নিরাপদে ও দ্রুত।
                </p>
                <div className="btn-container ">
                  <button className="btn btn-main-2 btn-icon btn-round-full" onClick={() => handleNavAuthRedirect()}>Make appointment <i className="icofont-simple-right ml-2"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="feature-block d-lg-flex">
                <div className="feature-item mb-5 mb-lg-0">
                  <div className="feature-icon mb-4"><i className="icofont-surgeon-alt"></i></div>
                  <span>24 Hours Service</span>
                  <h4 className="mb-3">Online Appointment</h4>
                  <p className="mb-4">Get all time support for emergency. We have introduced the principle of family medicine.</p>
                  <button className="btn btn-main btn-round-full" onClick={() => handleNavAuthRedirect()}>Make a appointment</button>
                </div>
                <div className="feature-item mb-5 mb-lg-0">
                  <div className="feature-icon mb-4"><i className="icofont-ui-clock"></i></div>
                  <span>Timing schedule</span>
                  <h4 className="mb-3">Working Hours</h4>
                  <ul className="w-hours list-unstyled">
                    <li className="d-flex justify-content-between">Sun - Wed : <span>8:00 - 17:00</span></li>
                    <li className="d-flex justify-content-between">Thu - Fri : <span>9:00 - 17:00</span></li>
                    <li className="d-flex justify-content-between">Sat - sun : <span>10:00 - 17:00</span></li>
                  </ul>
                </div>
                <div className="feature-item mb-5 mb-lg-0">
                  <div className="feature-icon mb-4"><i className="icofont-support"></i></div>
                  <span>Emergency Cases</span>
                  <h4 className="mb-3">1-800-700-6200</h4>
                  <p>Get all time support for emergency. Get connected with us for any urgency.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section about">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-4 col-sm-6">
              <div className="about-img">
                <img src="/novena/images/about/img-1.jpg" alt="" className="img-fluid" />
                <img src="/novena/images/about/img-2.jpg" alt="" className="img-fluid mt-4" />
              </div>
            </div>
            <div className="col-lg-4 col-sm-6">
              <div className="about-img mt-4 mt-lg-0">
                <img src="/novena/images/about/img-3.jpg" alt="" className="img-fluid" />
              </div>
            </div>
            <div className="col-lg-4">
              <div className="about-content pl-4 mt-4 mt-lg-0">
                <h2 className="title-color">Personal care <br/> & healthy living</h2>
                <p className="mt-4 mb-5">We provide best leading medical service Nulla perferendis veniam deleniti ipsum officia dolores repellat laudantium obcaecati neque.</p>
                <button className="btn btn-main-2 btn-round-full btn-icon" onClick={() => handleNavAuthRedirect()}>Services<i className="icofont-simple-right ml-3"></i></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA counters */}
      <section className="cta-section ">
        <div className="container">
          <div className="cta position-relative">
            <div className="row">
              <div className="col-lg-3 col-md-6 col-sm-6">
                <div className="counter-stat">
                  <i className="icofont-doctor"></i>
                  <span className="h3" data-target="58">58</span>k
                  <p>Happy People</p>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-6">
                <div className="counter-stat">
                  <i className="icofont-flag"></i>
                  <span className="h3" data-target="700">700</span>+
                  <p>Surgery Comepleted</p>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-6">
                <div className="counter-stat">
                  <i className="icofont-badge"></i>
                  <span className="h3" data-target="40">40</span>+
                  <p>Expert Doctors</p>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-6">
                <div className="counter-stat">
                  <i className="icofont-globe"></i>
                  <span className="h3" data-target="20">20</span>
                  <p>Worldwide Branch</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="brand">
            <h5>WeHeal</h5>
            <p>Trusted healthcare, whenever you need it. Book consultations, request emergency services, and access reports securely from anywhere.</p>
            <p>Email: <a href="mailto:support.weheal@gmail.com">support.weheal@gmail.com</a><br/>Address: Merul Badda, Dhaka, Bangladesh<br/>Call: <a href="tel:+23-345-67890">+23-345-67890</a></p>
          </div>
          <div className="links">
            <h5>Quick Links</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li><a href="#top" onClick={(e) => { e.preventDefault(); handleNavAuthRedirect(); }}>Home</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); handleNavAuthRedirect(); }}>About Us</a></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); handleNavAuthRedirect(); }}>Services</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); handleNavAuthRedirect(); }}>Contact</a></li>
            </ul>
          </div>
          <div className="services">
            <h5>Services</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li><a href="#consult" onClick={(e) => { e.preventDefault(); handleNavAuthRedirect(); }}>Online Consultation</a></li>
              <li><a href="#emg" onClick={(e) => { e.preventDefault(); handleNavAuthRedirect('/emergency'); }}>Emergency Support</a></li>
              <li><a href="#labs" onClick={(e) => { e.preventDefault(); handleNavAuthRedirect(); }}>Lab Tests</a></li>
              <li><a href="#market" onClick={(e) => { e.preventDefault(); handleNavAuthRedirect(); }}>Marketplace</a></li>
            </ul>
          </div>
          <div className="newsletter">
            <h5>Newsletter</h5>
            <input type="email" placeholder="Your email" aria-label="Email address" />
            <button type="button" onClick={() => alert('Thanks for subscribing!')}>Subscribe</button>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} WeHeal. All rights reserved.</div>
      </footer>
    </main>
  );
};

export default Landing;
