-- Migration: Add platform and script_style columns to scripts table
ALTER TABLE scripts
  ADD COLUMN platform text CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'twitter')),
  ADD COLUMN script_style text CHECK (script_style IN ('short', 'medium', 'long'));
