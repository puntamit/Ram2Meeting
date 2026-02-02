import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CalendarCheck, Lock, Mail, ArrowRight, Loader2, User as UserIcon, Building2, Phone } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

export default function Signup() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        department: '',
        phone: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showSuccess, setShowSuccess] = useState(false)
    const { signUp } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const { error } = await signUp(formData.email, formData.password, {
            full_name: formData.fullName,
            department: formData.department,
            phone: formData.phone
        })

        if (error) {
            let message = error.message
            if (message === 'User already registered') message = 'อีเมลนี้ถูกลงทะเบียนแล้ว'
            setError(message)
            setLoading(false)
        } else {
            setShowSuccess(true)
        }
    }

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.id]: e.target.value
        }))
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side: Illustration & Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-primary-600 p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-700 rounded-full translate-y-1/2 -translate-x-1/2 opacity-20" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/30">
                            <CalendarCheck size={28} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">MeetBook</h1>
                    </div>
                </div>

                <div className="relative z-10">
                    <h2 className="text-5xl font-bold leading-tight mb-6">
                        เริ่มต้นใช้งาน <br />
                        <span className="text-primary-200">ในไม่กี่นาที</span>
                    </h2>
                    <p className="text-primary-100 text-lg max-w-md">
                        สร้างบัญชีผู้ใช้เพื่อเริ่มต้นจองห้องประชุมและจัดการตารางงานของคุณให้มีประสิทธิภาพมากขึ้น
                    </p>
                </div>

                <div className="relative z-10 flex gap-12 text-primary-200 text-sm font-medium">
                    <p>© 2024 MeetBook Inc.</p>
                    <a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
                    <a href="#" className="hover:text-white transition-colors">ช่วยเหลือ</a>
                </div>
            </div>

            {/* Right Side: Signup Form */}
            <div className="flex items-center justify-center p-8 bg-white overflow-y-auto">
                <div className="w-full max-w-md my-8 space-y-8">
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-100 mx-auto mb-4">
                            <CalendarCheck size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">MeetBook</h1>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">สมัครสมาชิก</h2>
                        <p className="text-slate-500">สร้างบัญชีผู้ใช้ใหม่ของคุณ</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="fullName">ชื่อ-นามสกุล</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                    <UserIcon size={18} />
                                </div>
                                <input
                                    id="fullName"
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    placeholder="ชื่อ นามสกุล"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="email">อีเมล</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="department">แผนก</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                        <Building2 size={16} />
                                    </div>
                                    <input
                                        id="department"
                                        type="text"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none text-sm"
                                        placeholder="เช่น ไอที"
                                        value={formData.department}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="phone">เบอร์โทรศัพท์</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                        <Phone size={16} />
                                    </div>
                                    <input
                                        id="phone"
                                        type="tel"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none text-sm"
                                        placeholder="08X-XXX-XXXX"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="password">รหัสผ่าน</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    placeholder="อย่างน้อย 6 ตัวอักษร"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    สร้างบัญชี
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-sm text-slate-500 mt-6">
                            มีบัญชีอยู่แล้ว?{' '}
                            <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">เข้าสู่ระบบ</Link>
                        </p>
                    </form>
                </div>
            </div>

            <ConfirmModal
                isOpen={showSuccess}
                onClose={() => navigate('/login')}
                onConfirm={() => navigate('/login')}
                title="สมัครสมาชิกสำเร็จ!"
                message="บัญชีของคุณถูกสร้างเรียบร้อยแล้ว กรุณาล็อกอินเพื่อเริ่มต้นใช้งานระบบจองห้องประชุม"
                confirmText="ไปหน้าล็อกอิน"
                type="success"
            />
        </div>
    )
}
