import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { supabase } from '@/lib/crm-db';

export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: 401 });
        }

        const { data: roles, error } = await supabase
            .from('crm_roles')
            .select('*')
            .order('name');

        if (error) throw error;

        return NextResponse.json({ roles });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
