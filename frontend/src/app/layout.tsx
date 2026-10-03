import './globals.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata = {
  title: 'ScholarMind AI — Intelligent Book Chapter Research & Authoring Agent',
  description: 'Grounded academic book chapter research, synthesis, and publishing platform.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col md:flex-row bg-[#fbfbf9] text-slate-800 antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </body>
    </html>
  );
}
