# REGHEN - Política de Alterações no Banco de Dados

## Regras Oficiais

### 1. Migrations Versionadas (OBRIGATÓRIO)

Toda mudança futura no banco de dados **DEVE** ser feita via migration versionada.

- **Local:** `db/migrations/`
- **Formato do arquivo:** `XXXX__descricao_da_mudanca.sql`
  - Exemplo: `0002__add_column_patient_phone.sql`
  - Exemplo: `0003__create_table_appointments.sql`

### 2. Alterações Diretas Proibidas

❌ **É PROIBIDO** fazer alterações diretas em produção sem migration documentada.

Isso inclui:
- Criar/alterar tabelas via console
- Modificar policies diretamente
- Alterar functions ou triggers sem versionamento

### 3. Migrations Incrementais e Reversíveis

Cada migration deve ser:
- **Incremental:** Apenas as mudanças necessárias, não o schema completo
- **Numerada:** Sequência contínua (0001, 0002, 0003...)
- **Reversível (quando aplicável):** Incluir comentário com SQL de rollback

Exemplo de estrutura:
```sql
-- Migration 0002: Add phone column to patients
-- Rollback: ALTER TABLE patients DROP COLUMN phone;

ALTER TABLE patients ADD COLUMN phone VARCHAR(20);
```

### 4. Baseline é Somente Leitura

⚠️ A pasta `db/baseline/` é **READ-ONLY** e representa o estado inicial do banco.

- **Nunca modifique** os arquivos do baseline
- Use-os como referência para entender o estado original
- Novas mudanças vão em `db/migrations/`

## Fluxo de Trabalho

1. **Identificar necessidade** de mudança no banco
2. **Criar arquivo** em `db/migrations/` com próximo número sequencial
3. **Documentar** a mudança com comentários claros
4. **Incluir rollback** quando possível
5. **Testar** em ambiente de desenvolvimento
6. **Revisar** antes de aplicar em produção
7. **Aplicar** via ferramenta de migration ou console autorizado

## Histórico de Migrations

| Número | Arquivo | Descrição | Data |
|--------|---------|-----------|------|
| 0001 | `0001__initial_from_baseline.sql` | Âncora referenciando baseline inicial | 2025-01-13 |

---

**Última atualização:** 2025-01-13  
**Responsável:** Equipe REGHEN
