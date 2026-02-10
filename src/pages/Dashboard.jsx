import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
    Users,
    DoorOpen,
    CalendarClock,
    CheckCircle2,
    ExternalLink,
    Plus,
    Settings as SettingsIcon,
    Info,
    MapPin,
    Clock,
    Video,
    Home,
    Laptop,
    X,
    Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { formatThaiDate, cn } from '../lib/utils'

const StatCard = ({ icon: Icon, label, value, color, to }) => {
    const content = (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 h-full">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${color}`}>
                <Icon size={24} />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    )

    if (to) {
        return (
            <Link
                to={to}
                state={to === '/bookings' && label === 'ประชุมวันนี้' ? { filterDate: new Date().toISOString().split('T')[0] } : null}
                className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
                {content}
            </Link>
        )
    }

    return content
}

export default function Dashboard() {
    const { user, isAdmin } = useAuth()
    const [stats, setStats] = useState({ rooms: 0, bookings: 0, today: 0 })
    const [upcoming, setUpcoming] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewingBooking, setViewingBooking] = useState(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            const today = new Date().toISOString().split('T')[0]
            const todayStart = `${today}T00:00:00.000Z`
            const todayEnd = `${today}T23:59:59.999Z`

            let todayQuery = supabase.from('bookings').select('*', { count: 'exact', head: true })
                .gte('start_time', todayStart)
                .lte('start_time', todayEnd)

            let upcomingQuery = supabase.from('bookings').select('*, rooms(name)')
                .gte('start_time', todayStart)
                .lte('start_time', todayEnd)
                .order('start_time', { ascending: true })

            let bookingsCountQuery = supabase.from('bookings').select('*', { count: 'exact', head: true })

            if (!isAdmin) {
                todayQuery = todayQuery.eq('user_id', user.id)
                bookingsCountQuery = bookingsCountQuery.eq('user_id', user.id)
            }

            const [roomsCount, totalBookingsMatch, todayMatch, upcomingMatch] = await Promise.all([
                supabase.from('rooms').select('*', { count: 'exact', head: true }),
                bookingsCountQuery,
                todayQuery,
                upcomingQuery
            ])

            setStats({
                rooms: roomsCount.count || 0,
                bookings: totalBookingsMatch.count || 0,
                today: todayMatch.count || 0
            })
            setUpcoming(upcomingMatch.data || [])
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-6",
                !isAdmin && "md:grid-cols-2"
            )}>
                <StatCard
                    icon={DoorOpen}
                    label="ห้องทั้งหมด"
                    value={stats.rooms}
                    color="bg-primary-600 shadow-lg shadow-primary-100"
                    to="/rooms"
                />
                {isAdmin && (
                    <StatCard
                        icon={CalendarClock}
                        label="การจองทั้งหมด"
                        value={stats.bookings}
                        color="bg-amber-500 shadow-lg shadow-amber-100"
                        to="/bookings"
                    />
                )}
                <StatCard
                    icon={CheckCircle2}
                    label="ประชุมวันนี้ของคุณ"
                    value={stats.today}
                    color="bg-emerald-500 shadow-lg shadow-emerald-100"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Upcoming Meetings */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">รายการประชุมวันนี้</h3>
                        <Link to="/all-bookings" className="text-sm font-semibold text-primary-600 hover:text-primary-700">ดูทั้งหมด</Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">กำลังโหลด...</div>
                        ) : upcoming.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CalendarClock className="text-slate-300" size={32} />
                                </div>
                                <p className="text-slate-500 font-medium">ยังไม่มีรายการประชุมในวันนี้</p>
                                <Link to="/rooms" className="text-primary-600 font-semibold text-sm mt-2 inline-block">จองห้องประชุมตอนนี้</Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {upcoming.map((booking) => {
                                    const isMine = booking.user_id === user?.id
                                    return (
                                        <div
                                            key={booking.id}
                                            className={cn(
                                                "p-5 transition-all flex items-center justify-between group relative border-l-4",
                                                isMine
                                                    ? "bg-primary-50/40 hover:bg-primary-50/60 border-l-primary-500"
                                                    : "hover:bg-slate-50 border-l-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "flex flex-col items-center justify-center min-w-[64px] h-16 rounded-xl transition-colors",
                                                    isMine ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    <span className="text-xs font-bold uppercase opacity-80">{formatThaiDate(booking.start_time, 'MMM')}</span>
                                                    <span className="text-xl font-black">{formatThaiDate(booking.start_time, 'dd')}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{booking.title}</h4>
                                                        {isMine && (
                                                            <span className="text-[10px] font-bold bg-primary-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">ของคุณ</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                        <span className="flex items-center gap-1 font-medium"><DoorOpen size={14} /> {booking.rooms?.name}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                        <span className={cn(
                                                            "font-medium",
                                                            isMine ? "text-primary-700" : "text-slate-600"
                                                        )}>โดย: {isMine ? 'คุณ' : booking.requester_name}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                        <span>{format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {booking.meeting_link && (
                                                    <a
                                                        href={booking.meeting_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            "p-2 rounded-lg transition-all border",
                                                            isMine
                                                                ? "bg-primary-600 text-white hover:bg-primary-700 border-transparent shadow-md"
                                                                : "text-primary-600 hover:bg-primary-50 border-transparent hover:border-primary-100"
                                                        )}
                                                        title="เข้าร่วมประชุม"
                                                    >
                                                        <ExternalLink size={20} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => setViewingBooking(booking)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-all border",
                                                        isMine
                                                            ? "bg-white text-primary-600 hover:bg-primary-50 border-primary-200"
                                                            : "text-slate-400 hover:text-primary-600 hover:bg-primary-50 border-transparent hover:border-primary-100"
                                                    )}
                                                    title="ดูรายละเอียด"
                                                >
                                                    <Info size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900">ตัวช่วยเร่งด่วน</h3>
                    <div className="space-y-3">
                        <Link
                            to="/rooms"
                            className="w-full flex items-center gap-4 p-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 group"
                        >
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Plus size={24} />
                            </div>
                            <div>
                                <p className="font-bold">จองห้องประชุม</p>
                                <p className="text-xs text-primary-100">ค้นหาห้องว่าง</p>
                            </div>
                        </Link>

                        {isAdmin && (
                            <Link
                                to="/admin/rooms"
                                className="w-full flex items-center gap-4 p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 group"
                            >
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                    <SettingsIcon size={22} />
                                </div>
                                <div>
                                    <p className="font-bold">การตั้งค่า Admin</p>
                                    <p className="text-xs text-slate-400">จัดการห้องและ Logs</p>
                                </div>
                            </Link>
                        )}
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden mt-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20" />
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-primary-200 mb-1">ข้อมูลประกอบการจอง</p>
                            <p className="text-lg font-bold">ช่วงเวลาที่มีการจองสูงสุดคือ 10:00 - 14:00 น.</p>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs text-slate-400">หลีกเลี่ยงช่วงเวลาดังกล่าวด้วยการจองช่วงเช้า</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Details Modal (Dashboard version) */}
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
                                            <MapPin size={16} /> โรงพยาบาลรามคำแหง 2
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">วันที่</span>
                                        <p className="text-slate-700 font-bold">{formatThaiDate(viewingBooking.start_time, 'd MMMM yyyy')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">เวลา</span>
                                        <p className="text-slate-700 font-bold">{format(new Date(viewingBooking.start_time), 'HH:mm')} - {format(new Date(viewingBooking.end_time), 'HH:mm')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ผู้จอง</span>
                                        <p className="text-slate-700 font-bold">
                                            {viewingBooking.user_id === user?.id ? 'คุณ (เจ้าของการจอง)' : viewingBooking.requester_name || 'ไม่ระบุ'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">แผนก/เบอร์โทร</span>
                                        <p className="text-slate-700 font-bold">{viewingBooking.department || 'ไม่ระบุ'}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">อีเมล (Gmail)</span>
                                    <p className="text-slate-700 font-bold break-all">
                                        {viewingBooking.requester_email || 'ไม่ระบุ'}
                                    </p>
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
                                            className="block w-full text-center py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-100"
                                        >
                                            <ExternalLink size={18} /> เปิดลิงก์ประชุม
                                        </a>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setViewingBooking(null)}
                                className="w-full py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors mt-4"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
