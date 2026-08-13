import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  /** إخفاء زر الإغلاق (X) في الحالات التي يجب فيها إجبار المستخدم على اتخاذ قرار داخل النافذة */
  hideCloseButton?: boolean;
}

export function Modal({ title, onClose, children, hideCloseButton = false }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {!hideCloseButton && onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
