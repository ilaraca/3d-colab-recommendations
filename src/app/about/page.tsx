import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sobre o projeto</h1>
        <p className="text-muted-foreground">
          Marketplace 3D simplificado derivado do 3D Colab, focado em demonstrar um sistema de
          recomendação content-based para a pós-graduação.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline de recomendação (Fase 1)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. <strong>Contexto</strong> — normaliza min/max de preço, volume, peso, etc.</p>
          <p>2. <strong>Encode</strong> — vetor de produto (categoria, material, atributos 3D)</p>
          <p>3. <strong>Usuário</strong> — média dos vetores dos produtos comprados</p>
          <p>4. <strong>Ranking</strong> — similaridade de cosseno entre vetor do usuário e candidatos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como testar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Entre como <code>maria@demo.com</code> → recomendações decorativas/PLA</p>
          <p>• Entre como <code>joao@demo.com</code> → recomendações funcionais/ABS</p>
          <p>• Abra um produto → veja &quot;Produtos similares&quot;</p>
          <p>• Senha: <code>demo123</code></p>
        </CardContent>
      </Card>

      <Link href="/marketplace">
        <Button>Ir ao marketplace</Button>
      </Link>
    </div>
  );
}
