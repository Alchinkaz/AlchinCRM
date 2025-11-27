// Утилиты для работы с CRM базой данных
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    // Для сборки создаем заглушку, чтобы не падало
    supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
    return supabaseClient;
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
});

// Типы для CRM
export interface CRMUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  telegram_id?: string;
  role_id?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMRole {
  id: string;
  name: 'admin' | 'manager' | 'installer';
  description?: string;
  permissions: Record<string, any>;
}

export interface CRMClient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company_name?: string;
  bin_iin?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMDeal {
  id: string;
  client_id?: string;
  manager_id?: string;
  title: string;
  description?: string;
  status: 'new' | 'contacted' | 'negotiation' | 'agreement' | 'in_progress' | 'completed' | 'cancelled';
  total_amount: number;
  cost_price: number;
  expenses: number;
  profit: number;
  manager_bonus_percent: number;
  manager_bonus_amount: number;
  sale_date?: string;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMTask {
  id: string;
  deal_id?: string;
  created_by?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  status: 'new' | 'in_progress' | 'on_approval' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  service_type?: string;
  address?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  client_signature?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMGPSDevice {
  id: string;
  country: string;
  city?: string;
  vehicle_number: string;
  login?: string;
  owner_phone?: string;
  owner_email?: string;
  imei?: string;
  sim_number?: string;
  object_name?: string;
  admiral_device_id?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Функции для работы с пользователями
export async function getCRMUser(userId: string): Promise<CRMUser | null> {
  const { data, error } = await getSupabaseClient()
    .from('crm_users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getCRMUserByEmail(email: string): Promise<CRMUser | null> {
  const { data, error } = await supabase
    .from('crm_users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) return null;
  return data;
}

// Функции для работы с ролями
export async function getCRMRole(roleId: string): Promise<CRMRole | null> {
  const { data, error } = await supabase
    .from('crm_roles')
    .select('*')
    .eq('id', roleId)
    .single();
  
  if (error) return null;
  return data;
}

// Функции для работы с клиентами
export async function getCRMClients(): Promise<CRMClient[]> {
  const { data, error } = await supabase
    .from('crm_clients')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createCRMClient(client: Omit<CRMClient, 'id' | 'created_at' | 'updated_at'>): Promise<CRMClient> {
  const { data, error } = await supabase
    .from('crm_clients')
    .insert(client)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Функции для работы со сделками
export async function getCRMDeals(filters?: { manager_id?: string; status?: string }): Promise<CRMDeal[]> {
  let query = supabase
    .from('crm_deals')
    .select('*');
  
  if (filters?.manager_id) {
    query = query.eq('manager_id', filters.manager_id);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createCRMDeal(deal: Omit<CRMDeal, 'id' | 'profit' | 'manager_bonus_amount' | 'created_at' | 'updated_at'>): Promise<CRMDeal> {
  const { data, error } = await supabase
    .from('crm_deals')
    .insert(deal)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Функции для работы с задачами
export async function getCRMTasks(filters?: { assigned_to?: string; status?: string }): Promise<CRMTask[]> {
  let query = supabase
    .from('crm_tasks')
    .select('*');
  
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query.order('scheduled_start', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function createCRMTask(task: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>): Promise<CRMTask> {
  const { data, error } = await supabase
    .from('crm_tasks')
    .insert(task)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCRMTask(taskId: string, updates: Partial<CRMTask>): Promise<CRMTask> {
  const { data, error } = await supabase
    .from('crm_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Функции для работы с GPS устройствами
export async function getCRMGPSDevices(): Promise<CRMGPSDevice[]> {
  const { data, error } = await supabase
    .from('crm_gps_devices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createCRMGPSDevice(device: Omit<CRMGPSDevice, 'id' | 'created_at' | 'updated_at'>): Promise<CRMGPSDevice> {
  const { data, error } = await supabase
    .from('crm_gps_devices')
    .insert(device)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

