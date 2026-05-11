const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  { auth: { persistSession: false } }
);

module.exports = supabase;
