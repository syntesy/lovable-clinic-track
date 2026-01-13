# transcribe-audio

## Objetivo
Transcreve áudio para texto usando OpenAI Whisper API, com suporte a português brasileiro.

## Inputs

### Request Body (JSON)
```json
{
  "audio": "<base64-encoded-audio>",
  "mimeType": "audio/webm"
}
```

### Campos
- **audio:** (obrigatório) Áudio codificado em base64
- **mimeType:** (opcional) Tipo MIME do áudio

### Formatos Suportados
- `audio/webm` (padrão)
- `audio/mp4`
- `audio/mp3` / `audio/mpeg`
- `audio/wav`
- `audio/ogg`

## Outputs

### Response (JSON)
```json
{
  "text": "Texto transcrito do áudio em português."
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `OPENAI_API_KEY` | Chave de API da OpenAI |

## Limitações

- **Tamanho máximo:** 25MB (limite do Whisper)
- **Idioma:** Configurado para português (`pt`)

## Modelo

Utiliza `whisper-1` da OpenAI para transcrição.

## Tratamento de Erros

- **400:** Áudio não fornecido ou muito grande
- **500:** Erro na API ou processamento

### Mensagens de Erro
```json
{
  "error": "Arquivo de áudio muito grande. Máximo: 25MB"
}
```

## Exemplo de Payload

```bash
# Obter áudio em base64
AUDIO_B64=$(base64 -i audio.webm)

curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{\"audio\": \"$AUDIO_B64\", \"mimeType\": \"audio/webm\"}" \
  https://<project-ref>.supabase.co/functions/v1/transcribe-audio
```
