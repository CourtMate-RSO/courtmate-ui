export interface ReservationCreate {
    court_id: string;
    starts_at: string; // ISO 8601 datetime string
    ends_at: string;   // ISO 8601 datetime string
}

export interface Reservation {
    id: string;
    court_id: string;
    user_id: string;
    starts_at: string;
    ends_at: string;
    total_price: number;
    created_at: string;
    cancelled_at: string | null;
    cancel_reason: string | null;
}

export interface BookingError {
    error: string;
    details?: string;
}
