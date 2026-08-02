import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, ShoppingBag } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mx-auto max-w-2xl text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Sobre o projeto</h1>
        <p className="text-muted-foreground leading-relaxed">
          Marketplace 3D simplificado derivado do 3D Colab, focado em demonstrar sistemas de
          recomendação — content-based e rede neural — para a pós-graduação.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Pipeline de recomendação</CardTitle>
            <CardDescription>Do banco de dados aos produtos exibidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              1. <strong className="text-foreground">Dados</strong> — catálogo e histórico de compras
            </p>
            <p>
              2. <strong className="text-foreground">Representação</strong> — contexto e vetores
            </p>
            <p>
              3. <strong className="text-foreground">Treinamento</strong> — dataset e rede neural
            </p>
            <p>
              4. <strong className="text-foreground">Persistência</strong> — topologia, pesos e métricas
            </p>
            <p>
              5. <strong className="text-foreground">Inferência</strong> — ML ou content-based
            </p>
            <p>
              6. <strong className="text-foreground">Entrega</strong> — ranking pela API até a interface
            </p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Como testar</CardTitle>
            <CardDescription>Logins demo · senha: demo123</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <code className="text-foreground">maria@demo.com</code> → decorativos / PLA
            </p>
            <p>
              • <code className="text-foreground">joao@demo.com</code> → funcionais / ABS
            </p>
            <p>• Marketplace → toggle Content / ML / Ambos</p>
            <p>• Laboratório → treine e aplique o modelo no browser</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/marketplace">
          <Button className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Ir ao marketplace
          </Button>
        </Link>
        <Link href="/learn">
          <Button variant="outline" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Abrir laboratório
          </Button>
        </Link>
      </div>
    </div>
  );
}
