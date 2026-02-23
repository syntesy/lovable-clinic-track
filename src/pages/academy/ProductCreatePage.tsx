import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateProduct } from "@/hooks/useAcademyProducts";
import { BookOpen, Users, Repeat, ArrowLeft } from "lucide-react";

const ProductCreatePage = () => {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'course' | 'mentorship' | 'subscription'>('course');
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    price_cents: '',
    access_policy: 'lifetime' as 'lifetime' | 'time_limited',
    access_days: '',
  });

  const handleCreate = async () => {
    const data: any = {
      type,
      title: form.title.trim(),
      description: form.description.trim(),
      subtitle: form.subtitle.trim() || null,
      category: form.category.trim() || null,
      access_policy: form.access_policy,
      access_days: form.access_days ? parseInt(form.access_days) : null,
    };
    if (type !== 'subscription' && form.price_cents) {
      data.price_cents = Math.round(parseFloat(form.price_cents) * 100);
    }
    const result = await createProduct.mutateAsync(data);
    if (result) {
      navigate(`/academy/professor/produtos/${(result as any).id}/editar`);
    }
  };

  const typeOptions = [
    { value: 'course', label: 'Curso', desc: 'Módulos com aulas em vídeo e materiais', icon: BookOpen },
    { value: 'mentorship', label: 'Mentoria', desc: 'Turmas com sessões ao vivo agendadas', icon: Users },
    { value: 'subscription', label: 'Assinatura', desc: 'Conteúdo recorrente para assinantes', icon: Repeat },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/academy/professor/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-6">Criar Novo Produto</h1>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Tipo do Produto</CardTitle>
              <CardDescription>Escolha o tipo de conteúdo que deseja criar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={type} onValueChange={(v) => setType(v as any)}>
                {typeOptions.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      type === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <RadioGroupItem value={opt.value} />
                    <opt.icon className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)}>Continuar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Preencha os dados do seu produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Introdução à Medicina Regenerativa" />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Breve complemento ao título" />
              </div>
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva seu produto em detalhes..." rows={5} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Ortobiológicos, PRP, etc." />
              </div>
              {type !== 'subscription' && (
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={form.price_cents} onChange={e => setForm(f => ({ ...f, price_cents: e.target.value }))} placeholder="0.00" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Política de Acesso</Label>
                <RadioGroup value={form.access_policy} onValueChange={(v) => setForm(f => ({ ...f, access_policy: v as any }))}>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="lifetime" />
                    <span className="text-sm text-foreground">Acesso vitalício</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="time_limited" />
                    <span className="text-sm text-foreground">Acesso por tempo limitado</span>
                  </label>
                </RadioGroup>
                {form.access_policy === 'time_limited' && (
                  <Input type="number" min="1" value={form.access_days} onChange={e => setForm(f => ({ ...f, access_days: e.target.value }))} placeholder="Dias de acesso" className="mt-2" />
                )}
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button onClick={handleCreate} disabled={!form.title.trim() || !form.description.trim() || createProduct.isPending}>
                  {createProduct.isPending ? 'Criando...' : 'Criar Produto'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductCreatePage;
