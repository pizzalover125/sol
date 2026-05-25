export type Profile = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export type Event = {
  id: string
  slug: string
  host_id: string
  title: string
  description: string | null
  cover_image_url: string | null
  location_name: string | null
  location_address: string | null
  starts_at: string
  ends_at: string | null
  capacity: number | null
  is_public: boolean
  status: 'draft' | 'published' | 'cancelled'
  created_at: string
}

export type Registration = {
  id: string
  event_id: string
  user_id: string
  status: 'confirmed' | 'cancelled'
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'is_public' | 'status'> & {
          is_public?: boolean
          status?: 'draft' | 'published' | 'cancelled'
        }
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
        Relationships: []
      }
      registrations: {
        Row: Registration
        Insert: Omit<Registration, 'id' | 'created_at' | 'status'> & {
          status?: 'confirmed' | 'cancelled'
        }
        Update: Partial<Omit<Registration, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
