import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Track how many modals are open so nested/concurrent modals don't prematurely unlock scroll.
let openCount = 0

export default function Modal({ open, onClose, title, children }) {
  const prevOpen = useRef(open)

  useEffect(() => {
    const wasOpen = prevOpen.current
    prevOpen.current = open

    if (open && !wasOpen) {
      openCount++
      if (openCount === 1) document.body.style.overflow = 'hidden'
    } else if (!open && wasOpen) {
      openCount = Math.max(0, openCount - 1)
      if (openCount === 0) document.body.style.overflow = ''
    }

    return () => {
      if (open) {
        openCount = Math.max(0, openCount - 1)
        if (openCount === 0) document.body.style.overflow = ''
      }
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — z-[60] beats BottomNav's z-50 */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Sheet — also z-[60], above backdrop via DOM order */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-[#161B27] rounded-t-3xl max-h-[90vh] overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="flex items-center justify-between px-5 pt-3 pb-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              >
                <X size={16} className="text-zinc-500" />
              </button>
            </div>
            <div className="px-5 pb-10">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
