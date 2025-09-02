import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: modelId } = await params

    // 現在の視聴回数を取得
    const { data: model, error: fetchError } = await supabase
      .from('models')
      .select('view_count')
      .eq('id', modelId)
      .single()

    if (fetchError || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // 視聴回数をインクリメント
    const { data, error: updateError } = await supabase
      .from('models')
      .update({ 
        view_count: (model.view_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', modelId)
      .select('view_count')
      .single()

    if (updateError) {
      console.error('Error updating view count:', updateError)
      return NextResponse.json(
        { error: 'Failed to update view count' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      viewCount: data?.view_count || model.view_count + 1 
    })
  } catch (error) {
    console.error('Error in view count API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 視聴回数を取得するエンドポイント
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: modelId } = await params

    const { data, error } = await supabase
      .from('models')
      .select('view_count')
      .eq('id', modelId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      viewCount: data.view_count || 0 
    })
  } catch (error) {
    console.error('Error fetching view count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}