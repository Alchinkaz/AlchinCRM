import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { supabase } from '@/lib/crm-db';

// POST - отправить команду через Admiral API
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Получаем настройки Admiral API
    const { data: settings } = await supabase
      .from('crm_settings')
      .select('value')
      .eq('key', 'admiral_api_key')
      .single();

    const apiKey = settings?.value?.key || process.env.ADMIRAL_API_KEY;
    const apiUrl = process.env.ADMIRAL_API_URL || 'https://api.admiral.com';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API ключ Admiral не настроен' },
        { status: 400 }
      );
    }

    // Получаем устройство
    const { data: device, error: deviceError } = await supabase
      .from('crm_gps_devices')
      .select('*')
      .eq('id', params.id)
      .single();

    if (deviceError || !device) {
      return NextResponse.json(
        { error: 'Устройство не найдено' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { command_type, command_data } = body;

    // Отправляем команду в Admiral API
    const response = await fetch(`${apiUrl}/devices/${device.admiral_device_id}/commands`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: command_type,
        data: command_data,
      }),
    });

    const admiralResponse = await response.json();

    // Сохраняем команду в журнал
    const { data: command, error: commandError } = await supabase
      .from('crm_gps_commands')
      .insert({
        device_id: params.id,
        command_type,
        command_data,
        admiral_response: admiralResponse,
        status: response.ok ? 'success' : 'failed',
        sent_by: authResult.user?.id,
      })
      .select()
      .single();

    if (commandError) {
      return NextResponse.json(
        { error: 'Ошибка сохранения команды' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      command,
      admiral_response: admiralResponse,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

