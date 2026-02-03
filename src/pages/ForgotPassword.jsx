import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CalendarCheck, Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const { resetPassword } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { error } = await resetPassword(email)
            if (error) throw error
            setSuccess(true)
        } catch (error) {
            console.error('Error resetting password:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">ส่งอีเมลเรียบร้อย!</h2>
                        <p className="text-slate-500">
                            เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยัง <span className="font-bold text-slate-700">{email}</span> แล้ว กรุณาตรวจสอบอีเมลของคุณ
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors pt-4"
                    >
                        <ArrowLeft size={18} />
                        กลับสู่หน้าล็อกอิน
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side: Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-600 rounded-full translate-y-1/2 -translate-x-1/2 opacity-10" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center border border-primary-500">
                            <CalendarCheck size={28} />
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <h2 className="text-5xl font-bold leading-tight mb-6">
                        ลืมรหัสผ่าน <br />
                        <span className="text-primary-400">ไม่ต้องกังวล</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-md">
                        ระบุอีเมลที่ใช้ลงทะเบียน แล้วเราจะส่งคู่มือสำหรับการกู้คืนรหัสผ่านไปให้ทางอีเมลครับ
                    </p>
                </div>

                <div className="relative z-10 flex gap-12 text-slate-500 text-sm font-medium">
                    <p>© 2024</p>
                    <a href="#" className="hover:text-white transition-colors">ช่วยเหลือ</a>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div>
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors mb-8 group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            กลับหน้าล็อกอิน
                        </Link>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">ลืมรหัสผ่าน?</h2>
                        <p className="text-slate-500">กรอกอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="email">อีเมลที่ใช้ลงทะเบียน</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    ส่งคู่มือรีเซ็ตรหัสผ่าน
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
