import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAcademyCuration } from '@/hooks/useAcademyCuration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, FlaskConical } from 'lucide-react'

export default function CuratorPanel() {
  const navigate = useNavigate()
  const { curatePDF, isProcessing, progress, error, result } = useAcademyCuration()

  const [file, setFile] = useState<File | null>(null)
  const [doi, setDoi] = useState('')
  const [title, setTitle] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const doiParam = searchParams.get('doi')
    const titleParam = searchParams.get('title')
    if (doiParam) setDoi(doiParam)
    if (titleParam) setTitle(titleParam)
  }, [searchParams])

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      alert('Apenas arquivos PDF são aceitos.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      alert('O PDF não pode ter mais de 10MB.')
      return
    }
    setFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleSubmit = async () => {
    if (!file) return
    await curatePDF(file, { doi: doi || undefined, title: title || undefined })
  }

  const progressPercent = isProcessing
    ? Math.min(95, (progress.length / 8) * 20 + 10)
    : result ? 100 : 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-teal-100">
          <FlaskConical className="h-7 w-7 text-teal-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel do Curador</h1>
          <p className="text-sm text-muted-foreground">Reghen Academy — Curadoria com Reghen Evidence Method™</p>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-muted/50 border border-border/60 p-4 text-sm text-muted-foreground leading-relaxed">
        <strong>Como funciona:</strong> O PDF é enviado diretamente para o Agente Científico Reghen,
        que lê o artigo completo e gera a ficha curada automaticamente. Não é necessário extrair o texto.
        O processo leva entre 30 e 60 segundos.
      </div>

      {/* Upload area */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>Upload do Artigo</CardTitle>
            <CardDescription>Arraste o PDF ou clique para selecionar. Máximo 10MB.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('pdf-input')?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-teal-400 bg-teal-50'
                  : file
                  ? 'border-teal-300 bg-teal-50'
                  : 'border-border hover:border-teal-300 hover:bg-muted/30'
              }`}
            >
              <input
                id="pdf-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-teal-600" />
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium text-foreground">Arraste o PDF aqui ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">Apenas arquivos .pdf até 10MB</p>
                </div>
              )}
            </div>

            {/* Metadados opcionais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title-input">Título (opcional)</Label>
                <Input
                  id="title-input"
                  placeholder="Ex: Efficacy of PRP in knee OA"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doi-input">DOI (opcional)</Label>
                <Input
                  id="doi-input"
                  placeholder="10.1000/xyz123"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!file || isProcessing}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
              ) : (
                <><FlaskConical className="h-4 w-4 mr-2" /> Iniciar Curadoria com Reghen Evidence Method™</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progresso */}
      {isProcessing && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              <span className="font-medium text-foreground">{progress}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              O Agente Científico Reghen está lendo e analisando o artigo completo...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Erro na curadoria</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <button
                  onClick={() => { setFile(null); window.location.reload() }}
                  className="text-xs text-destructive underline mt-2"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {result && (
        <Card className="border-teal-200 bg-teal-50/30">
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center gap-2 text-teal-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Curadoria concluída com sucesso!</span>
            </div>
            <div>
              <p className="font-medium text-foreground">{result.titulo}</p>
              <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
                <span className="font-bold">{result.score}/10</span>
                <span>{result.classificacao?.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(`/academy/artigo/${result.article_id}`)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                Ver ficha completa
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/academy/evidencia?tab=explorar')}
                className="flex-1"
              >
                Ver biblioteca
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
