'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OverlayContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setError("Укажите ?userId= в строке URL для запуска оверлея");
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/db?action=getProfile&userId=${userId}`);
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Failed to load profile");
                }
                const data = await res.json();
                setProfile(data);
                setError(null);
            } catch (err) {
                console.error("Overlay sync error:", err);
                // Keep showing old data if fetch fails temporarily to prevent flickering on stream
            } finally {
                setLoading(false);
            }
        };

        // Fetch immediately and set sync interval
        fetchProfile();
        const interval = setInterval(fetchProfile, 2000);

        return () => clearInterval(interval);
    }, [userId]);

    if (loading) {
        return (
            <div style={{ color: '#E5D3B3', fontFamily: 'Space Grotesk', fontSize: '0.8rem', padding: '10px', background: 'rgba(11, 11, 15, 0.7)', borderRadius: '6px', width: 'max-content' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '6px' }}></i>
                Синхронизация OBS Hud...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ color: '#C24141', fontFamily: 'Space Grotesk', fontSize: '0.8rem', padding: '10px', background: 'rgba(11, 11, 15, 0.85)', borderRadius: '6px', border: '1px solid #C24141', width: 'max-content' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                Оверлей: {error}
            </div>
        );
    }

    if (!profile) return null;

    // Convert balance to neat GTA dollars format
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="obs-overlay-hud animate-fade-in" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {/* Block 1: Character Name & Rank */}
            <div className="hud-block">
                <span className="label">Синдикат Moriarty</span>
                <span className="val">{profile.character_name}</span>
            </div>
            
            <div className="divider"></div>
            
            {/* Block 2: Family Status Role */}
            <div className="hud-block">
                <span className="label">Семейный ранг</span>
                <span className="val gold" style={{ textTransform: 'uppercase', fontSize: '0.85rem', fontFamily: 'Space Grotesk', fontWeight: 'bold' }}>
                    {profile.role}
                </span>
            </div>
            
            <div className="divider"></div>
            
            {/* Block 3: Safe balance */}
            <div className="hud-block">
                <span className="label">Сейф персонажа</span>
                <span className="val" style={{ color: '#00ff66', fontFamily: 'Space Grotesk' }}>
                    {formatMoney(profile.balance)}
                </span>
            </div>
            
            <div className="divider"></div>
            
            {/* Block 4: Recycled Freaks */}
            <div className="hud-block">
                <span className="label">Утилизировано фриков</span>
                <span className="val" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Space Grotesk', fontWeight: 'bold' }}>
                    <i className="fa-solid fa-user-slash" style={{ color: 'var(--primary-neon)', fontSize: '0.8rem' }}></i>
                    {profile.media_trash_counter || 0}
                </span>
            </div>
        </div>
    );
}

export default function StreamerOverlay() {
    return (
        <div style={{ background: 'transparent', minHeight: '100vh', padding: '20px', overflow: 'hidden' }}>
            <Suspense fallback={
                <div style={{ color: '#E5D3B3', fontFamily: 'Space Grotesk', fontSize: '0.8rem', padding: '10px' }}>
                    Загрузка...
                </div>
            }>
                <OverlayContent />
            </Suspense>
        </div>
    );
}
