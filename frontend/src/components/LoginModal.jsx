import React from 'react';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden">
                {/* Background blobs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 text-2xl">
                        ☁️
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sync Your Streak</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                        Don't lose your hydration history. Create a secure account to back up your data across devices.
                    </p>

                    <button
                        onClick={onLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-95 text-sm font-semibold mb-4"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        Sign in with Google
                    </button>

                    <button
                        onClick={onClose}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
                    >
                        Continue as Guest (Unsafe)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
