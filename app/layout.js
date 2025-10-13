'use client'

import { Inter } from 'next/font/google'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ToastContainer } from 'react-toastify'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-toastify/dist/ReactToastify.css'
import './globals.css'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgilerini al
    // Hydration hatasını önlemek için client-side kontrolü
    if (typeof window !== 'undefined') {
      try {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        
        if (savedToken && savedUser) {
          const userData = JSON.parse(savedUser);
          setToken(savedToken)
          setUser(userData)
        }
      } catch (error) {
        console.error('localStorage hatası:', error)
      }
    }
    setLoading(false)
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      setToken(null)
      
      // Sayfayı yenile ve login'e yönlendir
      window.location.href = '/login'
    }
  }

  // Login sayfası için özel layout
  if (pathname === '/login') {
    return (
      <html lang="tr">
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Browser extension'larından gelen HTML değişikliklerini görmezden gel
                if (typeof window !== 'undefined') {
                  const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                      if (mutation.type === 'attributes' && 
                          mutation.attributeName === 'inject_vt_svd') {
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
          />
        </body>
      </html>
    )
  }

  // Admin sayfası için yetki kontrolü
  if (pathname === '/admin' && user?.rol !== 'admin') {
    router.push('/dashboard')
    return null
  }

  return (
    <html lang="tr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Browser extension'larından gelen HTML değişikliklerini görmezden gel
              if (typeof window !== 'undefined') {
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && 
                        mutation.attributeName === 'inject_vt_svd') {
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
        {user ? (
          <>
            <Navbar 
              onToggleSidebar={toggleSidebar} 
              user={user} 
              onLogout={handleLogout}
              onToggleMobileSidebar={() => setSidebarMobileOpen(!sidebarMobileOpen)}
            />
            <div className="d-flex">
              <Sidebar 
                collapsed={sidebarCollapsed} 
                user={user}
                mobileOpen={sidebarMobileOpen}
                onMobileClose={() => setSidebarMobileOpen(false)}
              />
              <div
                className={`main-content flex-grow-1 ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
              >
                {children}
              </div>
            </div>
            {/* Mobile sidebar overlay */}
            {sidebarMobileOpen && (
              <div 
                className="d-md-none position-fixed w-100 h-100 bg-dark"
                style={{ 
                  top: 0, 
                  left: 0, 
                  zIndex: 999, 
                  opacity: 0.5 
                }}
                onClick={() => setSidebarMobileOpen(false)}
              />
            )}
          </>
        ) : (
          children
        )}
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
        />
      </body>
    </html>
  )
}
