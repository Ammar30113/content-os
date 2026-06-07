export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      content_ideas: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          brief: string | null;
          source_url: string | null;
          source_summary: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          brief?: string | null;
          source_url?: string | null;
          source_summary?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_ideas"]["Insert"]>;
        Relationships: [];
      };
      generated_posts: {
        Row: {
          id: string;
          user_id: string;
          idea_id: string | null;
          platform: string;
          post_type: string;
          tone: string;
          pillar: string | null;
          template_type: string | null;
          rallio_pillar: string | null;
          primary_goal: string | null;
          secondary_goal: string | null;
          hook: string | null;
          headline: string | null;
          subhead: string | null;
          caption: string | null;
          hashtags: string[] | null;
          cta: string | null;
          carousel_slides: Json;
          reel_script: string | null;
          x_version: string | null;
          linkedin_version: string | null;
          image_prompt: string | null;
          template_fields: Json;
          image_url: string | null;
          image_status: string;
          image_error: string | null;
          status: string;
          scheduled_for: string | null;
          published_at: string | null;
          publish_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          idea_id?: string | null;
          platform?: string;
          post_type?: string;
          tone?: string;
          pillar?: string | null;
          template_type?: string | null;
          rallio_pillar?: string | null;
          primary_goal?: string | null;
          secondary_goal?: string | null;
          hook?: string | null;
          headline?: string | null;
          subhead?: string | null;
          caption?: string | null;
          hashtags?: string[] | null;
          cta?: string | null;
          carousel_slides?: Json;
          reel_script?: string | null;
          x_version?: string | null;
          linkedin_version?: string | null;
          image_prompt?: string | null;
          template_fields?: Json;
          image_url?: string | null;
          image_status?: string;
          image_error?: string | null;
          status?: string;
          scheduled_for?: string | null;
          published_at?: string | null;
          publish_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["generated_posts"]["Insert"]>;
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          storage_path: string;
          public_url: string;
          source: string;
          prompt: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          storage_path: string;
          public_url: string;
          source: string;
          prompt?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Insert"]>;
        Relationships: [];
      };
      post_analytics: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          platform: string | null;
          impressions: number | null;
          likes: number | null;
          comments: number | null;
          shares: number | null;
          saves: number | null;
          clicks: number | null;
          recorded_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          platform?: string | null;
          impressions?: number | null;
          likes?: number | null;
          comments?: number | null;
          shares?: number | null;
          saves?: number | null;
          clicks?: number | null;
          recorded_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["post_analytics"]["Insert"]>;
        Relationships: [];
      };
      publishing_jobs: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          platform: string;
          status: string;
          scheduled_for: string;
          attempts: number;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          platform: string;
          status?: string;
          scheduled_for: string;
          attempts?: number;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["publishing_jobs"]["Insert"]>;
        Relationships: [];
      };
      social_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          account_name: string | null;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          account_name?: string | null;
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["social_accounts"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
