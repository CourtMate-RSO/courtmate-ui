'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Facility {
    id: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
    };
    address_line: string;
    city: string;
}

interface Court {
    id: string;
    name: string;
    sport: string;
    indoor: boolean;
    slot_minutes: number;
    min_duration: number;
    max_duration: number;
}

interface FacilityManagerProps {
    facility: Facility;
}

export default function FacilityManager({ facility }: FacilityManagerProps) {
    const { data: session } = useSession();
    const [courts, setCourts] = useState<Court[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingCourt, setIsAddingCourt] = useState(false);
    const [form, setForm] = useState({
        name: '',
        sport: 'TENNIS',
        indoor: false,
        slot_minutes: 60,
        min_duration: 60,
        max_duration: 120
    });

    const fetchCourts = async () => {
        try {
            const url = `/api/proxy/court/api/v1/facilities/${facility.id}/courts`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session?.accessToken}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setCourts(data);
            }
        } catch (error) {
            console.error('Error fetching courts:', error);
        }
    };

    useEffect(() => {
        if (facility.id) {
            fetchCourts();
        }
    }, [facility.id]);

    const handleAddCourt = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = `/api/proxy/court/api/v1/facilities/${facility.id}/courts`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(form)
            });

            if (response.ok) {
                await fetchCourts();
                setIsAddingCourt(false);
                setForm({
                    name: '',
                    sport: 'TENNIS',
                    indoor: false,
                    slot_minutes: 60,
                    min_duration: 60,
                    max_duration: 120
                });
            } else {
                alert('Failed to add court');
            }
        } catch (error) {
            console.error('Error adding court:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{facility.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{facility.address_line}, {facility.city}</p>
                </div>
                <button
                    onClick={() => setIsAddingCourt(!isAddingCourt)}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                    {isAddingCourt ? 'Cancel' : '+ Add Court'}
                </button>
            </div>

            {isAddingCourt && (
                <form onSubmit={handleAddCourt} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">New Court Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Court 1"
                                className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sport</label>
                            <select
                                className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                value={form.sport}
                                onChange={e => setForm({ ...form, sport: e.target.value })}
                            >
                                <option value="TENNIS">Tennis</option>
                                <option value="PADEL">Padel</option>
                                <option value="BADMINTON">Badminton</option>
                                <option value="PICKLEBALL">Pickleball</option>
                                <option value="SQUASH">Squash</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="flex items-center mt-6">
                            <input
                                type="checkbox"
                                id={`indoor-${facility.id}`}
                                className="mr-2"
                                checked={form.indoor}
                                onChange={e => setForm({ ...form, indoor: e.target.checked })}
                            />
                            <label htmlFor={`indoor-${facility.id}`} className="text-sm text-gray-700 dark:text-gray-300">Indoor Court</label>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Slot time (min)</label>
                            <input type="number" className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white" value={form.slot_minutes} onChange={e => setForm({ ...form, slot_minutes: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Min Duration (min)</label>
                            <input type="number" className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white" value={form.min_duration} onChange={e => setForm({ ...form, min_duration: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Duration (min)</label>
                            <input type="number" className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white" value={form.max_duration} onChange={e => setForm({ ...form, max_duration: parseInt(e.target.value) })} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50">
                            {isLoading ? 'Saving...' : 'Save Court'}
                        </button>
                    </div>
                </form>
            )}

            <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Courts ({courts.length})</h4>
                {courts.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No courts added yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {courts.map(court => (
                            <div key={court.id} className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded flex flex-col">
                                <div className="flex justify-between items-start">
                                    <span className="font-medium text-gray-800 dark:text-white">{court.name}</span>
                                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">{court.sport}</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex gap-2">
                                    <span>{court.indoor ? 'Indoor' : 'Outdoor'}</span>
                                    <span>•</span>
                                    <span>{court.slot_minutes} min slots</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
