import StudentNavbar from '../components/StudentNavbar';
import Footer from '../components/Footer';
import { Outlet } from 'react-router-dom';

const StudentLayout = () => (
  <div className="flex flex-col min-h-screen w-full">
    <StudentNavbar />
    <main className="flex-grow w-full p-4 bg-gray-900 text-white">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default StudentLayout;