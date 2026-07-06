import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import PartnerRegister from './pages/PartnerRegister';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import CookiePolicy from './pages/CookiePolicy';
import CancellationPolicy from './pages/CancellationPolicy';
import RefundPolicy from './pages/RefundPolicy';
import HelpCenter from './pages/HelpCenter';
import CategoryListing from './pages/Services/CategoryListing';
import ServiceListing from './pages/Services/ServiceListing';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout/Checkout';
import BookingConfirmed from './pages/Checkout/BookingConfirmed';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/become-a-partner" element={<PartnerRegister />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/cancellation" element={<CancellationPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/services" element={<CategoryListing />} />
        <Route path="/services/:categoryId" element={<ServiceListing />} />
        <Route path="/search" element={<ServiceListing />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/booking-confirmed/:bookingId" element={<BookingConfirmed />} />
      </Routes>
      <Footer />
    </>
  );
}
