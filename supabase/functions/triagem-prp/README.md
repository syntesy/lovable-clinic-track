# triagem-prp

## Objetivo
Motor de triagem biológica para terapias ortobiológicas (PRP, PRF, BMAC), incluindo análise de questionário, exames laboratoriais e extração OCR de resultados.

## Inputs

### Request Body (JSON)

#### Análise de Questionário
```json
{
  "action": "questionnaire",
  "therapyItemCode": "AUTO_PRP",
  "rawQuestionnaire": {
    "mode": "TRIAGEM",
    "answers": {
      "dor_cronica": true,
      "uso_aines": false,
      "diabetes": false
    }
  }
}
```

#### Análise de Exames Laboratoriais
```json
{
  "action": "lab_results",
  "therapyItemCode": "AUTO_PRP",
  "labResults": {
    "hemoglobina": 12.5,
    "ferritina": 45,
    "vitamina_d": 32
  }
}
```

#### Extração OCR de Imagens
```json
{
  "action": "extract_text",
  "imageUrls": [
    { "url": "data:image/png;base64,...", "fileName": "exame1.png" }
  ]
}
```

## Outputs

### Response de Triagem (JSON)
```json
{
  "rawAnalysis": "Texto completo da análise...",
  "structuredResult": {
    "eligibility": {
      "overall_status": "APTO_COM_PREPARO",
      "prp": { "status": "APTO", "notes": "..." },
      "prf": { "status": "COM_RESSALVAS", "notes": "..." },
      "bmac": { "status": "CONTRAINDICADO", "notes": "..." }
    },
    "key_reasons": ["Deficiência de ferro", "Vitamina D baixa"],
    "requested_exams": {
      "required": ["Ferritina", "25-OH-VitD"],
      "optional": ["PCR-us"]
    }
  },
  "classification": "APTO_COM_PREPARO",
  "recommendedExams": ["Ferritina", "Vitamina D"],
  "patientOrientations": ["Suplementar ferro", "Exposição solar"]
}
```

### Response de OCR (JSON)
```json
{
  "extractedTexts": [
    { "fileName": "exame1.png", "text": "Hemoglobina: 12.5 g/dL...", "success": true }
  ],
  "consolidatedText": "=== exame1.png ===\nHemoglobina: 12.5...",
  "totalFiles": 1,
  "successCount": 1,
  "failCount": 0
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `OPENAI_API_KEY` | Chave de API da OpenAI |
| `ASSISTANT_TRIAGEM_PRP_ID` | ID do Assistant de triagem |
| `LOVABLE_API_KEY` | Chave do Lovable AI Gateway (para OCR) |
| `SUPABASE_URL` | URL do projeto (automática) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (automática) |

## Rate Limiting

- **Limite:** 15 requisições por minuto
- **Janela:** 60 segundos

## Taxonomy Gate

Antes de processar, verifica na taxonomia se o item requer score:
- `AUTO_PRP`, `AUTO_PRF`, `AUTO_BMAC`: Requerem triagem
- Items em categorias sem `requires_score`: Bypass automático

### Response de Bypass
```json
{
  "success": true,
  "gate": "taxonomy",
  "requires_score": false,
  "message": "Triagem não necessária para este item",
  "eligibility": {
    "overall_status": "NOT_APPLICABLE"
  }
}
```

## Status de Elegibilidade

- `APTO`: Liberado para procedimento
- `APTO_COM_PREPARO`: Necessita preparação prévia
- `NAO_APTO`: Contraindicado no momento
- `INDEFINIDO`: Dados insuficientes
- `NOT_APPLICABLE`: Item não requer triagem

## Exemplo de Payload

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "questionnaire",
    "therapyItemCode": "AUTO_PRP",
    "rawQuestionnaire": {
      "mode": "TRIAGEM",
      "answers": {"dor_cronica": true, "uso_aines": false}
    }
  }' \
  https://<project-ref>.supabase.co/functions/v1/triagem-prp
```
