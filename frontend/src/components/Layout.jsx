import { Outlet } from "react-router-dom";
import Footer from "./Footer.jsx";
import HeaderNav from "./HeaderNav.jsx";
import TopBanner from "./TopBanner.jsx";

export default function Layout() {
  return (
    <>
      <TopBanner />
      <HeaderNav />
      <Outlet />
      <Footer />
    </>
  );
}

