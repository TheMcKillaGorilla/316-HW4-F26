/**
 * AppLayout.tsx
 *
 * The frame every page behind the login shares: the header, and below it the
 * page whose URL matched, which goes where <Outlet> is.
 */
import { Outlet } from 'react-router';
import AppHeader from '@/components/AppHeader';

export default function AppLayout() {
    return (
        <div id="app" className="flex h-screen flex-col">
            <AppHeader />
            <Outlet />
        </div>
    );
}
