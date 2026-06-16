import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { PaymentProvider } from './context/PaymentContext';
import { ProfileProvider } from './context/ProfileContext';
import AppRoutes from './routes/AppRoutes';
import Footer from './components/common/Footer';
import './styles/global.css';
import './styles/navbar.css';
import './styles/chat.css';
import './styles/payment.css';
import './styles/footer.css';
import './styles/responsive.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <ProfileProvider>
              <PaymentProvider>
                <ChatProvider>
                  <div className="app-wrapper">
                    <AppRoutes />
                    <Footer />
                  </div>
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                    }}
                  />
                </ChatProvider>
              </PaymentProvider>
            </ProfileProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;