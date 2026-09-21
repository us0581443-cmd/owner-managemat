import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'NEST — Property Management Executive Dashboard',
  description: 'Executive Property Management & Rent Collection Portal for Apartment Owners',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
