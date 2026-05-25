require('dotenv').config()
const { Client } = require('pg')

const connectionString = process.env.DATABASE_URL

async function run() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    console.log('Setting up auto email-confirmation trigger...')

    // Create function that auto-confirms email on signup
    await client.query(`
      CREATE OR REPLACE FUNCTION public.auto_confirm_email()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE auth.users
          SET email_confirmed_at = NOW(),
              updated_at = NOW()
          WHERE id = NEW.id
            AND email_confirmed_at IS NULL;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
    console.log('✅ Function created.')

    // Drop old trigger if exists
    await client.query(`
      DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;
    `)

    // Create trigger on new user insert
    await client.query(`
      CREATE TRIGGER auto_confirm_email_trigger
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_email();
    `)
    console.log('✅ Trigger created.')

    // Also confirm ALL existing unconfirmed users right now
    const res = await client.query(`
      UPDATE auth.users
        SET email_confirmed_at = NOW(), updated_at = NOW()
        WHERE email_confirmed_at IS NULL;
    `)
    console.log(`✅ Confirmed ${res.rowCount} existing unverified user(s).`)

    console.log('\n🎉 Done! All new signups will be auto-confirmed — no email verification needed.')
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

run()
