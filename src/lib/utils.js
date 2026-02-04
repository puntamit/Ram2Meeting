import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function formatThaiDate(date, formatStr = 'dd/MM/yyyy') {
    if (!date) return '-'
    const d = new Date(date)

    // Add 543 to the year for Buddhist Era (BE)
    // We use a safe replacement to avoid double-replacing if the user provides a custom format with 'yyyy'
    let result = format(d, formatStr, { locale: th })

    // If format string contains yyyy or yy, we manually swap with BE year
    const beYear = d.getFullYear() + 543
    if (formatStr.includes('yyyy')) {
        result = result.replace(String(d.getFullYear()), String(beYear))
    } else if (formatStr.includes('yy')) {
        const ceYearShort = String(d.getFullYear()).slice(-2)
        const beYearShort = String(beYear).slice(-2)
        result = result.replace(ceYearShort, beYearShort)
    }

    return result
}
