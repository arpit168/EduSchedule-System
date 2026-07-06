import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/useAuthStore';
import useThemeStore from './store/useThemeStore';

// Layouts & Guards
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Auth Pages (Lazy Loaded)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegistrationPage = lazy(() => import('./pages/auth/RegistrationPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Main Application Pages (Lazy Loaded)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TimetableBuilderPage = lazy(() => import('./pages/timetable/TimetableBuilderPage'));
const TeacherViewPage = lazy(() => import('./pages/TeacherViewPage'));
const ClassTimetablePage = lazy(() => import('./pages/ClassTimetablePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const TeachersPage = lazy(() => import('./pages/TeachersPage'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const AssignmentsPage = lazy(() => import('./pages/AssignmentsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400 animate-pulse">
            Loading Learning Timetable OS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#fff',
              borderRadius: '1rem',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: '13px',
              fontWeight: '600',
            },
          }}
        />

        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-600/30" />
                <p className="text-xs font-bold text-slate-400 animate-pulse">Loading Application...</p>
              </div>
            </div>
          }
        >
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/" replace /> : <RegistrationPage />}
            />
            <Route
              path="/forgot-password"
              element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
            />
            <Route
              path="/reset-password/:token"
              element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />}
            />

            {/* Protected Dashboard Layout Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/timetable" element={<TimetableBuilderPage />} />
                <Route path="/my-schedule" element={<TeacherViewPage />} />
                <Route path="/my-timetable" element={<TeacherViewPage />} />
                <Route path="/class-schedule" element={<ClassTimetablePage />} />
                <Route path="/class-timetable" element={<ClassTimetablePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/teachers" element={<TeachersPage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/departments" element={<DepartmentsPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />

                <Route element={<RoleRoute allowedRoles={['Admin']} />}>
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* 404 Not Found & Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
