-- ============================================================
-- Migration: Add special_discount column to profiles table
-- Run this in Supabase SQL Editor if the column doesn't exist yet
-- ============================================================

-- Add special_discount column (safe to run multiple times)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS special_discount NUMERIC(5,2) DEFAULT 0;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'special_discount';
