import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, Loader2 } from 'lucide-react';
import axios from 'axios';

const SeatMap = ({ eventId, onSelectionChange, selectedSeats = [] }) => {
    const [seatGrid, setSeatGrid] = useState([]);
    const [tiers, setTiers] = useState([]);
    const [config, setConfig] = useState({ seat_rows: 10, seat_columns: 14, max_seats_per_booking: 8 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch real seats, tiers, and config from API
    useEffect(() => {
        const fetchData = async () => {
            if (!eventId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch seats, tiers, and config in parallel
                const [seatsRes, tiersRes, configRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/events/${eventId}/seats`),
                    axios.get(`http://localhost:5000/api/events/${eventId}/tiers`),
                    axios.get(`http://localhost:5000/api/events/${eventId}/config`)
                ]);

                const realSeats = seatsRes.data.seats || [];
                const tierData = tiersRes.data.tiers || [];
                const configData = configRes.data.config || { seat_rows: 10, seat_columns: 14, max_seats_per_booking: 8 };

                setTiers(tierData);
                setConfig(configData);

                // Organize seats into a grid
                // Parse seat_number like "A1", "B5" into row and column
                const seatMap = new Map();
                realSeats.forEach(seat => {
                    const match = seat.seat_number.match(/^([A-Z])(\d+)$/);
                    if (match) {
                        const row = match[1].charCodeAt(0) - 65; // A=0, B=1, etc.
                        const col = parseInt(match[2]) - 1; // 1-indexed to 0-indexed
                        const key = `${row}-${col}`;

                        // Determine tier based on row
                        const rowNum = row + 1;
                        let tier = tierData.find(t => rowNum >= t.row_start && rowNum <= t.row_end);
                        if (!tier) {
                            if (row < 2) {
                                tier = { name: 'VIP', price: 1500 };
                            } else if (row < 5) {
                                tier = { name: 'Premium', price: 1000 };
                            } else {
                                tier = { name: 'Standard', price: 500 };
                            }
                        }

                        seatMap.set(key, {
                            id: seat.id, // Real database ID
                            seatNumber: seat.seat_number,
                            row: row + 1,
                            number: col + 1,
                            status: seat.is_booked ? 'booked' : 'available',
                            tier: tier.name,
                            price: parseFloat(tier.price) || 500
                        });
                    }
                });

                // Build grid from seat map
                const rows = configData.seat_rows || 10;
                const cols = configData.seat_columns || 14;
                const grid = [];

                for (let r = 0; r < rows; r++) {
                    const rowSeats = [];
                    for (let c = 0; c < cols; c++) {
                        const key = `${r}-${c}`;
                        const seat = seatMap.get(key);
                        if (seat) {
                            rowSeats.push(seat);
                        }
                    }
                    if (rowSeats.length > 0) {
                        grid.push(rowSeats);
                    }
                }

                setSeatGrid(grid);
            } catch (err) {
                console.error('Error fetching seat data:', err);
                setError('Failed to load seats. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    const handleSeatClick = (seat) => {
        if (seat.status === 'booked') return;

        const isSelected = selectedSeats.some(s => s.id === seat.id);
        let newSelection;
        if (isSelected) {
            newSelection = selectedSeats.filter(s => s.id !== seat.id);
        } else {
            // Limit based on config
            if (selectedSeats.length >= config.max_seats_per_booking) return;
            newSelection = [...selectedSeats, seat];
        }
        onSelectionChange(newSelection);
    };

    const getTierColor = (tierName, status, isSelected) => {
        if (status === 'booked') return 'bg-muted text-muted-foreground cursor-not-allowed opacity-50';
        if (isSelected) return 'bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-110 border-primary';

        switch (tierName) {
            case 'VIP': return 'bg-amber-500/20 border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-white';
            case 'Premium': return 'bg-purple-500/20 border-purple-500/50 text-purple-500 hover:bg-purple-500 hover:text-white';
            default: return 'bg-blue-500/20 border-blue-500/50 text-blue-500 hover:bg-blue-500 hover:text-white';
        }
    };

    // Get unique tiers for legend
    const uniqueTiers = tiers.length > 0 ? tiers : [
        { name: 'VIP', price: 1500 },
        { name: 'Premium', price: 1000 },
        { name: 'Standard', price: 500 }
    ];

    if (loading) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading seats...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-red-500">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (seatGrid.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No seats available for this event.</p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center">
            {/* Screen / Stage */}
            <div className="w-full max-w-3xl mb-12 relative">
                <div className="h-16 w-full bg-gradient-to-b from-primary/20 to-transparent rounded-[50%] transform -perspective-x-12 blur-sm" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-muted-foreground text-sm font-medium tracking-[0.5em] uppercase">
                    Stage
                </div>
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-muted opacity-50" />
                    <span className="text-muted-foreground">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    <span className="text-foreground font-medium">Selected</span>
                </div>
                {uniqueTiers.map(tier => (
                    <div key={tier.name} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-md ${tier.name === 'VIP' ? 'bg-amber-500/20 border border-amber-500/50' :
                                tier.name === 'Premium' ? 'bg-purple-500/20 border border-purple-500/50' :
                                    'bg-blue-500/20 border border-blue-500/50'
                            }`} />
                        <span className="text-muted-foreground">{tier.name} (₹{parseFloat(tier.price)})</span>
                    </div>
                ))}
            </div>

            {/* Seat Grid */}
            <div className="overflow-x-auto max-w-full p-4 pb-12">
                <div className="flex flex-col gap-3 min-w-max">
                    {seatGrid.map((row, rIndex) => (
                        <div key={rIndex} className="flex gap-3 justify-center">
                            {row.map((seat) => {
                                const isSelected = selectedSeats.some(s => s.id === seat.id);
                                return (
                                    <motion.button
                                        key={seat.id}
                                        whileHover={seat.status !== 'booked' ? { scale: 1.2 } : {}}
                                        whileTap={seat.status !== 'booked' ? { scale: 0.9 } : {}}
                                        onClick={() => handleSeatClick(seat)}
                                        className={`
                                            w-8 h-8 md:w-10 md:h-10 rounded-t-lg rounded-b-md border transition-all duration-200 flex items-center justify-center text-xs font-medium relative group
                                            ${getTierColor(seat.tier, seat.status, isSelected)}
                                        `}
                                        title={`${seat.seatNumber} - ${seat.tier} - ₹${seat.price}`}
                                    >
                                        <span className="opacity-70">{seat.number}</span>

                                        {/* Tooltip */}
                                        {seat.status !== 'booked' && (
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-border">
                                                {seat.seatNumber} | ₹{seat.price}
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full">
                <Info className="w-4 h-4" />
                <span>Maximum {config.max_seats_per_booking} seats per booking</span>
            </div>
        </div>
    );
};

export default SeatMap;
