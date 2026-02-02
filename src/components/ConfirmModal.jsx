import { X, AlertCircle } from 'lucide-react'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', type = 'danger' }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />
            <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 border border-slate-100">
                <div className="p-8 pb-6 flex flex-col items-center text-center">
                    <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner",
                        type === 'danger' ? "bg-red-50 text-red-500" : "bg-primary-50 text-primary-500"
                    )}>
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
                </div>

                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "flex-1 py-3 text-sm font-bold text-white rounded-2xl transition-all shadow-lg",
                            type === 'danger'
                                ? "bg-red-500 hover:bg-red-600 shadow-red-100"
                                : "bg-primary-600 hover:bg-primary-700 shadow-primary-100"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

function cn(...inputs) {
    return inputs.filter(Boolean).join(' ')
}
