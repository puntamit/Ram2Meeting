import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    LayoutDashboard,
    DoorOpen,
    CalendarCheck,
    Settings as SettingsIcon,
    History,
    LogOut,
    Menu,
    X,
    User as UserIcon
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import ConfirmModal from './ConfirmModal'

function cn(...inputs) {
    return twMerge(clsx(inputs))
}

const NavItem = ({ to, icon: Icon, label, active }) => (
    <Link
        to={to}
        className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            active
                ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                : "text-slate-600 hover:bg-slate-100"
        )}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </Link>
)

export default function Layout() {
    const { profile, signOut, isAdmin } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    const handleSignOut = async () => {
        setShowLogoutConfirm(true)
    }

    const confirmSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const menuItems = [
        { to: '/', icon: LayoutDashboard, label: 'แดชบอร์ด' },
        { to: '/rooms', icon: DoorOpen, label: 'ห้องประชุม' },
        { to: '/bookings', icon: CalendarCheck, label: 'ประวัติการจอง' },
    ]

    const adminItems = [
        { to: '/admin/rooms', icon: SettingsIcon, label: 'จัดการห้องประชุม' },
        { to: '/admin/logs', icon: History, label: 'ประวัติการใช้งาน (Logs)' },
    ]

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Mobile Menu Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6">
                        <div className="flex flex-col items-center gap-2">
                            <img
                                src="/images/Ram2Logo.png"
                                alt="Ram2 Logo"
                                className="h-24 w-auto object-contain bg-white p-2 rounded-lg"
                            />
                            <p className="text-sm text-slate-400 font-bold tracking-widest uppercase">RAM2 MEETING  SERVICE</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1">
                        <div className="mb-4">
                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">WORKSPACE</p>
                            {menuItems.map(item => (
                                <NavItem
                                    key={item.to}
                                    {...item}
                                    active={location.pathname === item.to}
                                />
                            ))}
                        </div>

                        {isAdmin && (
                            <div className="mb-4 pt-4 border-t border-slate-100">
                                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">ADMINISTRATION</p>
                                {adminItems.map(item => (
                                    <NavItem
                                        key={item.to}
                                        {...item}
                                        active={location.pathname === item.to}
                                    />
                                ))}
                            </div>
                        )}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl mb-4">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                                <UserIcon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                                <p className="text-xs text-slate-500 truncate">{profile?.department || 'Member'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors group"
                        >
                            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                            <span className="font-medium">ออกจากระบบ</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
                    <button
                        className="p-2 text-slate-600 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="hidden lg:block">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {location.pathname === '/' && 'ยินดีต้อนรับกลับมา!'}
                            {location.pathname === '/rooms' && 'ห้องประชุมที่ว่าง'}
                            {location.pathname === '/bookings' && 'กำหนดการประชุมของคุณ'}
                            {location.pathname.startsWith('/admin') && 'ส่วนผู้ดูแลระบบ'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-100">
                            {isAdmin ? 'ผู้ดูแลระบบ' : 'พนักงานทั่วไป'}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={confirmSignOut}
                title="ยืนยันการออกจากระบบ"
                message="คุณต้องการออกจากระบบใช่หรือไม่? ข้อมูลการจองที่คุณทำค้างไว้อาจไม่ถูกบันทึก"
                confirmText="ออกจากระบบ"
                type="danger"
            />
        </div>
    )
}
