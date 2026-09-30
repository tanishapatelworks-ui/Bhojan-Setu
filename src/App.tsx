import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { FindFoodPage } from '@/pages/FindFoodPage';
import { DonateFoodPage } from '@/pages/DonateFoodPage';
import { RescueMapPage } from '@/pages/RescueMapPage';
import { VolunteerPage } from '@/pages/VolunteerPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ImpactPage } from '@/pages/ImpactPage';
import { AuthPage } from '@/pages/AuthPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/find-food" element={<FindFoodPage />} />
                  <Route
                    path="/donate-food"
                    element={
                      <ProtectedRoute>
                        <DonateFoodPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/rescue-map" element={<RescueMapPage />} />
                  <Route
                    path="/volunteer"
                    element={
                      <ProtectedRoute>
                        <VolunteerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/impact" element={<ImpactPage />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
