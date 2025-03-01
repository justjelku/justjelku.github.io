import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import WelcomePage from './WelcomePage';
import Sidebarss from './navigation/sidebars';
import ManageUserTabContent from './contents/ManageUser';

const SuperAdminRootPage = () => {
  const [isMobileView, setIsMobileView] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Function to check if the current view is mobile
    const checkMobileView = () => {
      const mobileView = window.innerWidth <= 1000;
      setIsMobileView(mobileView);
    };

    // Initial check when the component mounts
    checkMobileView();

    // Listen for window resize events to update the view
    window.addEventListener('resize', checkMobileView);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);


  useEffect(() => {
    // Function to check if the page is scrolled
    const checkScroll = () => {
      const scrolled = window.pageYOffset > 0;
      setIsScrolled(scrolled);
    };

    // Listen for scroll events to update the view
    window.addEventListener('scroll', checkScroll);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('scroll', checkScroll);
    };
  }, []);

  return (
    <div className='container'>
      {/* <NavBar /> */}
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-3">
            <div className="col-md-3 fixed-top">
              <Sidebarss />
            </div>
          </div>
          <div className="col-md-8">
            <Routes>
              <Route path="/home" component={<WelcomePage />} element={<WelcomePage />} />
              <Route path="/manageuser" component={<ManageUserTabContent />} element={<ManageUserTabContent />} />
              {/* <Route path="/inventory" component={<HomeTabContent />} element={<HomeTabContent />} />
              <Route path="/profile" component={<ProfileTabContent />} element={<ProfileTabContent />} />
              <Route path="/stocks" component={<ProductTabContent />} element={<ProductTabContent />} />
              <Route path="/customer" component={<CustomerTabContent />} element={<CustomerTabContent />} />
              <Route path="/supplier" component={<SupplierTabContent />} element={<SupplierTabContent />} />
              <Route path="/branch" component={<BranchTabContent />} element={<BranchTabContent />} /> */}
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminRootPage;
