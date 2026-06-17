// src/components/Layout.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './common/Navbar';
import Footer from './common/Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Pages where we DON'T want Navbar and Footer
  const hideNavFooter = ['/login', '/register'];
  const showNavFooter = !hideNavFooter.includes(location.pathname);
  
  // Pages where we want Navbar but NO Footer
  const hideFooterOnly = ['/chat', '/admin'];
  const showFooter = !hideFooterOnly.includes(location.pathname);

  return (
    <>
      {showNavFooter && <Navbar />}
      {children}
      {showNavFooter && showFooter && <Footer />}
    </>
  );
};

export default Layout;