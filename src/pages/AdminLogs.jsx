import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
    History,
    Search,
    Calendar,
    User as UserIcon,
    Tag,
    FileText,
    Clock,
    ArrowRight,
    Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { formatThaiDate } from '../lib/utils'

export default function AdminLogs() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('meeting_logs')
                .select(`
          *,
          bookings(title),
          profiles:user_id(full_name)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setLogs(data || [])
        } catch (error) {
            console.error('Error fetching logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.bookings?.title?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">บันทึกกิจกรรม</h1>
                    <p className="text-slate-500">ประวัติการทำรายการทั้งหมดในระบบ</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-semibold text-sm">
                    <Filter size={18} />
                    ตัวกรอง
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="ค้นหาตามผู้ใช้งาน, การกระทำ หรือชื่อการประชุม..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-100 transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">วัน-เวลา</th>
                                <th className="px-6 py-4">ผู้ใช้งาน</th>
                                <th className="px-6 py-4">การกระทำ</th>
                                <th className="px-6 py-4">ห้องประชุม</th>
                                <th className="px-6 py-4">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">กำลังโหลด...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">ไม่พบข้อมูลบันทึกกิจกรรม</td></tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{formatThaiDate(log.created_at, 'd MMM yyyy')}</span>
                                                <span className="text-xs text-slate-400">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                                    <UserIcon size={14} />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900">{log.profiles?.full_name || 'ระบบ'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                                                log.action === 'booked' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    log.action === 'cancelled' ? "bg-red-50 text-red-700 border-red-100" :
                                                        "bg-primary-50 text-primary-700 border-primary-100"
                                            )}>
                                                {log.action === 'booked' ? 'จองห้อง' : log.action === 'cancelled' ? 'ยกเลิกจอง' : log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-600 italic">
                                                {log.bookings?.title || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-[300px] truncate text-xs text-slate-400 font-mono">
                                                {JSON.stringify(log.details)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function cn(...inputs) {
    return inputs.filter(Boolean).join(' ')
}
