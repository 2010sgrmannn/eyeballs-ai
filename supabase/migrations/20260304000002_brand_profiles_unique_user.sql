-- Add unique constraint on brand_profiles.user_id (one profile per user)
ALTER TABLE brand_profiles ADD CONSTRAINT brand_profiles_user_id_unique UNIQUE (user_id);
