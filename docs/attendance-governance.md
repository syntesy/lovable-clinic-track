# Regras do Atendimento — Governança v1.1

> Documento oficial de governança do módulo de Atendimento.  
> Última atualização: 2026-01-15

---

## O que é um Atendimento

Um **Atendimento** é um container temporal que agrupa todas as atividades clínicas realizadas em uma consulta. Ele possui:

- Data/hora de início (`created_at`)
- Data/hora de conclusão (`closed_at`)
- Responsável pelo fechamento (`closed_by`)
- Flag de ortobiológicos (`involves_orthobiologics`)

---

## O que NÃO é um Atendimento

- **Não é** um prontuário clínico (clinical_record)
- **Não é** uma triagem (prp_screening)
- **Não é** um relatório (report_snapshot)
- **Não altera** regras S0–S3 ou lógica de SCORE

O Atendimento é apenas um **agrupador temporal** que vincula registros existentes.

---

## Quando um Atendimento começa

Um Atendimento inicia quando o profissional cria uma nova sessão:

```
attendance_sessions.created_at = now()
```

A partir desse momento, a **janela temporal** está aberta.

---

## O que pertence a um Atendimento

Todos os registros criados **dentro da janela temporal** (`created_at` → `closed_at`):

| Tipo | Tabela | Vínculo |
|------|--------|---------|
| Triagem | `prp_screenings` | `created_at` dentro da janela |
| Prontuário | `clinical_records` | `created_at` dentro da janela |
| Exames S2 | Derivados da triagem | Via `screening_id` |
| Documentos | `attendance_files` | `attendance_ref` direto |
| Relatórios | `report_snapshots` | `attendance_ref` direto |

---

## O que acontece ao Concluir Atendimento

1. **`closed_at`** é definido com timestamp atual
2. **`closed_by`** registra o user_id responsável
3. **UI fica bloqueada** — exibe badge "Concluído"
4. **Uploads são bloqueados** — botões desabilitados
5. **Edições são bloqueadas** — formulários em modo leitura

### Regra de Idempotência

```sql
UPDATE attendance_sessions 
SET closed_at = now(), closed_by = ? 
WHERE id = ? AND closed_at IS NULL
```

Se `closed_at` já existe, a operação é ignorada (evita race condition).

---

## Regra de Imutabilidade

| Regra | Descrição |
|-------|-----------|
| Atendimentos concluídos **não são reabertos** | `closed_at` é definitivo |
| Relatórios são **snapshots imutáveis** | Dados congelados no momento da geração |
| Não há "editar atendimento fechado" | Novo atendimento deve ser criado |

---

## Relacionamento Jurídico

```
report_snapshots.attendance_ref → attendance_sessions.id
```

- Todo relatório **pertence** a um atendimento específico
- Essa vinculação é **auditável** e **rastreável**
- Garante compliance para M&A e auditoria externa

---

## Eventos de Auditoria

| Evento | Quando ocorre |
|--------|---------------|
| `ATTENDANCE_CREATED` | Nova sessão de atendimento |
| `ATTENDANCE_CLOSED` | Atendimento concluído |
| `ATTENDANCE_FILE_UPLOADED` | Documento anexado |
| `REPORT_SNAPSHOT_CREATED` | Relatório gerado |

Todos os eventos são registrados via `audit_logs` com:
- `user_id`, `user_email`
- `action`, `table_name`, `record_id`
- `additional_info` (metadados contextuais)

---

## Resumo Visual

```
┌─────────────────────────────────────────────────┐
│              ATENDIMENTO (janela)               │
│  created_at ─────────────────────► closed_at    │
├─────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │
│  │ Triagem │  │Prontuário│  │ Documentos     │  │
│  └─────────┘  └─────────┘  └─────────────────┘  │
│                    │                            │
│                    ▼                            │
│           ┌───────────────┐                     │
│           │  Relatório    │ ◄── attendance_ref  │
│           │  (snapshot)   │                     │
│           └───────────────┘                     │
└─────────────────────────────────────────────────┘
```

---

*Documento mantido pela equipe de governança clínica.*
