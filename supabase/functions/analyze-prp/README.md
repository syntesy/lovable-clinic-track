# analyze-prp

## Objetivo
Analisa respostas do questionário pré-PRP para determinar a aptidão biológica do paciente para terapias ortobiológicas.

## Inputs

### Request Body (JSON)
```json
{
  "questionnaireData": {
    "dorCicatrizacao": { "pergunta1": true, "pergunta2": false },
    "inflamacaoSistemica": { ... },
    "metabolismoEnergetico": { ... },
    "ferroAnemia": { ... },
    "metabolismoGlicemico": { ... },
    "eixoHormonal": { ... },
    "medicamentos": { ... },
    "estiloVida": { ... }
  }
}
```

### Campos por Bloco
- **dorCicatrizacao:** Dor e cicatrização
- **inflamacaoSistemica:** Inflamação sistêmica
- **metabolismoEnergetico:** Metabolismo energético
- **ferroAnemia:** Ferro e anemia
- **metabolismoGlicemico:** Metabolismo glicêmico
- **eixoHormonal:** Eixo hormonal
- **medicamentos:** Uso de medicamentos
- **estiloVida:** Estilo de vida

## Outputs

### Response (JSON)
```json
{
  "analysis": "📌 SITUAÇÃO GERAL DO PACIENTE: ..."
}
```

A análise inclui:
- Situação geral (verde/amarelo/vermelho)
- Principais riscos biológicos identificados
- Exames de sangue a serem solicitados
- Alertas importantes
- Observação final ao clínico

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `LOVABLE_API_KEY` | Chave de API do Lovable AI Gateway (automática) |

## Rate Limiting

- **Limite:** 10 requisições por minuto
- **Janela:** 60 segundos
- **Identificador:** Token de autorização ou IP do cliente

## Exemplo de Payload

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "questionnaireData": {
      "dorCicatrizacao": { "Dor crônica há mais de 6 meses?": true },
      "inflamacaoSistemica": { "Usa anti-inflamatórios regularmente?": false }
    }
  }' \
  https://<project-ref>.supabase.co/functions/v1/analyze-prp
```
