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
    X,
    DoorOpen,
    Search
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
    const { user, isAdmin } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [confirmCancel, setConfirmCancel] = useState(null)
    const [errorMsg, setErrorMsg] = useState(null)
    const [viewingBooking, setViewingBooking] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Helper to check if a booking is expired based on its end time
    const isBookingExpired = (endTime) => isPast(new Date(endTime))

    useEffect(() => {
        if (user) fetchUserBookings()
    }, [user])

    const fetchUserBookings = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('bookings')
                .select('*, rooms(name, building, floor)')
                .order('start_time', { ascending: false })

            // If not admin, only show own bookings
            if (!isAdmin) {
                query = query.eq('user_id', user.id)
            }

            const { data, error } = await query

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
            setViewingBooking(null) // Close detail modal if cancelling from it
        } catch (error) {
            console.error('Error cancelling booking:', error)
            setErrorMsg(error.message)
        }
    }

    const handleFinishBooking = async (bookingId) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({
                    status: 'completed',
                    end_time: new Date().toISOString()
                })
                .eq('id', bookingId)

            if (error) throw error
            fetchUserBookings()
            if (viewingBooking?.id === bookingId) setViewingBooking(null)
        } catch (error) {
            console.error('Error finishing booking:', error)
            setErrorMsg(error.message)
        }
    }

    const filteredBookings = bookings.filter(booking => {
        const titleMatch = booking.title?.toLowerCase().includes(searchTerm.toLowerCase())
        const roomMatch = booking.rooms?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        const nameMatch = booking.requester_name?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesSearch = titleMatch || roomMatch || nameMatch

        const isExpired = isPast(new Date(booking.end_time)) && booking.status === 'booked'
        const currentStatus = isExpired ? 'completed' : booking.status
        const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isAdmin ? 'รายการจองทั้งหมด' : 'การจองของฉัน'}
                    </h1>
                    <p className="text-slate-500">
                        {isAdmin
                            ? 'ตรวจสอบและจัดการรายการจองห้องประชุมของพนักงานทุกคน'
                            : 'ประวัติและรายการจองห้องประชุมทั้งหมดของคุณ'}
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                <div className="relative flex-1 w-full max-w-md">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อการประชุม, ห้อง, หรือชื่อผู้จอง..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    {[
                        { id: 'all', label: 'ทั้งหมด' },
                        { id: 'booked', label: 'รอใช้งาน' },
                        { id: 'completed', label: 'สำเร็จ' },
                        { id: 'cancelled', label: 'ยกเลิก' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === tab.id
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-white border rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">ไม่พบรายการที่ค้นหา</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะดูนะครับ</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Type Indicator */}
                            <div className="w-2 md:w-1 absolute inset-y-0 left-0 bg-primary-600" />

                            <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-slate-900">{booking.title}</h3>
                                            {isAdmin && booking.requester_name && (
                                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                    โดย: {booking.requester_name}
                                                </span>
                                            )}
                                        </div>
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
                                    {isAdmin && booking.department && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">แผนก / เบอร์โทร</span>
                                            <span className="text-sm font-semibold text-slate-700">{booking.department}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">วันที่</span>
                                        <span className="text-sm font-semibold text-slate-700">{format(new Date(booking.start_time), 'd MMM yyyy')}</span>
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
                                <button
                                    onClick={() => setViewingBooking(booking)}
                                    className="flex-1 md:flex-none px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <AlertCircle size={18} /> ดูข้อมูล
                                </button>
                                {booking.status === 'booked' && !isBookingExpired(booking.end_time) && (
                                    <div className="flex gap-2">
                                        {isAdmin && new Date() >= new Date(booking.start_time) && (
                                            <button
                                                onClick={() => handleFinishBooking(booking.id)}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="จบการประชุมก่อนเวลา (Check-out)"
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setConfirmCancel(booking.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="ยกเลิกการจอง"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Details Modal */}
            {viewingBooking && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingBooking(null)} />
                    <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">รายละเอียดการจอง</h3>
                            <button onClick={() => setViewingBooking(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">หัวข้อการประชุม</span>
                                    <p className="text-lg font-bold text-slate-900 leading-tight">{viewingBooking.title}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ห้องประชุม</span>
                                        <p className="font-bold text-primary-600 flex items-center gap-2">
                                            <DoorOpen size={16} /> {viewingBooking.rooms?.name}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ตำแหน่ง</span>
                                        <p className="text-slate-600 flex items-center gap-2">
                                            <MapPin size={16} /> {viewingBooking.rooms?.building}, ชั้น {viewingBooking.rooms?.floor}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">วันที่</span>
                                        <p className="text-slate-700 font-bold">{format(new Date(viewingBooking.start_time), 'd MMMM yyyy')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">เวลา</span>
                                        <p className="text-slate-700 font-bold">{format(new Date(viewingBooking.start_time), 'HH:mm')} - {format(new Date(viewingBooking.end_time), 'HH:mm')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ผู้จอง</span>
                                        <p className="text-slate-700 font-bold">{viewingBooking.requester_name || 'ไม่ระบุ'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">แผนก/เบอร์โทร</span>
                                        <p className="text-slate-700 font-bold">{viewingBooking.department || 'ไม่ระบุ'}</p>
                                    </div>
                                </div>

                                {viewingBooking.description && (
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">รายละเอียดเพิ่มเติม</span>
                                        <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">"{viewingBooking.description}"</p>
                                    </div>
                                )}

                                {viewingBooking.meeting_link && (
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ลิงก์เข้าร่วมประชุม</span>
                                        <a
                                            href={viewingBooking.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink size={18} /> เปิดลิงก์ประชุม
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setViewingBooking(null)}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    ปิดหน้าต่าง
                                </button>
                                {viewingBooking.status === 'booked' && !isBookingExpired(viewingBooking.end_time) && (
                                    <div className="flex-1 flex flex-col gap-2">
                                        {isAdmin && new Date() >= new Date(viewingBooking.start_time) && (
                                            <button
                                                onClick={() => handleFinishBooking(viewingBooking.id)}
                                                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={18} /> จบการประชุม (Check-out)
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setConfirmCancel(viewingBooking.id)
                                            }}
                                            className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                                        >
                                            ยกเลิกการจอง
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
