export interface BrandProfileFormData {
  niche: string;
  brand_voice: string;
  values: string[];
  target_audience: string;
  content_style: string;
}

export interface BrandProfile extends BrandProfileFormData {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
