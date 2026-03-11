import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface CurationResult {
  article_id: string
  score: number
  classificacao: string
  titulo: string
  success: boolean
}

interface CurationMetadata {
  doi?: string
  title?: string
  published_date?: string
  source?: string
}

export function useAcademyCuration() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CurationResult | null>(null)

  const progressMessages = [
    'Preparando PDF...',
    'Registrando na fila de curadoria...',
    'Enviando para o Agente Científico Reghen...',
    'Lendo o artigo completo...',
    'Analisando nível de evidência...',
    'Avaliando aplicabilidade clínica...',
    'Calculando score de relevância...',
    'Gerando ficha de curadoria...',
    'Salvando no banco de dados...',
  ]

  const curatePDF = async (file: File, metadata?: CurationMetadata) => {
    setIsProcessing(true)
    setError(null)
    setResult(null)

    // Cicla pelas mensagens de progresso a cada 8 segundos
    let msgIndex = 0
    setProgress(progressMessages[0])
    const progressInterval = setInterval(() => {
      msgIndex = Math.min(msgIndex + 1, progressMessages.length - 1)
      setProgress(progressMessages[msgIndex])
    }, 8000)

    try {
      // Valida tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('O PDF não pode ter mais de 10MB')
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Converte PDF para base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo PDF'))
        reader.readAsDataURL(file)
      })

      // Cria registro na fila
      const { data: queueItem, error: queueError } = await supabase
        .from('academy_curation_queue')
        .insert({
          title: metadata?.title || file.name.replace('.pdf', '').replace(/_/g, ' '),
          source: 'manual_upload',
          full_text_type: 'pdf_upload',
          status: 'pending',
          doi: metadata?.doi || null,
          published_date: metadata?.published_date || null,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (queueError) throw new Error(`Erro ao registrar na fila: ${queueError.message}`)

      // Chama a Edge Function com timeout de 90 segundos
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 90000)

      const { data, error: fnError } = await supabase.functions.invoke(
        'academy-curate-paper',
        {
          body: {
            queue_id: queueItem.id,
            pdf_base64: base64,
            metadata: {
              source: 'manual_upload',
              doi: metadata?.doi,
              published_date: metadata?.published_date,
            },
          },
        }
      )

      clearTimeout(timeout)

      if (fnError) throw new Error(`Erro na curadoria: ${fnError.message}`)
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido na curadoria')

      setResult(data)
      setProgress('Curadoria concluída!')

      toast({
        title: '🧬 Artigo curado com sucesso!',
        description: `Score: ${data.score}/10 — ${formatClassificacao(data.classificacao)}`,
      })

      return data

    } catch (err: any) {
      const msg = err.name === 'AbortError'
        ? 'Tempo limite excedido (90s). Tente novamente.'
        : err.message || 'Erro desconhecido'
      setError(msg)
      toast({ title: 'Erro na curadoria', description: msg, variant: 'destructive' })
      throw err
    } finally {
      clearInterval(progressInterval)
      setIsProcessing(false)
    }
  }

  const curateAbstract = async (abstractText: string, metadata?: CurationMetadata) => {
    setIsProcessing(true)
    setError(null)
    setResult(null)
    setProgress('Enviando abstract para curadoria parcial...')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: queueItem, error: queueError } = await supabase
        .from('academy_curation_queue')
        .insert({
          title: metadata?.title || 'Artigo via abstract',
          source: 'manual_upload',
          full_text_type: 'abstract_only',
          status: 'pending',
          doi: metadata?.doi || null,
          abstract: abstractText,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (queueError) throw new Error(queueError.message)

      const { data, error: fnError } = await supabase.functions.invoke(
        'academy-curate-paper',
        {
          body: {
            queue_id: queueItem.id,
            abstract_only: true,
            abstract_text: abstractText,
            metadata,
          },
        }
      )

      if (fnError) throw new Error(fnError.message)
      if (!data?.success) throw new Error(data?.error)

      setResult(data)
      setProgress('Curadoria parcial concluída!')

      toast({
        title: '🧬 Curadoria parcial concluída',
        description: `Score: ${data.score}/10 (baseado em abstract)`,
      })

      return data

    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }

  return { curatePDF, curateAbstract, isProcessing, progress, error, result }
}

function formatClassificacao(c: string): string {
  const map: Record<string, string> = {
    leitura_essencial: '🔴 Leitura Essencial',
    leitura_recomendada: '🟠 Leitura Recomendada',
    leitura_opcional: '🟡 Leitura Opcional',
    referencia: '🟢 Referência',
    contexto: '⚪ Contexto',
  }
  return map[c] || c
}
