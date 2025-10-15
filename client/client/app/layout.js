'use client';

import { Inter } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CoreTrack V3 - Depo Yönetim Sistemi',
  description: 'CoreTrack V3 S.A Corporation - Depo Yönetim Sistemi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Browser extension interference'ı engelle
              if (typeof window !== 'undefined') {
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'inject_vt_svd') {
                      mutation.target.removeAttribute('inject_vt_svd');
                    }
                  });
                });
                observer.observe(document.documentElement, {
                  attributes: true,
                  attributeFilter: ['inject_vt_svd']
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}
