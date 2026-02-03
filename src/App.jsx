import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Bookings from './pages/Bookings'
import AdminRooms from './pages/AdminRooms'
import AdminLogs from './pages/AdminLogs'
import AdminUsers from './pages/AdminUsers'

function ProtectedRoute({ children, adminOnly = false }) {
    const { user, profile, loading, isAdmin } = useAuth()

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
    )

    if (!user) return <Navigate to="/login" />
    if (adminOnly && !isAdmin) return <Navigate to="/" />

    return children
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Dashboard />} />
                        <Route path="rooms" element={<Rooms />} />
                        <Route path="bookings" element={<Bookings />} />

                        {/* Admin Routes */}
                        <Route path="admin/rooms" element={<ProtectedRoute adminOnly><AdminRooms /></ProtectedRoute>} />
                        <Route path="admin/logs" element={<ProtectedRoute adminOnly><AdminLogs /></ProtectedRoute>} />
                        <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    )
}

export default App
