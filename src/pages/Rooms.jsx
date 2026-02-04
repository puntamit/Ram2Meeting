import { useState, useEffect, Component } from 'react'
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
    Laptop,
    CheckCircle2,

} from 'lucide-react'
import { format, addHours, startOfHour, isBefore, addMinutes } from 'date-fns'

// Basic Error Boundary Component
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <h2 className="text-lg font-bold mb-2">Something went wrong.</h2>
                    <details className="whitespace-pre-wrap text-sm">
                        {this.state.error && this.state.error.toString()}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}



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
        b.start_time?.startsWith(today) &&
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
    const { user, isAdmin } = useAuth()
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
    const [occupiedSlots, setOccupiedSlots] = useState([])

    useEffect(() => {
        fetchRooms()
    }, [])

    useEffect(() => {
        if (selectedRoom && bookingForm.date) {
            fetchOccupiedSlots()
        }
    }, [selectedRoom, bookingForm.date])

    const fetchOccupiedSlots = async () => {
        if (!selectedRoom) return

        const startOfDay = new Date(`${bookingForm.date}T00:00:00`)
        const endOfDay = new Date(`${bookingForm.date}T23:59:59`)

        const { data } = await supabase
            .from('bookings')
            .select('start_time, end_time')
            .eq('room_id', selectedRoom.id)
            .eq('status', 'booked')
            .lt('start_time', endOfDay.toISOString())
            .gt('end_time', startOfDay.toISOString())
            .order('start_time')

        setOccupiedSlots(data || [])
    }

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
        setBookingError(null)

        try {
            // Validation
            if (!bookingForm.startTime || !bookingForm.endTime) throw new Error('กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด')

            // Combine Date + Time
            const startDateTime = new Date(`${bookingForm.date}T${bookingForm.startTime}:00`)
            const endDateTime = new Date(`${bookingForm.date}T${bookingForm.endTime}:00`)

            if (startDateTime >= endDateTime) {
                throw new Error('เวลาสิ้นสุดต้องหลังจากเวลาเริ่ม')
            }

            // Check overlap (client-side check for immediate feedback)
            // Skip check for admin custom time? Only if we decide to allow override. 
            // For now, let's allow overlapping if it's admin custom time? 
            // User request: "Admin can add time... e.g. 19:00-20:00" -> maybe overlap is okay if it's special?
            // But usually room can't be booked double.
            // Let's keep overlap check for safety.
            const isOverlapping = occupiedSlots.some(slot => {
                const bookedStart = new Date(slot.start_time)
                const bookedEnd = new Date(slot.end_time)
                return (
                    (startDateTime < bookedEnd && endDateTime > bookedStart)
                )
            })

            if (isOverlapping) {
                throw new Error('ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น')
            }

            const { error } = await supabase
                .from('bookings')
                .insert({
                    room_id: selectedRoom.id,
                    user_id: user.id,
                    title: bookingForm.title,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    meeting_type: bookingForm.type,
                    meeting_link: bookingForm.link,
                    description: bookingForm.description,
                    requester_name: bookingForm.requesterName,
                    requester_email: user.email,
                    department: bookingForm.department
                })

            if (error) throw error

            setShowSuccess(true)
            setSelectedRoom(null)
            fetchRooms()
        } catch (error) {
            console.error('Booking error:', error)
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
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
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
                    <ErrorBoundary>
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedRoom(null)} />
                        <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
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

                                    {/* Reqeuster Info */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">ชื่อผู้จอง</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                            placeholder="ระบุชื่อของคุณ"
                                            value={bookingForm.requesterName}
                                            onChange={(e) => setBookingForm({ ...bookingForm, requesterName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">แผนก / เบอร์โทร</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                            placeholder="เช่น IT / 081-234-5678"
                                            value={bookingForm.department}
                                            onChange={(e) => setBookingForm({ ...bookingForm, department: e.target.value })}
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-slate-700">วันที่</label>
                                            {isAdmin && (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="customTime"
                                                        checked={bookingForm.isCustomTime}
                                                        onChange={(e) => setBookingForm({ ...bookingForm, isCustomTime: e.target.checked })}
                                                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <label htmlFor="customTime" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                                                        ระบุเวลาเอง (Admin Only)
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            required
                                            type="date"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                            value={bookingForm.date}
                                            onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                                        />

                                        {/* Visual Schedule Timeline OR Manual Input */}
                                        {!bookingForm.isCustomTime ? (
                                            <div className="mt-4 border rounded-xl p-4 bg-white">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-sm font-bold text-slate-700">เลือกเวลา ({bookingForm.startTime} - {bookingForm.endTime})</p>
                                                    <div className="flex gap-3 text-xs">
                                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> ว่าง</div>
                                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded"></div> ที่เลือก</div>
                                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div> ไม่ว่าง</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                                    {Array.from({ length: 14 }).map((_, i) => {
                                                        const hour = i + 6; // Start from 6:00
                                                        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                                                        const nextSlot = `${(hour + 1).toString().padStart(2, '0')}:00`;
                                                        const slotDate = new Date(`${bookingForm.date}T${timeSlot}`);

                                                        // Check if slot is booked OR in the past
                                                        const isPastSlot = isBefore(addHours(slotDate, 1), new Date());
                                                        const isBooked = occupiedSlots.some(slot => {
                                                            const start = new Date(slot.start_time);
                                                            const end = new Date(slot.end_time);
                                                            return (
                                                                (slotDate >= start && slotDate < end) ||
                                                                (addHours(slotDate, 1) > start && addHours(slotDate, 1) <= end)
                                                            );
                                                        });

                                                        const isUnavailable = isBooked || isPastSlot;

                                                        // Check if selected
                                                        const currentStart = parseInt(bookingForm.startTime.split(':')[0]);
                                                        const currentEnd = parseInt(bookingForm.endTime.split(':')[0]);
                                                        const isSelected = !isUnavailable && hour >= currentStart && hour < currentEnd;

                                                        return (
                                                            <button
                                                                key={hour}
                                                                type="button"
                                                                disabled={isUnavailable}
                                                                onClick={() => {
                                                                    const clickedHour = hour;
                                                                    const currentStartHour = parseInt(bookingForm.startTime.split(':')[0]);
                                                                    const currentEndHour = parseInt(bookingForm.endTime.split(':')[0]);

                                                                    // Logic for range selection
                                                                    if (currentEndHour - currentStartHour === 1 && currentStartHour === clickedHour) {
                                                                        // Deselect if clicking the same single slot
                                                                        return;
                                                                    }

                                                                    if (currentEndHour - currentStartHour > 1 && clickedHour >= currentStartHour && clickedHour < currentEndHour) {
                                                                        // If clicking inside a range, simplify to just that slot
                                                                        setBookingForm({
                                                                            ...bookingForm,
                                                                            startTime: timeSlot,
                                                                            endTime: nextSlot
                                                                        });
                                                                        return;
                                                                    }

                                                                    // If clicking outside or verifying a new range
                                                                    if (clickedHour < currentStartHour) {
                                                                        // New start time
                                                                        setBookingForm({ ...bookingForm, startTime: timeSlot, endTime: nextSlot });
                                                                    } else if (clickedHour > currentStartHour) {
                                                                        // Extend range (check for gaps)
                                                                        const proposedEnd = nextSlot;
                                                                        // Verify no overlapping bookings in between
                                                                        let hasOverlap = false;
                                                                        for (let h = currentStartHour; h <= clickedHour; h++) {
                                                                            const checkTime = `${h.toString().padStart(2, '0')}:00`;
                                                                            const checkDate = new Date(`${bookingForm.date}T${checkTime}`);
                                                                            if (occupiedSlots.some(s => {
                                                                                const sStart = new Date(s.start_time);
                                                                                const sEnd = new Date(s.end_time);
                                                                                return (checkDate >= sStart && checkDate < sEnd);
                                                                            })) {
                                                                                hasOverlap = true; break;
                                                                            }
                                                                        }

                                                                        if (!hasOverlap) {
                                                                            setBookingForm({ ...bookingForm, endTime: proposedEnd });
                                                                        } else {
                                                                            // If overlap, just set as new single slot
                                                                            setBookingForm({ ...bookingForm, startTime: timeSlot, endTime: nextSlot });
                                                                        }
                                                                    } else {
                                                                        // Same start, reset to single slot
                                                                        setBookingForm({ ...bookingForm, startTime: timeSlot, endTime: nextSlot });
                                                                    }
                                                                }}
                                                                className={`
                                                                flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all text-sm font-bold relative
                                                                ${isUnavailable
                                                                        ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-80'
                                                                        : isSelected
                                                                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg ring-2 ring-emerald-200'
                                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 cursor-pointer'
                                                                    }
                                                            `}
                                                            >
                                                                <span>{timeSlot} - {nextSlot}</span>
                                                                <span className={`text-xs font-normal mt-1 ${isUnavailable ? 'text-red-300' : isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                                    {isUnavailable ? (isPastSlot ? 'หมดเวลา' : 'ไม่ว่าง') : isSelected ? 'เลือกแล้ว' : 'ว่าง'}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2 text-center">*กดช่องแรกเพื่อเริ่ม และกดช่องสุดท้ายเพื่อสิ้นสุดช่วงเวลา</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-semibold text-slate-700">เวลาเริ่ม</label>
                                                    <input
                                                        type="time"
                                                        required
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                                        value={bookingForm.startTime}
                                                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-semibold text-slate-700">เวลาสิ้นสุด</label>
                                                    <input
                                                        type="time"
                                                        required
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                                        value={bookingForm.endTime}
                                                        onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-span-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-center gap-1">
                                                    <span className="font-bold">Note:</span> การระบุเวลาเองสำหรับ Admin จะสามารถเลือกเวลาได้อิสระนอกเหนือจากตารางปกติ
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
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

                                    <div className="md:col-span-2 space-y-2">
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
                    </ErrorBoundary>
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
