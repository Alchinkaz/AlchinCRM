import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { supabase } from '@/lib/crm-db';

// POST - загрузить файл для задачи
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('task_id') as string;

    if (!file || !taskId) {
      return NextResponse.json(
        { error: 'Файл и task_id обязательны' },
        { status: 400 }
      );
    }

    // В реальном приложении здесь должна быть загрузка файла в хранилище (S3, Supabase Storage и т.д.)
    // Для примера сохраняем только метаданные
    const fileData = {
      task_id: taskId,
      file_name: file.name,
      file_path: `/uploads/tasks/${taskId}/${file.name}`, // Временный путь
      file_type: file.type,
      file_size: file.size,
      uploaded_by: authResult.user?.id,
    };

    const { data, error } = await supabase
      .from('crm_task_files')
      .insert(fileData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ file: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

