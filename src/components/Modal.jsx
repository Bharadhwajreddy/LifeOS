import { useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <X size={16} className="text-zinc-500" />
              </button>
            </div>
            <div className="px-5 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
