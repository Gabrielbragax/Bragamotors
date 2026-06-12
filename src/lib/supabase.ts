import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mdxpwztivordpuxxwtse.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHB3enRpdm9yZHB1eHh3dHNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIzNTg4MSwiZXhwIjoyMDk2ODExODgxfQ.oI2yrAP0XhMlrT5Kx4lWXgmsALHAtU3wOwa2pcCKQoo'

export const supabase = createClient(supabaseUrl, supabaseKey)
