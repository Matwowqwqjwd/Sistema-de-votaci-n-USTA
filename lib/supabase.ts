import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kjxnuxloyvkpinjxpchm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeG51eGxveXZrcGluanhwY2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MTIzOTcsImV4cCI6MjA2Mjk4ODM5N30.jUDDklwzUGvY7Pk_VCrtj4C5taw1eQg_nYxKe6aq4RU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
