import { useEffect } from 'react';
import Icon from '../ui/Icon';
import { partnersUrl } from '../../data/siteConfig';

export default function PartnerAuthModal({ open, onClose }) {
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    if (!open || !partnersUrl) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Partner Login"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="relative w-full max-w-[460px] h-[85vh] overflow-hidden bg-transparent rounded-xl">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close Partner Login"
                    className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 !text-white hover:bg-white/25 transition-colors"
                >
                    <Icon name="close" size={18} />
                </button>

                <iframe
                    src={`${partnersUrl}/login?embed=1`}
                    title="Supplybase Partner Login"
                    className="h-full w-full border-0"
                />
            </div>
        </div>
    );
}