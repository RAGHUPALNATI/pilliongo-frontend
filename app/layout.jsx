import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';

export const metadata = {
  title: 'PillionGo | Smart Bike & Car Ride Sharing',
  description: 'Skip crowded autos — travel comfortably on bikes and cars. Share your ride, split the cost, and reach your destination fast.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-brand-bg text-brand-navy">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Toast />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
