-- Documentar a lógica de acesso na policy
COMMENT ON POLICY "Research export access" ON public.registry_cases IS 
'Acesso diferenciado para export de pesquisa:
- Admin/Research: podem ver TODOS os casos (export institucional)
- Profissional: vê SOMENTE seus próprios casos (export pessoal)
A VIEW registry_research_export_v1 herda essa restrição via SECURITY INVOKER.';