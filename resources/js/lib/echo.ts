import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Echo?: Echo<'reverb'>;
        Pusher: typeof Pusher;
    }
}

const shouldInitializeEcho = typeof window !== 'undefined' && Boolean(import.meta.env.VITE_REVERB_APP_KEY);

let echo: Echo<'reverb'> | null = null;

if (shouldInitializeEcho) {
    window.Pusher = Pusher;
    echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });
    window.Echo = echo;
}

export default echo;
