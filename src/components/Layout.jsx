import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Chatbot from './Chatbot';

export default function Layout() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main role="main" className="pb-0">
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </>
  );
}

