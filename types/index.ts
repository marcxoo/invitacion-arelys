
export type InvitationStatus = 'pending' | 'confirmed' | 'declined';

export interface Invitation {
    id: string;
    family_name: string;
    guest_limit: number;
    confirmed_count: number;
    status: InvitationStatus;
    view_key: string; // Unique slug/UUID for the link
    is_public?: boolean; // If true, anyone can rsvp (legacy mode)
    phone?: string;
    created_at?: string;
}

export interface RsvpPayload {
    name: string;
    attending: boolean;
    count: number;
    invitation_id?: string; // Optional if public
}
