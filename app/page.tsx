"use client";

import { useAuth } from './contexts/AuthContext';
import { redirect } from 'next/navigation';
import HomeComponent from './home/home';
import Loading from './loading';

export default function Home() {
    const { isAuthenticated, isLoaded } = useAuth();
    
    // Wait for auth state to load before making decisions
    if (!isLoaded) {
        return <Loading />; // or a proper loading component
    }
    
    if (isAuthenticated) {
        return <HomeComponent />;
    } else {
        redirect('/login');
    }
}
