import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CalendarCheck, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const { error } = await signIn(email, password)

        if (error) {
            const message = error.message === 'Invalid login credentials'
                ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
                : error.message
            setError(message)
            setLoading(false)
        } else {
            navigate('/')
        }
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
                    </div>
                </div>

                <div className="relative z-10">
                    <h2 className="text-5xl font-bold leading-tight mb-6">
                        พื้นที่อัจฉริยะแด่ <br />
                        <span className="text-primary-200">ทีมที่ยอดเยี่ยม</span>
                    </h2>
                    <p className="text-primary-100 text-lg max-w-md">
                        วิธีที่ง่ายที่สุดในการจองห้องประชุม จัดการพื้นที่ Hybrid และเพิ่มประสิทธิภาพการทำงานในออฟฟิศของคุณ
                    </p>
                </div>

                <div className="relative z-10 flex gap-12 text-primary-200 text-sm font-medium">
                    <p>© 2024</p>
                    <a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
                    <a href="#" className="hover:text-white transition-colors">ช่วยเหลือ</a>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden text-center mb-12">
                        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-100 mx-auto mb-4">
                            <CalendarCheck size={32} />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">เข้าสู่ระบบ</h2>
                        <p className="text-slate-500">ป้อนข้อมูลประจำตัวของคุณเพื่อเข้าสู่ระบบ</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="email">อีเมล</label>
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

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700" htmlFor="password">รหัสผ่าน</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    เข้าสู่ระบบ
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <a href="#" className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors">ลืมรหัสผ่าน?</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
