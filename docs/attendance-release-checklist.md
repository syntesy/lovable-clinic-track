# Checklist de Release — Atendimento

> Execute antes de cada deploy que envolva o módulo de Atendimento.  
> Objetivo: **Zero Regressão**

---

## ✅ Checklist Obrigatório

### 1. Criação de Atendimento
- [ ] Novo atendimento cria `attendance_sessions` com `created_at` correto
- [ ] `involves_orthobiologics` reflete a escolha do usuário
- [ ] Stepper exibe passos corretos (condicionais se ortobiológicos)

### 2. Janela Temporal
- [ ] Registros criados **antes** do atendimento NÃO aparecem
- [ ] Registros criados **depois** do `closed_at` NÃO aparecem
- [ ] Apenas registros dentro da janela são vinculados

### 3. Conclusão de Atendimento
- [ ] Botão "Concluir" define `closed_at` e `closed_by`
- [ ] Clique duplo NÃO sobrescreve (idempotência)
- [ ] Badge "Concluído" aparece após fechamento
- [ ] UI fica em modo leitura (bloqueada)

### 4. Bloqueio Pós-Conclusão
- [ ] Upload de documentos está **desabilitado**
- [ ] Botões de ação estão **desabilitados**
- [ ] Formulários estão em **modo leitura**
- [ ] Toast/feedback informa usuário sobre bloqueio

### 5. Fluxo S2 (Exames)
- [ ] Status APTO / PENDENTE / INDISPONÍVEL funciona normalmente
- [ ] Exames vinculados à triagem correta
- [ ] Nenhuma alteração no comportamento S0–S3

### 6. Relatórios e Snapshots
- [ ] `report_snapshots.attendance_ref` contém ID correto
- [ ] Relatório exibe dados do atendimento correto
- [ ] Snapshot é imutável após criação

### 7. Auditoria
- [ ] Evento `ATTENDANCE_CREATED` registrado ao criar
- [ ] Evento `ATTENDANCE_CLOSED` registrado ao concluir
- [ ] Evento `ATTENDANCE_FILE_UPLOADED` registrado ao anexar
- [ ] Logs contêm `user_id` e `record_id` corretos

### 8. Testes Automatizados
- [ ] Suíte de testes passa sem falhas
- [ ] Nenhum teste existente quebrou
- [ ] Cobertura de código mantida

---

## 🔍 Testes Manuais Recomendados

1. **Criar atendimento** → verificar janela inicia
2. **Criar triagem dentro do atendimento** → verificar vínculo
3. **Upload de documento** → verificar `attendance_files`
4. **Concluir atendimento** → verificar bloqueio
5. **Tentar editar após conclusão** → verificar bloqueio
6. **Gerar relatório** → verificar `attendance_ref`
7. **Abrir atendimento antigo** → verificar dados corretos

---

## 🚨 Critérios de Bloqueio

O deploy **NÃO deve prosseguir** se:

- [ ] Qualquer item do checklist falhar
- [ ] Testes automatizados falharem
- [ ] Regressão detectada no fluxo S2
- [ ] Dados de atendimentos existentes corrompidos

---

## 📋 Assinatura

| Campo | Valor |
|-------|-------|
| Data do teste | ______________ |
| Responsável | ______________ |
| Versão | ______________ |
| Resultado | ⬚ APROVADO  ⬚ REPROVADO |

---

*Checklist mantido pela equipe de governança clínica.*
