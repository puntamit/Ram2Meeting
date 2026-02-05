import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
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
    Key,
    FileSpreadsheet,
    Upload,
    FileText,
    Pencil
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

    const [showBulkModal, setShowBulkModal] = useState(false)
    const [bulkData, setBulkData] = useState([])
    const [importing, setImporting] = useState(false)

    const [deletingUser, setDeletingUser] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState([])

    // Edit User State
    const [editingUser, setEditingUser] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [updating, setUpdating] = useState(false)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

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
            const { data, error: invokeError } = await supabase.functions.invoke('admin-change-password', {
                body: {
                    userId: resettingUser.id,
                    newPassword: newPassword
                }
            })

            if (invokeError) {
                console.error('Invoke Error Detail:', invokeError)
                throw new Error(`เชื่อมต่อฟังก์ชันล้มเหลว: ${invokeError.message || 'CORS or Network Error'}`)
            }

            if (data?.error) throw new Error(data.error)

            setSuccess(`เปลี่ยนรหัสผ่านให้ ${resettingUser.full_name} เรียบร้อยแล้ว`)
            setResettingUser(null)
            setNewPassword('')
        } catch (error) {
            console.error('Full Error Object:', error)
            setError(error.message)
        } finally {
            setResetting(false)
        }
    }

    const handleDeleteUser = async () => {
        const idsToDelete = deletingUser && !Array.isArray(deletingUser)
            ? [deletingUser.id]
            : selectedUsers

        if (idsToDelete.length === 0) return

        setDeleting(true)
        setError(null)
        setSuccess(null)

        try {
            const { data, error: invokeError } = await supabase.functions.invoke('admin-delete-user', {
                body: { userIds: idsToDelete }
            })

            if (invokeError) throw invokeError
            if (data?.error) throw new Error(data.error)

            setSuccess(data.message || `ลบสมาชิก ${idsToDelete.length > 1 ? idsToDelete.length + ' รายการ' : deletingUser.full_name} เรียบร้อยแล้ว`)
            setDeletingUser(null)
            setSelectedUsers([])
            fetchUsers()
        } catch (error) {
            console.error('Error deleting users:', error)
            setError(error.message)
        } finally {
            setDeleting(false)
        }
    }

    const handleEditUser = (user) => {
        setEditingUser({
            ...user,
            // Ensure department and phone are not null for the input value
            department: user.department || '',
            phone: user.phone || ''
        })
        setShowEditModal(true)
        setError(null)
    }

    const handleUpdateUser = async (e) => {
        e.preventDefault()
        setUpdating(true)
        setError(null)
        setSuccess(null)

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    full_name: editingUser.full_name,
                    department: editingUser.department,
                    phone: editingUser.phone,
                    role: editingUser.role
                })
                .eq('id', editingUser.id)
                .select()

            if (error) throw error
            if (!data || data.length === 0) {
                throw new Error('บันทึกไม่สำเร็จ: คุณอาจไม่มีสิทธิ์แก้ไขรายการนี้')
            }

            setSuccess(`แก้ไขข้อมูล ${editingUser.full_name} เรียบร้อยแล้ว`)
            setShowEditModal(false)
            setEditingUser(null)
            fetchUsers()
        } catch (error) {
            console.error('Error updating user:', error)
            setError(error.message)
        } finally {
            setUpdating(false)
        }
    }

    const toggleUserSelection = (id) => {
        setSelectedUsers(prev =>
            prev.includes(id)
                ? prev.filter(uid => uid !== id)
                : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        const currentPageIds = currentItems.map(u => u.id)
        const allSelected = currentPageIds.every(id => selectedUsers.includes(id))

        if (allSelected) {
            setSelectedUsers(prev => prev.filter(id => !currentPageIds.includes(id)))
        } else {
            setSelectedUsers(prev => [...new Set([...prev, ...currentPageIds])])
        }
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)

                // Map columns
                const formattedData = data.map(row => {
                    const email = row['อีเมล'] || row['Email'] || row['email'] || Object.values(row)[0]
                    const emailPrefix = email && typeof email === 'string' ? email.split('@')[0] : 'Member'

                    return {
                        full_name: row['ชื่อ-นามสกุล'] || row['Name'] || row['ชื่อ'] || emailPrefix,
                        email: email,
                        department: row['แผนก'] || row['Department'] || '-',
                        phone: row['เบอร์โทรศัพท์'] || row['Phone'] || '-',
                        password: row['รหัสผ่าน'] || row['Password'] || '123456'
                    }
                }).filter(u => u.email && typeof u.email === 'string' && u.email.includes('@'))

                setBulkData(formattedData)
            } catch (error) {
                console.error('Error reading excel:', error)
                setError('ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์')
            }
        }
        reader.readAsBinaryString(file)
    }

    const startBulkImport = async () => {
        if (bulkData.length === 0) return
        setImporting(true)
        setError(null)

        try {
            const { data, error: invokeError } = await supabase.functions.invoke('admin-bulk-import', {
                body: { users: bulkData }
            })

            if (invokeError) throw invokeError

            const successCount = data.success?.length || 0
            const errorCount = data.errors?.length || 0

            setSuccess(`นำเข้าสมาชิกสำเร็จ ${successCount} ราย (พลาด ${errorCount} ราย)`)
            setShowBulkModal(false)
            setBulkData([])
            fetchUsers()
        } catch (error) {
            console.error('Bulk import error:', error)
            setError(`นำเข้าล้มเหลว: ${error.message}`)
        } finally {
            setImporting(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.department?.toLowerCase().includes(search.toLowerCase())
    )

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

    // Reset to page 1 when searching
    useEffect(() => {
        setCurrentPage(1)
    }, [search])

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">จัดการสมาชิก</h1>
                    <p className="text-slate-500">จัดการข้อมูลผู้ใช้งานและกำหนดสิทธิ์ในระบบ</p>
                </div>
                <div className="flex gap-2">
                    {selectedUsers.length > 0 && (
                        <button
                            onClick={() => setDeletingUser({ multiple: true, count: selectedUsers.length })}
                            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-all shadow-sm"
                        >
                            <Trash2 size={20} />
                            ลบที่เลือก ({selectedUsers.length})
                        </button>
                    )}
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <FileSpreadsheet size={20} className="text-emerald-600" />
                        นำเข้า Excel
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
                    >
                        <UserPlus size={20} />
                        เพิ่มสมาชิกใหม่
                    </button>
                </div>
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
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        checked={currentItems.length > 0 && currentItems.every(u => selectedUsers.includes(u.id))}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
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
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">
                                        ไม่พบข้อมูลสมาชิก
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map(user => (
                                    <tr key={user.id} className={cn(
                                        "hover:bg-slate-50 transition-colors group",
                                        selectedUsers.includes(user.id) && "bg-primary-50/30"
                                    )}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleUserSelection(user.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                                    selectedUsers.includes(user.id) ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600"
                                                )}>
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
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="แก้ไขข้อมูล"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setResettingUser(user)}
                                                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="รีเซ็ตรหัสผ่าน"
                                                >
                                                    <Key size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingUser(user)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="ลบสมาชิก"
                                                >
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            แสดง <span className="font-bold">{indexOfFirstItem + 1}</span> ถึง <span className="font-bold">{Math.min(indexOfLastItem, filteredUsers.length)}</span> จากทั้งหมด <span className="font-bold">{filteredUsers.length}</span> คน
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                ก่อนหน้า
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg text-sm font-bold transition-all",
                                            currentPage === i + 1
                                                ? "bg-primary-600 text-white shadow-md shadow-primary-100"
                                                : "text-slate-500 hover:bg-white hover:text-slate-700"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
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

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !updating && setShowEditModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                    <Pencil size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">แก้ไขข้อมูลสมาชิก</h3>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                disabled={updating}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
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
                                    value={editingUser.full_name}
                                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">อีเมล <span className="text-xs font-normal text-slate-400">(ไม่สามารถแก้ไขได้)</span></label>
                                <input
                                    disabled
                                    type="email"
                                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none"
                                    value={editingUser.email}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">แผนก</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                        placeholder="เช่น ไอที"
                                        value={editingUser.department}
                                        onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">เบอร์โทรศัพท์</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                        placeholder="08X-XXX-XXXX"
                                        value={editingUser.phone}
                                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">สิทธิ์พนักงาน</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="user">User (ผู้ใช้งานทั่วไป)</option>
                                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={updating}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {updating ? <Loader2 size={18} className="animate-spin" /> : <><Pencil size={18} /> บันทึกการแก้ไข</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !importing && setShowBulkModal(false)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">นำเข้าสมาชิกจาก Excel</h3>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {bulkData.length === 0 ? (
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-emerald-300 transition-colors bg-slate-50 group relative">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                        <Upload size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-900 text-lg">เลือกไฟล์ Excel หรือ CSV</p>
                                        <p className="text-sm text-slate-500 mt-2">
                                            ✅ ใช้ไฟล์ที่มีเฉพาะ <strong>อีเมล</strong> อย่างเดียวได้เลยครับ <br />
                                            ระบบจะตั้งชื่อให้อัตโนมัติจากอีเมล และใช้รหัสผ่าน <strong>123456</strong>
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <button className="mt-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm pointer-events-none">เลือกไฟล์</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-900">พบข้อมูล {bulkData.length} รายการ</p>
                                        <button onClick={() => setBulkData([])} className="text-sm text-red-600 font-bold hover:underline">เปลี่ยนไฟล์</button>
                                    </div>
                                    <div className="max-h-[300px] overflow-auto border border-slate-100 rounded-xl shadow-inner bg-slate-50">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="sticky top-0 bg-white border-b border-slate-100 shadow-sm">
                                                    <th className="px-4 py-3 font-bold text-slate-600">ชื่อ-นามสกุล</th>
                                                    <th className="px-4 py-3 font-bold text-slate-600">อีเมล</th>
                                                    <th className="px-4 py-3 font-bold text-slate-600">แผนก</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {bulkData.map((u, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-2 text-slate-900 uppercase font-medium">{u.full_name}</td>
                                                        <td className="px-4 py-2 text-slate-500 italic">{u.email}</td>
                                                        <td className="px-4 py-2 text-slate-500">{u.department}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            ระบบจะส่งรหัสผ่านเริ่มต้นเป็น <strong>123456</strong> ให้ทุกคน <br />
                                            คุณสามารถกรอกแค่ <strong>ชื่อ</strong> และ <strong>อีเมล</strong> ในไฟล์ได้เลยครับ ส่วนแผนกและเบอร์โทรสามารถมาแก้ไขเพิ่มเติมภายหลังได้ในหน้าจัดการสมาชิกครับ
                                        </p>
                                    </div>

                                    <button
                                        onClick={startBulkImport}
                                        disabled={importing}
                                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                                    >
                                        {importing ? <Loader2 size={24} className="animate-spin" /> : 'ยืนยันการนำเข้าทั้งหมด'}
                                    </button>
                                </div>
                            )}
                        </div>
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

            {/* Delete Confirmation Modal */}
            {deletingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !deleting && setDeletingUser(null)} />
                    <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">ยืนยันการลบสมาชิก</h3>
                            <p className="text-slate-500 mb-8 px-4">
                                {deletingUser.multiple ? (
                                    <>คุณกำลังจะลบสมาชิกที่เลือกจำนวน <span className="font-bold text-slate-900">{deletingUser.count} รายการ</span> ออกจากระบบ</>
                                ) : (
                                    <>คุณกำลังจะลบ <span className="font-bold text-slate-900">{deletingUser.full_name}</span> ออกจากระบบ</>
                                )}
                                <br />
                                <span className="text-red-600 text-sm font-medium">คำเตือน: การกระทำนี้ไม่สามารถย้อนกลับได้</span>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingUser(null)}
                                    disabled={deleting}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={deleting}
                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting ? <Loader2 size={18} className="animate-spin" /> : 'ยืนยันการลบ'}
                                </button>
                            </div>
                        </div>
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
