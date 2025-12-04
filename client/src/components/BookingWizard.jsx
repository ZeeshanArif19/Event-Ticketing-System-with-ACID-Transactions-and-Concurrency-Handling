import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CreditCard, CheckCircle, Calendar, MapPin, Ticket, Download, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';
import SeatMap from './SeatMap';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { getStoredToken } from '../api/auth';

const BookingWizard = ({ event, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bookingError, setBookingError] = useState(null);
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();

    const subtotal = selectedSeats.reduce((sum, seat) => sum + parseFloat(seat.price || 0), 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    const handleNext = () => {
        if (step === 1 && selectedSeats.length === 0) {
            toast({
                title: "No seats selected",
                description: "Please select at least one seat to proceed.",
                variant: "destructive"
            });
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        setBookingError(null);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('Please log in to book tickets');
            }

            // Book each selected seat via API
            const bookingPromises = selectedSeats.map(seat =>
                axios.post(
                    'http://localhost:5000/api/bookings/book',
                    { seatId: seat.id, eventId: event.id },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
            );

            const results = await Promise.allSettled(bookingPromises);

            // Check for any failures
            const failures = results.filter(r => r.status === 'rejected');
            const successes = results.filter(r => r.status === 'fulfilled');

            if (failures.length > 0) {
                const errorMessages = failures.map(f => f.reason?.response?.data?.error || 'Booking failed');
                if (successes.length > 0) {
                    toast({
                        title: `Partial Success`,
                        description: `${successes.length} seat(s) booked. ${failures.length} failed: ${errorMessages[0]}`,
                        variant: "warning"
                    });
                } else {
                    throw new Error(errorMessages[0]);
                }
            }

            setIsProcessing(false);
            setStep(4); // Success step

            setTimeout(() => {
                onComplete();
            }, 3000);
        } catch (error) {
            console.error('Booking error:', error);
            setIsProcessing(false);
            setBookingError(error.response?.data?.error || error.message || 'Booking failed. Please try again.');
            toast({
                title: "Booking Failed",
                description: error.response?.data?.error || error.message || 'Please try again.',
                variant: "destructive"
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-2xl font-bold">Book Tickets</h2>
                        <p className="text-muted-foreground text-sm">{event.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary/30 h-1">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-background to-secondary/10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col"
                            >
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <Ticket className="w-5 h-5 text-primary" />
                                    Select Your Seats
                                </h3>
                                <SeatMap eventId={event?.id} onSelectionChange={setSelectedSeats} selectedSeats={selectedSeats} />
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-2xl mx-auto w-full"
                            >
                                <h3 className="text-xl font-semibold mb-6">Order Summary</h3>
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg mb-6">
                                    <div className="flex gap-4 mb-6 pb-6 border-b border-border">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary">
                                            <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">{event.name}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(event.event_date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                                {event.location}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        {selectedSeats.map((seat) => (
                                            <div key={seat.id} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {seat.tier} Seat (Row {seat.row}, No {seat.number})
                                                </span>
                                                <span className="font-medium">₹{seat.price}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 pt-4 border-t border-border">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Tax (18% GST)</span>
                                            <span>₹{tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold text-primary pt-2">
                                            <span>Total</span>
                                            <span>₹{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-xl mx-auto w-full"
                            >
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    Payment Details
                                </h3>

                                <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                                    {/* Visual Card */}
                                    <div className="w-full aspect-[1.586] bg-gradient-to-br from-primary to-purple-900 rounded-xl mb-8 p-6 text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="w-12 h-8 bg-white/20 rounded-md backdrop-blur-sm" />
                                            <span className="font-mono text-lg tracking-widest">VISA</span>
                                        </div>
                                        <div className="mt-auto">
                                            <div className="font-mono text-xl md:text-2xl tracking-widest mb-4 drop-shadow-md">
                                                •••• •••• •••• 4242
                                            </div>
                                            <div className="flex justify-between text-sm opacity-80">
                                                <span>CARD HOLDER</span>
                                                <span>EXPIRES</span>
                                            </div>
                                            <div className="flex justify-between font-medium tracking-wider">
                                                <span>JOHN DOE</span>
                                                <span>12/25</span>
                                            </div>
                                        </div>
                                    </div>

                                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Card Number</label>
                                            <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Expiry Date</label>
                                                <input type="text" placeholder="MM/YY" className="w-full p-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">CVC</label>
                                                <input type="text" placeholder="123" className="w-full p-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Cardholder Name</label>
                                            <input type="text" placeholder="John Doe" className="w-full p-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onAnimationComplete={() => {
                                    // Fire confetti from both sides
                                    const duration = 3000;
                                    const end = Date.now() + duration;

                                    const frame = () => {
                                        confetti({
                                            particleCount: 2,
                                            angle: 60,
                                            spread: 55,
                                            origin: { x: 0 },
                                            colors: ['#8b5cf6', '#ec4899', '#06b6d4']
                                        });
                                        confetti({
                                            particleCount: 2,
                                            angle: 120,
                                            spread: 55,
                                            origin: { x: 1 },
                                            colors: ['#8b5cf6', '#ec4899', '#06b6d4']
                                        });

                                        if (Date.now() < end) {
                                            requestAnimationFrame(frame);
                                        }
                                    };
                                    frame();
                                }}
                                className="h-full flex flex-col items-center justify-center text-center p-8"
                            >
                                {/* Animated Success Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
                                    className="w-28 h-28 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-500/30"
                                >
                                    <CheckCircle className="w-14 h-14 text-white" />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="flex items-center gap-2 justify-center mb-2">
                                        <Sparkles className="w-6 h-6 text-primary" />
                                        <h2 className="text-3xl font-bold">Booking Confirmed!</h2>
                                        <Sparkles className="w-6 h-6 text-primary" />
                                    </div>
                                    <p className="text-muted-foreground mb-6 max-w-md">
                                        Your tickets have been sent to your email. You can also view them in your dashboard.
                                    </p>

                                    {/* Booking Reference */}
                                    <div className="bg-secondary/50 border border-border rounded-xl p-4 mb-6 inline-block">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Booking Reference</p>
                                        <p className="font-mono text-lg font-bold text-primary">TKT-{Date.now().toString(36).toUpperCase()}</p>
                                    </div>

                                    <div className="animate-pulse text-primary font-medium flex items-center gap-2 justify-center">
                                        <span>Redirecting to dashboard</span>
                                        <span className="flex gap-1">
                                            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                                            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                                            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                                        </span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                {step < 4 && (
                    <div className="p-6 border-t border-border bg-card/50 backdrop-blur-md flex justify-between items-center">
                        <div className="text-sm">
                            {step === 1 && (
                                <span className="text-muted-foreground">
                                    Selected: <span className="text-foreground font-bold">{selectedSeats.length}</span> seats
                                    <span className="mx-2">|</span>
                                    Total: <span className="text-primary font-bold">₹{total.toFixed(2)}</span>
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {step > 1 && (
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-2.5 rounded-xl font-medium border border-border hover:bg-secondary transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={step === 3 ? handlePayment : handleNext}
                                disabled={step === 1 && selectedSeats.length === 0 || isProcessing}
                                className="px-8 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                            >
                                {isProcessing ? 'Processing...' : step === 3 ? 'Pay Now' : 'Continue'}
                                {!isProcessing && step < 3 && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default BookingWizard;
