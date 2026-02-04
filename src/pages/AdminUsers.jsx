import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'
import {
    Users as UsersIcon,
    UserPlus,
    Search,
    Mail,
    Building2,
    Phone,
    Shield,
    Trash2,
    Loader2,
    X,
    CheckCircle2,
    AlertCircle,
    UserCircle,
    Key
} from 'lucide-react'
import { cn } from '../lib/utils'

// Helper to create a secondary Supabase client that doesn't persist session
// This allows Admin to sign up new users without being logged out
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        department: '',
        phone: '',
        role: 'user'
    })

    const [resettingUser, setResettingUser] = useState(null)
    const [newPassword, setNewPassword] = useState('')
    const [resetting, setResetting] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name')

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddUser = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        setSuccess(null)

        try {
            // Create secondary client to avoid logging out the current admin
            const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            })

            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        department: formData.department,
                        phone: formData.phone,
                        role: formData.role
                    }
                }
            })

            if (authError) throw authError

            setSuccess(`เพิ่มสมาชิก ${formData.fullName} เรียบร้อยแล้ว`)
            setFormData({
                fullName: '',
                email: '',
                password: '',
                department: '',
                phone: '',
                role: 'user'
            })
            setShowAddModal(false)
            fetchUsers()
        } catch (error) {
            console.error('Error adding user:', error)
            setError(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!resettingUser || !newPassword) return

        setResetting(true)
        setError(null)
        setSuccess(null)

        try {
            const { data, error } = await supabase.functions.invoke('admin-change-password', {
                body: {
                    userId: resettingUser.id,
                    newPassword: newPassword
                }
            })

            if (error) throw error
            if (data.error) throw new Error(data.error)

            setSuccess(`เปลี่ยนรหัสผ่านให้ ${resettingUser.full_name} เรียบร้อยแล้ว`)
            setResettingUser(null)
            setNewPassword('')
        } catch (error) {
            console.error('Error resetting password:', error)
            setError(error.message)
        } finally {
            setResetting(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.department?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">จัดการสมาชิก</h1>
                    <p className="text-slate-500">จัดการข้อมูลผู้ใช้งานและกำหนดสิทธิ์ในระบบ</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
                >
                    <UserPlus size={20} />
                    เพิ่มสมาชิกใหม่
                </button>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <UsersIcon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">สมาชิกทั้งหมด</p>
                            <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, อีเมล, หรือแผนก..."
                        className="w-full h-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Table/List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">ผู้ใช้งาน</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">แผนก/เบอร์โทร</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">บทบาท</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-6"><div className="h-10 w-40 bg-slate-100 rounded-lg"></div></td>
                                        <td className="px-6 py-6"><div className="h-6 w-24 bg-slate-100 rounded-lg"></div></td>
                                        <td className="px-6 py-6"><div className="h-6 w-16 bg-slate-100 rounded-lg"></div></td>
                                        <td className="px-6 py-6"><div className="h-8 w-8 bg-slate-100 rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic">
                                        ไม่พบข้อมูลสมาชิก
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                                    <UserCircle size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{user.full_name}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-semibold text-slate-700">{user.department || '-'}</p>
                                                <p className="text-xs text-slate-400">{user.phone || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                user.role === 'admin'
                                                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                            )}>
                                                {user.role === 'admin' ? 'Admin' : 'User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setResettingUser(user)}
                                                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="รีเซ็ตรหัสผ่าน"
                                                >
                                                    <Key size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !submitting && setShowAddModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                                    <UserPlus size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">เพิ่มสมาชิกใหม่</h3>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                disabled={submitting}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">ชื่อ-นามสกุล</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    placeholder="ชื่อ นามสกุล"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">อีเมล</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    placeholder="email@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">แผนก</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                        placeholder="เช่น ไอที"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">เบอร์โทรศัพท์</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                        placeholder="08X-XXX-XXXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">รหัสผ่านเริ่มต้น</label>
                                <input
                                    required
                                    type="password"
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    placeholder="อย่างน้อย 6 ตัวอักษร"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">สิทธิ์พนักงาน</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="user">User (ผู้ใช้งานทั่วไป)</option>
                                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    disabled={submitting}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> บันทึกสมาชิก</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resettingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !resetting && setResettingUser(null)} />
                    <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                    <Key size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">รีเซ็ตรหัสผ่าน</h3>
                            </div>
                        </div>

                        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 mb-4">
                                    กำลังเปลี่ยนรหัสผ่านให้: <br />
                                    <span className="font-bold text-slate-900">{resettingUser.full_name}</span>
                                </p>
                                <label className="text-sm font-semibold text-slate-700">รหัสผ่านใหม่</label>
                                <input
                                    required
                                    type="password"
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none mt-1"
                                    placeholder="อย่างน้อย 6 ตัวอักษร"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setResettingUser(null)}
                                    disabled={resetting}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetting || !newPassword}
                                    className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {resetting ? <Loader2 size={18} className="animate-spin" /> : 'ยืนยัน'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Global Toast for Success */}
            {success && (
                <div className="fixed bottom-8 right-8 z-[110] animate-in slide-in-from-right duration-300">
                    <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
                        <CheckCircle2 size={24} />
                        <p className="font-bold">{success}</p>
                        <button onClick={() => setSuccess(null)} className="ml-4 hover:bg-white/20 p-1 rounded-full">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
