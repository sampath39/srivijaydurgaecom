require('dotenv').config()
const { Client } = require('pg')

const connectionString = process.env.DATABASE_URL

async function run() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    console.log('Updating handle_new_user() trigger function in database...')
    const query = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, avatar_url, phone)
        VALUES (
          NEW.id,
          COALESCE(NEW.email, ''),
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
          COALESCE(NEW.raw_user_meta_data->>'phone', '')
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name),
          avatar_url = COALESCE(NULLIF(profiles.avatar_url, ''), EXCLUDED.avatar_url),
          phone = COALESCE(NULLIF(profiles.phone, ''), EXCLUDED.phone),
          updated_at = now();
        RETURN NEW;
      EXCEPTION WHEN OTHERS THEN
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
    await client.query(query)
    console.log('Trigger function updated successfully.')
  } catch (err) {
    console.error('Error updating trigger function:', err.message)
  } finally {
    await client.end()
  }
}

run()
