import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import {
    Calendar,
    Clock,
    MapPin,
    ExternalLink,
    XCircle,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Link as LinkIcon,
    Video,
    Home,
    Laptop,
    X
} from 'lucide-react'
import { format, isPast } from 'date-fns'

const StatusBadge = ({ status, endTime }) => {
    const isExpired = isPast(new Date(endTime)) && status === 'booked'

    const styles = {
        booked: "bg-primary-50 text-primary-700 border-primary-100",
        cancelled: "bg-red-50 text-red-700 border-red-100",
        completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
        expired: "bg-slate-50 text-slate-500 border-slate-200"
    }

    const label = isExpired ? 'เสร็จสิ้น' :
        status === 'booked' ? 'ได้รับจอง' :
            status === 'cancelled' ? 'ยกเลิกแล้ว' :
                status === 'completed' ? 'เสร็จสิ้น' : status

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[isExpired ? 'completed' : status]}`}>
            {label}
        </span>
    )
}

export default function Bookings() {
    const { user } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [confirmCancel, setConfirmCancel] = useState(null)
    const [errorMsg, setErrorMsg] = useState(null)

    // Helper to check if a booking is expired based on its end time
    const isBookingExpired = (endTime) => isPast(new Date(endTime))

    useEffect(() => {
        if (user) fetchUserBookings()
    }, [user])

    const fetchUserBookings = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('bookings')
                .select('*, rooms(name, building, floor)')
                .eq('user_id', user.id)
                .order('start_time', { ascending: false })

            if (error) throw error
            setBookings(data || [])
        } catch (error) {
            console.error('Error fetching bookings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCancelBooking = async () => {
        if (!confirmCancel) return
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', confirmCancel)

            if (error) throw error
            fetchUserBookings()
            setConfirmCancel(null)
        } catch (error) {
            console.error('Error cancelling booking:', error)
            setErrorMsg(error.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">การจองของฉัน</h1>
                    <p className="text-slate-500">ประวัติและรายการจองห้องประชุมทั้งหมดของคุณ</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <div className="bg-white border rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">ยังไม่มีประวัติการจอง</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">คุณยังไม่ได้ทำรายการจองห้องประชุมใด ๆ เริ่มต้นค้นหาห้องประชุมได้จากเมนูห้องประชุม</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Type Indicator */}
                            <div className="w-2 md:w-1 absolute inset-y-0 left-0 bg-primary-600" />

                            <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-slate-900">{booking.title}</h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-400" /> {booking.rooms?.name}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="flex items-center gap-1.5"><Clock size={16} className="text-slate-400" /> {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={booking.status} endTime={booking.end_time} />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">วันที่</span>
                                        <span className="text-sm font-semibold text-slate-700">{format(new Date(booking.start_time), 'EEEE d MMM yyyy')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">รูปแบบ</span>
                                        <span className="text-sm font-semibold text-slate-700 capitalize flex items-center gap-1.5">
                                            {booking.meeting_type === 'onsite' && <Home size={14} />}
                                            {booking.meeting_type === 'online' && <Video size={14} />}
                                            {booking.meeting_type === 'hybrid' && <Laptop size={14} />}
                                            {booking.meeting_type === 'onsite' ? 'On-site' : booking.meeting_type === 'online' ? 'Online' : 'Hybrid'}
                                        </span>
                                    </div>
                                    {booking.meeting_link && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ลิงก์ประชุม</span>
                                            <a
                                                href={booking.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 underline decoration-primary-200 underline-offset-4"
                                            >
                                                เข้าร่วมการประชุม <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {booking.description && (
                                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 italic">
                                        "{booking.description}"
                                    </div>
                                )}
                            </div>

                            <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                {booking.status === 'booked' && !isBookingExpired(booking.end_time) && (
                                    <button
                                        onClick={() => setConfirmCancel(booking.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="ยกเลิกการจอง"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                                <button className="flex-1 md:flex-none px-4 py-2 text-slate-600 hover:bg-slate-50 font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <AlertCircle size={18} /> ช่วยเหลือ
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cancel Confirmation */}
            <ConfirmModal
                isOpen={!!confirmCancel}
                onClose={() => setConfirmCancel(null)}
                onConfirm={handleCancelBooking}
                title="ยืนยันการยกเลิกการจอง"
                message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองห้องประชุมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                confirmText="ยกเลิกการจอง"
                type="danger"
            />

            {/* Error Message */}
            <ConfirmModal
                isOpen={!!errorMsg}
                onClose={() => setErrorMsg(null)}
                onConfirm={() => setErrorMsg(null)}
                title="เกิดข้อผิดพลาด"
                message={errorMsg}
                confirmText="ตกลง"
                type="danger"
            />
        </div>
    )
}
