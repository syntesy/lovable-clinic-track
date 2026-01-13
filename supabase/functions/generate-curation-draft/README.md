# generate-curation-draft

## Objetivo
Gera um rascunho de curadoria científica estruturada para artigos, usando IA para análise no formato PICO.

## Inputs

### Request Body (JSON)
```json
{
  "article": {
    "title": "Título do artigo",
    "authors": "Autor A, Autor B",
    "year": 2024,
    "journal": "Journal Name",
    "interest": "Área de interesse",
    "doi": "10.1234/example",
    "practice_change": "Descrição prévia de mudança na prática"
  }
}
```

## Outputs

### Response (JSON)
```json
{
  "curation": {
    "objective": "Objetivo do estudo",
    "design": "ECR duplo-cego",
    "population": "Pacientes com osteoartrite de joelho",
    "sample_size": "120 participantes",
    "intervention": "PRP intra-articular",
    "comparator": "Ácido hialurônico",
    "outcomes_primary": "Dor (VAS)",
    "outcomes_secondary": "Função (WOMAC)",
    "results_key": "Principais achados",
    "adverse_events": "Eventos adversos relatados",
    "limitations": "Limitações do estudo",
    "authors_conclusion": "Conclusão dos autores",
    "evidence_level": "ib",
    "bias_risk": "moderado",
    "applicability": "alta",
    "clinical_takeaways": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "what_changes_in_practice": "Impacto na prática"
  }
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `LOVABLE_API_KEY` | Chave de API do Lovable AI Gateway (automática) |

## Modelo de IA

Utiliza `google/gemini-2.5-flash` via Lovable AI Gateway com function calling para saída estruturada.

## Níveis de Evidência Suportados

- `ia`: Meta-análise de ECRs
- `ib`: ECR individual
- `iia`: Estudo controlado sem randomização
- `iib`: Estudo quase-experimental
- `iii`: Estudos descritivos
- `iv`: Opinião de especialistas
- `v`: Relatos de caso

## Exemplo de Payload

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "title": "PRP for Knee Osteoarthritis",
      "authors": "Smith J, et al.",
      "year": 2024,
      "journal": "AJSM",
      "interest": "Ortobiológicos"
    }
  }' \
  https://<project-ref>.supabase.co/functions/v1/generate-curation-draft
```
