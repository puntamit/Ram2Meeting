import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    LayoutDashboard,
    DoorOpen,
    CalendarCheck,
    Settings as SettingsIcon,
    LogOut,
    Menu,
    X,
    User as UserIcon,
    ChevronRight,
    Users,
    Key,
    ShieldAlert
} from 'lucide-react'
import { useState, useEffect } from 'react'
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
    const [showFirstLoginModal, setShowFirstLoginModal] = useState(false)
    const [updatePasswordData, setUpdatePasswordData] = useState({ new: '', confirm: '', loading: false, error: null, success: false })

    const { updatePassword, dismissFirstLogin } = useAuth()

    useEffect(() => {
        if (profile?.must_change_password) {
            setShowFirstLoginModal(true)
        }
    }, [profile])

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (updatePasswordData.new !== updatePasswordData.confirm) {
            setUpdatePasswordData({ ...updatePasswordData, error: 'รหัสผ่านไม่ตรงกัน' })
            return
        }
        if (updatePasswordData.new.length < 6) {
            setUpdatePasswordData({ ...updatePasswordData, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
            return
        }

        setUpdatePasswordData({ ...updatePasswordData, loading: true, error: null })
        try {
            const { error } = await updatePassword(updatePasswordData.new)
            if (error) throw error

            // After success, also dismiss the flag
            await dismissFirstLogin()
            setUpdatePasswordData({ ...updatePasswordData, success: true, loading: false })

            // Auto close after 2 seconds
            setTimeout(() => {
                setShowFirstLoginModal(false)
            }, 2000)
        } catch (error) {
            setUpdatePasswordData({ ...updatePasswordData, error: error.message, loading: false })
        }
    }

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
        { to: '/bookings', icon: CalendarCheck, label: 'ประวัติการจองของฉัน' },
    ]

    const adminItems = [
        { to: '/admin/rooms', icon: SettingsIcon, label: 'จัดการห้องประชุม' },
        { to: '/admin/users', icon: Users, label: 'จัดการสมาชิก' },
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

            {/* First Login Modal */}
            {showFirstLoginModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        {!updatePasswordData.success ? (
                            <div className="p-8">
                                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <ShieldAlert size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">บังคับเปลี่ยนรหัสผ่าน</h3>
                                <p className="text-slate-500 text-center mb-8">เพื่อความปลอดภัยอย่างสูงสุด สมาชิกทุกคนที่เข้าใช้งานครั้งแรกจำเป็นต้องตั้งรหัสผ่านใหม่เพื่อความเป็นส่วนตัวครับ</p>

                                {!updatePasswordData.showForm ? (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setUpdatePasswordData({ ...updatePasswordData, showForm: true })}
                                            className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 flex items-center justify-center gap-2"
                                        >
                                            <Key size={20} />
                                            ตั้งรหัสผ่านใหม่ทันที
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        {updatePasswordData.error && (
                                            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold animate-shake">
                                                {updatePasswordData.error}
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">รหัสผ่านใหม่</label>
                                            <input
                                                required
                                                type="password"
                                                autoFocus
                                                placeholder="อย่างน้อย 6 ตัวอักษร"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none font-mono"
                                                value={updatePasswordData.new}
                                                onChange={(e) => setUpdatePasswordData({ ...updatePasswordData, new: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">ยืนยันรหัสผ่านใหม่</label>
                                            <input
                                                required
                                                type="password"
                                                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none font-mono"
                                                value={updatePasswordData.confirm}
                                                onChange={(e) => setUpdatePasswordData({ ...updatePasswordData, confirm: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setUpdatePasswordData({ ...updatePasswordData, showForm: false })}
                                                className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all"
                                            >
                                                ย้อนกลับ
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={updatePasswordData.loading}
                                                className="flex-[2] py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 flex items-center justify-center gap-2"
                                            >
                                                {updatePasswordData.loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'บันทึกรหัสใหม่'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <div className="p-12 text-center animate-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-10 h-10">
                                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">เปลี่ยนสำเร็จ!</h3>
                                <p className="text-slate-500">ใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งหน้าได้เลยครับ</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
