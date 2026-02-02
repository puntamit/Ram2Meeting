import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ConfirmModal from '../components/ConfirmModal'
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    X,
    Save,
    DoorOpen,
    Users,
    MapPin,
    Wrench,
    CheckCircle,
    AlertTriangle
} from 'lucide-react'

export default function AdminRooms() {
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingRoom, setEditingRoom] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        building: '',
        floor: '',
        capacity: '',
        equipment: [],
        image_url: '',
        status: 'available'
    })
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [errorMsg, setErrorMsg] = useState(null)

    const availableEquipment = ['Projector', 'TV', 'Video Conference', 'Whiteboard', 'Coffee Machine']

    useEffect(() => {
        fetchRooms()
    }, [])

    const fetchRooms = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase.from('rooms').select('*').order('name')
            if (error) throw error
            setRooms(data || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (room = null) => {
        if (room) {
            setEditingRoom(room)
            setFormData({
                name: room.name,
                building: room.building,
                floor: room.floor,
                capacity: room.capacity,
                equipment: room.equipment || [],
                image_url: room.image_url || '',
                status: room.status
            })
        } else {
            setEditingRoom(null)
            setFormData({
                name: '',
                building: '',
                floor: '',
                capacity: '',
                equipment: [],
                image_url: '',
                status: 'available'
            })
        }
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingRoom) {
                const { error } = await supabase
                    .from('rooms')
                    .update(formData)
                    .eq('id', editingRoom.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('rooms').insert(formData)
                if (error) throw error
            }
            setShowModal(false)
            fetchRooms()
        } catch (error) {
            console.error('Error saving room:', error)
            setErrorMsg(error.message)
        }
    }

    const handleDelete = async () => {
        if (!confirmDelete) return
        try {
            const { error } = await supabase.from('rooms').delete().eq('id', confirmDelete)
            if (error) throw error
            fetchRooms()
            setConfirmDelete(null)
        } catch (error) {
            console.error('Error deleting room:', error)
            setErrorMsg(error.message)
        }
    }

    const toggleEquipment = (item) => {
        setFormData(prev => ({
            ...prev,
            equipment: prev.equipment.includes(item)
                ? prev.equipment.filter(e => e !== item)
                : [...prev.equipment, item]
        }))
    }

    const filteredRooms = rooms.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.building.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">จัดการห้องประชุม</h1>
                    <p className="text-slate-500">เพิ่ม แก้ไข หรือลบห้องประชุมที่ให้บริการ</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                >
                    <Plus size={20} />
                    เพิ่มห้องประชุมใหม่
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="ค้นหาห้อง..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">ห้อง</th>
                                <th className="px-6 py-4">อาคาร/ชั้น</th>
                                <th className="px-6 py-4 text-center">ความจุ</th>
                                <th className="px-6 py-4">อุปกรณ์</th>
                                <th className="px-6 py-4">สถานะ</th>
                                <th className="px-6 py-4 text-right">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">กำลังโหลด...</td></tr>
                            ) : filteredRooms.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">ไม่พบข้อมูลห้องประชุม</td></tr>
                            ) : (
                                filteredRooms.map(room => (
                                    <tr key={room.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                    <DoorOpen size={20} />
                                                </div>
                                                <span className="font-bold text-slate-900">{room.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="font-medium text-slate-700">{room.building}</p>
                                                <p className="text-slate-500 text-xs">ชั้น {room.floor}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-sm font-bold text-slate-600">
                                                <Users size={14} /> {room.capacity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {room.equipment?.map(e => (
                                                    <span key={e} className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase tracking-tighter">{e}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                                room.status === 'available' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                            )}>
                                                {room.status === 'available' ? <CheckCircle size={14} /> : <Wrench size={14} />}
                                                {room.status === 'available' ? 'ว่าง' : room.status === 'maintenance' ? 'ซ่อมบำรุง' : 'ไม่ว่าง'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(room)}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(room.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">{editingRoom ? 'แก้ไขห้องประชุม' : 'เพิ่มห้องประชุมใหม่'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">ชื่อห้อง</label>
                                        <input
                                            required
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-100"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">อาคาร</label>
                                        <input
                                            required
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                            value={formData.building}
                                            onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">ชั้น</label>
                                        <input
                                            required
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                            value={formData.floor}
                                            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">ความจุ (คน)</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">สถานะ</label>
                                        <select
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="available">ว่าง / เปิดใช้งาน</option>
                                            <option value="maintenance">ซ่อมบำรุง</option>
                                            <option value="unavailable">ปิดชั่วคราว</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">URL รูปภาพห้องประชุม</label>
                                        <input
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-100"
                                            placeholder="https://example.com/room-image.jpg"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">สิ่งอำนวยความสะดวก</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableEquipment.map(item => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => toggleEquipment(item)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                                                    formData.equipment.includes(item)
                                                        ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-100"
                                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                                )}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">ยกเลิก</button>
                                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    {editingRoom ? 'บันทึกการแก้ไข' : 'สร้างห้องประชุม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                title="ยืนยันการลบห้องประชุม"
                message="คุณแน่ใจหรือไม่ว่าต้องการลบห้องประชุมนี้? การดำเนินการนี้จะลบข้อมูลการจองทั้งหมดที่เกี่ยวข้องและไม่สามารถย้อนกลับได้"
                confirmText="ลบข้อมูล"
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

function cn(...inputs) {
    return inputs.filter(Boolean).join(' ')
}
