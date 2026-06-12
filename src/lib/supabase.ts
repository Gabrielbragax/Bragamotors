import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mdxpwztivordpuxxwtse.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHB3enRpdm9yZHB1eHh3dHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzU4ODEsImV4cCI6MjA5NjgxMTg4MX0.5GPQi9NKwOIazZEVgEBMQM0wRz6PkJuctOK0nXbc8ZU'

export const supabase = createClient(supabaseUrl, supabaseKey)
