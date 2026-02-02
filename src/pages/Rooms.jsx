import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import {
    Users,
    MapPin,
    Tv,
    Projector,
    Video,
    CalendarPlus,
    Search,
    ChevronRight,
    X,
    Clock,
    Link as LinkIcon,
    Globe,
    Home,
    Laptop
} from 'lucide-react'
import { format, addHours, startOfHour } from 'date-fns'

const getRoomStatus = (room) => {
    if (room.status === 'maintenance') return { label: 'ซ่อมบำรุง', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Check for ongoing meeting
    const currentMeeting = room.bookings?.find(b =>
        b.status === 'booked' &&
        new Date(b.start_time) <= now &&
        new Date(b.end_time) >= now
    )
    if (currentMeeting) return { label: 'กำลังใช้งาน', class: 'bg-red-500/10 text-red-600 border-red-500/20' }

    // Check for future meeting today
    const futureToday = room.bookings?.find(b =>
        b.status === 'booked' &&
        b.start_time.startsWith(today) &&
        new Date(b.start_time) > now
    )
    if (futureToday) return { label: 'ถูกจองแล้ววันนี้', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }

    return { label: 'ว่าง', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
}

const RoomCard = ({ room, onBook }) => {
    const status = getRoomStatus(room)

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-100 transition-all group flex flex-col">
            <div className="h-48 bg-slate-100 relative overflow-hidden">
                {room.image_url ? (
                    <img
                        src={room.image_url}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Home className="text-primary-100" size={80} />
                        </div>
                    </>
                )}
                <div className="absolute top-4 right-4">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border",
                        status.class
                    )}>
                        {status.label}
                    </span>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{room.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin size={14} /> {room.building}, ชั้น {room.floor}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-3 py-1 rounded-xl">
                        <Users size={16} />
                        <span>{room.capacity}</span>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {room.equipment?.map(item => (
                        <span key={item} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-1">
                            {item === 'Projector' && <Projector size={12} />}
                            {item === 'TV' && <Tv size={12} />}
                            {item === 'Video Conference' && <Video size={12} />}
                            {item}
                        </span>
                    ))}
                </div>

                <div className="mt-auto pt-6">
                    <button
                        onClick={() => onBook(room)}
                        disabled={room.status !== 'available'}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:grayscale"
                    >
                        จองห้องนี้
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function cn(...inputs) {
    return inputs.filter(Boolean).join(' ')
}

const Loader2 = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
)

const TimeInput24h = ({ label, value, onChange }) => {
    const [h, m] = value.split(':')

    const setH = (newH) => onChange(`${newH}:${m}`)
    const setM = (newM) => onChange(`${h}:${newM}`)

    return (
        <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <select
                        value={h}
                        onChange={(e) => setH(e.target.value)}
                        className="w-full appearance-none px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-bold text-slate-700 cursor-pointer text-center"
                    >
                        {Array.from({ length: 24 }).map((_, i) => {
                            const val = i.toString().padStart(2, '0')
                            return <option key={val} value={val}>{val}</option>
                        })}
                    </select>
                </div>
                <div className="text-slate-300 font-bold">:</div>
                <div className="flex-1 relative">
                    <select
                        value={m}
                        onChange={(e) => setM(e.target.value)}
                        className="w-full appearance-none px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-bold text-slate-700 cursor-pointer text-center"
                    >
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(val => (
                            <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}

export default function Rooms() {
    const { user } = useAuth()
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [bookingForm, setBookingForm] = useState({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: format(startOfHour(addHours(new Date(), 1)), 'HH:mm'),
        endTime: format(startOfHour(addHours(new Date(), 2)), 'HH:mm'),
        type: 'onsite',
        link: '',
        description: ''
    })
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingError, setBookingError] = useState(null)
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        fetchRooms()
    }, [])

    const fetchRooms = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('rooms')
                .select('*, bookings(start_time, end_time, status)')
                .order('name')

            if (error) throw error
            setRooms(data || [])
        } catch (error) {
            console.error('Error fetching rooms:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredRooms = rooms.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.building.toLowerCase().includes(search.toLowerCase())
    )

    const handleBooking = async (e) => {
        e.preventDefault()
        setBookingLoading(true)

        try {
            const start = new Date(`${bookingForm.date}T${bookingForm.startTime}`)
            const end = new Date(`${bookingForm.date}T${bookingForm.endTime}`)

            if (start < new Date()) {
                throw new Error('ไม่สามารถจองเวลาย้อนหลังได้')
            }
            if (end <= start) {
                throw new Error('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม')
            }

            // Conflict Check
            const { data: conflicts, error: conflictError } = await supabase
                .from('bookings')
                .select('id')
                .eq('room_id', selectedRoom.id)
                .eq('status', 'booked')
                .lt('start_time', end.toISOString())
                .gt('end_time', start.toISOString())

            if (conflictError) throw conflictError
            if (conflicts && conflicts.length > 0) {
                throw new Error('ช่วงเวลานี้มีผู้จองแล้ว กรุณาเลือกเวลาอื่น')
            }

            const { error } = await supabase.from('bookings').insert({
                room_id: selectedRoom.id,
                user_id: user.id,
                title: bookingForm.title,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                meeting_type: bookingForm.type,
                meeting_link: bookingForm.link,
                description: bookingForm.description,
                status: 'booked'
            })

            if (error) throw error
            setSelectedRoom(null)
            setShowSuccess(true)
            setBookingForm({
                title: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                startTime: format(startOfHour(addHours(new Date(), 1)), 'HH:mm'),
                endTime: format(startOfHour(addHours(new Date(), 2)), 'HH:mm'),
                type: 'onsite',
                link: '',
                description: ''
            })
            fetchRooms()
        } catch (error) {
            console.error('Error booking room:', error)
            setBookingError(error.message)
        } finally {
            setBookingLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Filter Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อห้องหรืออาคาร..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500">มุมมอง:</span>
                    <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm"><Home size={20} /></button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-96 bg-slate-200 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredRooms.map(room => (
                        <RoomCard key={room.id} room={room} onBook={setSelectedRoom} />
                    ))}
                </div>
            )}

            {/* Booking Modal */}
            {selectedRoom && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedRoom(null)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                                    <CalendarPlus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">จองห้องประชุม: {selectedRoom.name}</h3>
                                    <p className="text-sm text-slate-500">{selectedRoom.building}, ชั้น {selectedRoom.floor}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRoom(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleBooking} className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">หัวข้อการประชุม</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                        placeholder="เช่น ประชุมสรุปงานประจำสัปดาห์, ระดมสมองโปรเจกต์ใหม่"
                                        value={bookingForm.title}
                                        onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">วันที่</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                        value={bookingForm.date}
                                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <TimeInput24h
                                        label="เวลาเริ่ม"
                                        value={bookingForm.startTime}
                                        onChange={(val) => setBookingForm({ ...bookingForm, startTime: val })}
                                    />
                                    <TimeInput24h
                                        label="เวลาสิ้นสุด"
                                        value={bookingForm.endTime}
                                        onChange={(val) => setBookingForm({ ...bookingForm, endTime: val })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">รูปแบบการประชุม</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'onsite', label: 'On-site', icon: Home },
                                            { id: 'online', label: 'Online', icon: Globe },
                                            { id: 'hybrid', label: 'Hybrid', icon: Laptop },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setBookingForm({ ...bookingForm, type: type.id })}
                                                className={cn(
                                                    "px-3 py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                                                    bookingForm.type === type.id
                                                        ? "bg-primary-50 border-primary-600 text-primary-700 shadow-sm"
                                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                                )}
                                            >
                                                <type.icon size={20} />
                                                <span className="text-xs font-bold">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Link ประชุม (ถ้ามี)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <LinkIcon size={18} />
                                        </div>
                                        <input
                                            type="url"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                            placeholder="Zoom, Google Meet, Teams link..."
                                            value={bookingForm.link}
                                            onChange={(e) => setBookingForm({ ...bookingForm, link: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">รายละเอียดเพิ่มเติม</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none resize-none"
                                        placeholder="ระบุข้อกำหนดพิเศษอื่น ๆ..."
                                        value={bookingForm.description}
                                        onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRoom(null)}
                                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookingLoading}
                                    className="flex-[2] px-6 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2 group"
                                >
                                    {bookingLoading ? <Loader2 size={24} className="animate-spin" /> : 'ยืนยันการจอง'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                onConfirm={() => setShowSuccess(false)}
                title="จองห้องประชุมสำเร็จ!"
                message="เราได้บันทึกการจองของคุณเรียบร้อยแล้ว คุณสามารถตรวจสอบรายการจองได้ที่เมนู 'การจองของฉัน'"
                confirmText="ตกลง"
                type="success"
            />
            <ConfirmModal
                isOpen={!!bookingError}
                onClose={() => setBookingError(null)}
                onConfirm={() => setBookingError(null)}
                title="ไม่สามารถจองห้องได้"
                message={bookingError}
                confirmText="ตกลง"
                type="danger"
            />
        </div>
    )
}
