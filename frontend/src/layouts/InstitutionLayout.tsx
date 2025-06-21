import InstitutionNavbar from '../components/InstitutionNavbar';
import Footer from '../components/Footer';
import { Outlet } from 'react-router-dom';

const InstitutionLayout = () => (
  <div className="flex flex-col min-h-screen w-full">
    <InstitutionNavbar />
    <main className="flex-grow w-full p-4 bg-gray-900 text-white">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default InstitutionLayout;