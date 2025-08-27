import React from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <main className="main" id="top">
      <nav className="navbar navbar-expand-lg navbar-light fixed-top py-3 d-block" data-navbar-on-scroll="data-navbar-on-scroll" style={{backgroundColor: '#0f172a'}}>
        <div className="container">
          <a className="navbar-brand" href="#!" style={{color: 'white'}}>
            <img src="/img/logo.png" width="118" alt="logo" />
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" style={{backgroundColor: 'white'}}> </span>
          </button>
          <div className="collapse navbar-collapse border-top border-lg-0 mt-4 mt-lg-0" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto pt-2 pt-lg-0 font-base">
              <li className="nav-item px-2"><a className="nav-link" aria-current="page" href="#about" style={{color: 'white'}}>About Us</a></li>
              <li className="nav-item px-2"><a className="nav-link" href="#departments" style={{color: 'white'}}>Departments</a></li>
              <li className="nav-item px-2"><a className="nav-link" href="#findUs" style={{color: 'white'}}>Membership</a></li>
              <li className="nav-item px-2"><a className="nav-link" href="#findUs" style={{color: 'white'}}>Help </a></li>
              <li className="nav-item px-2"><a className="nav-link" href="#findUs" style={{color: 'white'}}>Contact</a></li>
            </ul>
            <button className="btn btn-sm btn-outline-primary rounded-pill order-1 order-lg-0 ms-lg-4" onClick={handleSignIn}>Sign In</button>
          </div>
        </div>
      </nav>
      
      <section className="py-xxl-10 pb-0" id="home">
        <div className="bg-holder bg-size" style={{backgroundImage: 'url(/img/hero-bg.png)', backgroundPosition: 'top center', backgroundSize: 'cover'}}>
        </div>
        {/*/.bg-holder*/}

        <div className="container">
          <div className="row min-vh-xl-100 min-vh-xxl-25">
            <div className="col-md-5 col-xl-6 col-xxl-7 order-0 order-md-1 text-end">
              <img className="pt-7 pt-md-0 w-100" src="/img/hero.png" alt="hero-header" />
            </div>
            <div className="col-md-75 col-xl-6 col-xxl-5 text-md-start text-center py-6">
              <h1 className="fw-light font-base fs-6 fs-xxl-7">We're <strong>determined </strong>for<br />your&nbsp;<strong>better life.</strong></h1>
              <p className="fs-1 mb-5">You can get the care you need 24/7 – be it online or in <br />person. You will be treated by caring specialist doctors. </p>
              <button className="btn btn-lg btn-primary rounded-pill" onClick={handleSignUp} role="button">Make an Appointment</button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================*/}
      {/* <section> begin ============================*/}
      <section className="py-5" id="departments">
        <div className="container">
          <div className="row">
            <div className="col-12 py-3">
              <div className="bg-holder bg-size" style={{backgroundImage: 'url(/img/bg-departments.png)', backgroundPosition: 'top center', backgroundSize: 'contain'}}>
              </div>
              {/*/.bg-holder*/}
              <h1 className="text-center">OUR DEPARTMENTS</h1>
            </div>
          </div>
        </div>
        {/* end of .container*/}
      </section>
      {/* <section> close ============================*/}
      {/* ============================================*/}

      <section className="py-0">
        <div className="container">
          <div className="row py-5 align-items-center justify-content-center justify-content-lg-evenly">
            <div className="col-auto col-md-4 col-lg-auto text-xl-start">
              <div className="d-flex flex-column align-items-center">
                <div className="icon-box text-center">
                  <a className="text-decoration-none" href="#!">
                    <img className="mb-3 deparment-icon" src="/img/icons/neurology.png" alt="..." />
                    <img className="mb-3 deparment-icon-hover" src="/img/icons/neurology.svg" alt="..." />
                    <p className="fs-1 fs-xxl-2 text-center">Neurology</p>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-auto col-md-4 col-lg-auto text-xl-start">
              <div className="d-flex flex-column align-items-center">
                <div className="icon-box text-center">
                  <a className="text-decoration-none" href="#!">
                    <img className="mb-3 deparment-icon" src="/img/icons/eye-care.png" alt="..." />
                    <img className="mb-3 deparment-icon-hover" src="/img/icons/eye-care.svg" alt="..." />
                    <p className="fs-1 fs-xxl-2 text-center">Eye care</p>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-auto col-md-4 col-lg-auto text-xl-start">
              <div className="d-flex flex-column align-items-center">
                <div className="icon-box text-center">
                  <a className="text-decoration-none" href="#!">
                    <img className="mb-3 deparment-icon" src="/img/icons/cardiac.png" alt="..." />
                    <img className="mb-3 deparment-icon-hover" src="/img/icons/cardiac.svg" alt="..." />
                    <p className="fs-1 fs-xxl-2 text-center">Cardiac care</p>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-auto col-md-4 col-lg-auto text-xl-start">
              <div className="d-flex flex-column align-items-center">
                <div className="icon-box text-center">
                  <a className="text-decoration-none" href="#!">
                    <img className="mb-3 deparment-icon" src="/img/icons/heart.png" alt="..." />
                    <img className="mb-3 deparment-icon-hover" src="/img/icons/heart.svg" alt="..." />
                    <p className="fs-1 fs-xxl-2 text-center">Heart care</p>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-auto col-md-4 col-lg-auto text-xl-start">
              <div className="d-flex flex-column align-items-center">
                <div className="icon-box text-center">
                  <a className="text-decoration-none" href="#!">
                    <img className="mb-3 deparment-icon" src="/img/icons/osteoporosis.png" alt="..." />
                    <img className="mb-3 deparment-icon-hover" src="/img/icons/osteoporosis.svg" alt="..." />
                    <p className="fs-1 fs-xxl-2 text-center">Osteoporosis</p>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-auto col-md-4 col-lg-auto text-xl-start">
              <div className="d-flex flex-column align-items-center">
                <div className="icon-box text-center">
                  <a className="text-decoration-none" href="#!">
                    <img className="mb-3 deparment-icon" src="/img/icons/ent.png" alt="..." />
                    <img className="mb-3 deparment-icon-hover" src="/img/icons/ent.svg" alt="..." />
                    <p className="fs-1 fs-xxl-2 text-center">ENT</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* end of .container*/}
      </section>

      <section className="bg-secondary">
        <div className="bg-holder" style={{backgroundImage: 'url(/img/bg-eye-care.png)', backgroundPosition: 'center', backgroundSize: 'contain'}}>
        </div>
        {/*/.bg-holder*/}

        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-5 col-xxl-6">
              <img className="img-fluid" src="/img/eye-care.png" alt="..." />
            </div>
            <div className="col-md-7 col-xxl-6 text-center text-md-start">
              <h2 className="fw-bold text-light mb-4 mt-4 mt-lg-0">Eye Care with Top Professionals<br className="d-none d-sm-block" />and In Budget.</h2>
              <p className="text-light">We've built a healthcare system that puts your needs first.<br className="d-none d-sm-block" />For us, there is nothing more important than the health of <br className="d-none d-sm-block" />you and your loved ones. </p>
              <div className="py-3">
                <button className="btn btn-lg btn-light rounded-pill" onClick={handleSignUp} role="button">Learn more </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================*/}
      {/* <section> begin ============================*/}
      <section className="pb-0" id="about">
        <div className="container">
          <div className="row">
            <div className="col-12 py-3">
              <div className="bg-holder bg-size" style={{backgroundImage: 'url(/img/about-us.png)', backgroundPosition: 'top center', backgroundSize: 'contain'}}>
              </div>
              {/*/.bg-holder*/}
              <h1 className="text-center">ABOUT US</h1>
            </div>
          </div>
        </div>
        {/* end of .container*/}
      </section>
      {/* <section> close ============================*/}
      {/* ============================================*/}

      <section className="py-5">
        <div className="bg-holder bg-size" style={{backgroundImage: 'url(/img/about-bg.png)', backgroundPosition: 'top center', backgroundSize: 'contain'}}>
        </div>
        {/*/.bg-holder*/}

        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 col-xxl-5 text-center text-md-start">
              <h2 className="fw-bold mb-4">We're setting Standards in Research what's more, Clinical Care.</h2>
              <p className="mb-4">We've built a healthcare system that puts your needs first. For us, there is nothing more important than the health of you and your loved ones. We've built a healthcare system that puts your needs first. For us, there is nothing more important than the health of you and your loved ones.</p>
              <div className="py-3">
                <button className="btn btn-lg btn-primary rounded-pill" onClick={handleSignUp} role="button">Learn more </button>
              </div>
            </div>
            <div className="col-md-6 col-xxl-7 text-center">
              <img className="img-fluid" src="/img/about-us.png" alt="..." />
            </div>
          </div>
        </div>
        {/* end of .container*/}
      </section>
    </main>
  );
};

export default Landing;
