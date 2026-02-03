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
    Settings as SettingsIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

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
            <Link to={to} className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
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

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            const today = new Date().toISOString().split('T')[0]
            const todayStart = `${today}T00:00:00.000Z`
            const todayEnd = `${today}T23:59:59.999Z`

            const [roomsCount, bookingsCount, todayCount, upcomingData] = await Promise.all([
                supabase.from('rooms').select('*', { count: 'exact', head: true }),
                supabase.from('bookings').select('*', { count: 'exact', head: true }),
                supabase.from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .gte('start_time', todayStart)
                    .lte('start_time', todayEnd),
                supabase.from('bookings')
                    .select('*, rooms(name)')
                    .gte('start_time', new Date().toISOString())
                    .order('start_time', { ascending: true })
                    .limit(5)
            ])

            setStats({
                rooms: roomsCount.count || 0,
                bookings: bookingsCount.count || 0,
                today: todayCount.count || 0
            })
            setUpcoming(upcomingData.data || [])
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={DoorOpen}
                    label="ห้องทั้งหมด"
                    value={stats.rooms}
                    color="bg-primary-600 shadow-lg shadow-primary-100"
                    to="/rooms"
                />
                <StatCard
                    icon={CalendarClock}
                    label="การจองทั้งหมด"
                    value={stats.bookings}
                    color="bg-amber-500 shadow-lg shadow-amber-100"
                    to="/bookings"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="ประชุมวันนี้"
                    value={stats.today}
                    color="bg-emerald-500 shadow-lg shadow-emerald-100"
                    to="/bookings"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Upcoming Meetings */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">การประชุมที่กำลังจะถึง</h3>
                        <Link to="/bookings" className="text-sm font-semibold text-primary-600 hover:text-primary-700">ดูทั้งหมด</Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">กำลังโหลด...</div>
                        ) : upcoming.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CalendarClock className="text-slate-300" size={32} />
                                </div>
                                <p className="text-slate-500 font-medium">ยังไม่มีการประชุมที่ถูกจองไว้</p>
                                <Link to="/rooms" className="text-primary-600 font-semibold text-sm mt-2 inline-block">จองห้องประชุมตอนนี้</Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {upcoming.map((booking) => (
                                    <div key={booking.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center min-w-[64px] h-16 bg-primary-50 text-primary-700 rounded-xl">
                                                <span className="text-xs font-bold uppercase">{format(new Date(booking.start_time), 'MMM')}</span>
                                                <span className="text-xl font-black">{format(new Date(booking.start_time), 'dd')}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{booking.title}</h4>
                                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1 font-medium"><DoorOpen size={14} /> {booking.rooms?.name}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    <span>{format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {booking.meeting_link && (
                                            <a
                                                href={booking.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                                            >
                                                <ExternalLink size={20} />
                                            </a>
                                        )}
                                    </div>
                                ))}
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
        </div>
    )
}
