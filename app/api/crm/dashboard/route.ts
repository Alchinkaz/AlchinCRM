import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { supabase } from '@/lib/crm-db';

// GET - получить данные для дашборда
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const role = user?.crm_roles?.name;

    // Получаем текущую дату и начало месяца
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let dashboardData: any = {};

    // Админ видит всю статистику
    if (role === 'admin') {
      // Доходы за месяц
      const { data: income } = await supabase
        .from('crm_finance_income')
        .select('amount')
        .gte('income_date', startOfMonth.toISOString().split('T')[0])
        .lte('income_date', endOfMonth.toISOString().split('T')[0]);

      // Расходы за месяц
      const { data: expenses } = await supabase
        .from('crm_finance_expense')
        .select('amount')
        .gte('expense_date', startOfMonth.toISOString().split('T')[0])
        .lte('expense_date', endOfMonth.toISOString().split('T')[0]);

      // Количество продаж
      const { count: dealsCount } = await supabase
        .from('crm_deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('sale_date', startOfMonth.toISOString().split('T')[0])
        .lte('sale_date', endOfMonth.toISOString().split('T')[0]);

      // Активные задачи
      const { data: activeTasks } = await supabase
        .from('crm_tasks')
        .select('*')
        .in('status', ['new', 'in_progress']);

      // KPI менеджеров
      const { data: managers } = await supabase
        .from('crm_users')
        .select('*, crm_roles(*)')
        .eq('crm_roles.name', 'manager');

      const managerKPIs = await Promise.all(
        (managers || []).map(async (manager) => {
          const { count: dealsCount } = await supabase
            .from('crm_deals')
            .select('*', { count: 'exact', head: true })
            .eq('manager_id', manager.id)
            .eq('status', 'completed');

          const { data: deals } = await supabase
            .from('crm_deals')
            .select('total_amount, manager_bonus_amount')
            .eq('manager_id', manager.id)
            .eq('status', 'completed');

          const totalSales = deals?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;
          const totalBonus = deals?.reduce((sum, d) => sum + (d.manager_bonus_amount || 0), 0) || 0;

          return {
            id: manager.id,
            name: manager.full_name,
            deals_count: dealsCount || 0,
            total_sales: totalSales,
            total_bonus: totalBonus,
          };
        })
      );

      dashboardData = {
        income: {
          total: income?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
          month: now.getMonth() + 1,
        },
        expenses: {
          total: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
          month: now.getMonth() + 1,
        },
        profit: {
          total: (income?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0) -
                 (expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0),
        },
        deals_count: dealsCount || 0,
        active_tasks_count: activeTasks?.length || 0,
        manager_kpis: managerKPIs,
      };
    }

    // Менеджер видит свою статистику
    if (role === 'manager') {
      const { count: dealsCount } = await supabase
        .from('crm_deals')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', user.id);

      const { data: deals } = await supabase
        .from('crm_deals')
        .select('total_amount, manager_bonus_amount, status')
        .eq('manager_id', user.id);

      const totalSales = deals?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;
      const totalBonus = deals?.reduce((sum, d) => sum + (d.manager_bonus_amount || 0), 0) || 0;

      dashboardData = {
        deals_count: dealsCount || 0,
        total_sales: totalSales,
        total_bonus: totalBonus,
        deals_by_status: {
          new: deals?.filter(d => d.status === 'new').length || 0,
          in_progress: deals?.filter(d => d.status === 'in_progress').length || 0,
          completed: deals?.filter(d => d.status === 'completed').length || 0,
        },
      };
    }

    // Монтажник видит свои задачи
    if (role === 'installer') {
      const { data: tasks } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('assigned_to', user.id);

      dashboardData = {
        tasks_count: tasks?.length || 0,
        tasks_by_status: {
          new: tasks?.filter(t => t.status === 'new').length || 0,
          in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
          completed: tasks?.filter(t => t.status === 'completed').length || 0,
        },
        upcoming_tasks: tasks?.filter(t => 
          t.scheduled_start && new Date(t.scheduled_start) >= now
        ).slice(0, 5) || [],
      };
    }

    return NextResponse.json({ dashboard: dashboardData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

