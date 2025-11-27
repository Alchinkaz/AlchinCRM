import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { supabase } from '@/lib/crm-db';

// GET - получить финансовые данные
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const role = authResult.user?.crm_roles?.name;
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Доходы
    const { data: income } = await supabase
      .from('crm_finance_income')
      .select('*')
      .gte('income_date', startOfMonth.toISOString().split('T')[0])
      .lte('income_date', endOfMonth.toISOString().split('T')[0])
      .order('income_date', { ascending: false });

    // Расходы
    const { data: expenses } = await supabase
      .from('crm_finance_expense')
      .select('*')
      .gte('expense_date', startOfMonth.toISOString().split('T')[0])
      .lte('expense_date', endOfMonth.toISOString().split('T')[0])
      .order('expense_date', { ascending: false });

    // Выплаты
    const { data: payments } = await supabase
      .from('crm_finance_payments')
      .select('*, crm_users(full_name)')
      .gte('payment_date', startOfMonth.toISOString().split('T')[0])
      .lte('payment_date', endOfMonth.toISOString().split('T')[0])
      .order('payment_date', { ascending: false });

    // Бонусы
    const { data: bonuses } = await supabase
      .from('crm_finance_bonuses')
      .select('*, crm_users(full_name)')
      .gte('bonus_date', startOfMonth.toISOString().split('T')[0])
      .lte('bonus_date', endOfMonth.toISOString().split('T')[0])
      .order('bonus_date', { ascending: false });

    const incomeTotal = income?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
    const expensesTotal = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const profit = incomeTotal - expensesTotal;

    return NextResponse.json({
      income: {
        total: incomeTotal,
        list: income || [],
      },
      expenses: {
        total: expensesTotal,
        list: expenses || [],
      },
      profit,
      payments_list: payments?.map((p: any) => ({
        ...p,
        user_name: p.crm_users?.full_name,
      })) || [],
      bonuses_list: bonuses?.map((b: any) => ({
        ...b,
        user_name: b.crm_users?.full_name,
      })) || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

