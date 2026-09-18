import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return { supabase, user };
}

export async function requireRole(allowedRoles: string[]) {
  const { supabase, user } = await requireAuth();

  // Use admin client to bypass RLS when reading the profile
  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || !allowedRoles.includes(profile.role)) {
    console.error('DEBUG UNAUTHORIZED:', { error, profile, allowedRoles, user_id: user.id });
    throw new Error('Unauthorized');
  }

  return { supabase, user, role: profile.role };
}

export async function logAudit(
  supabase: any,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: any
) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
  }
}
