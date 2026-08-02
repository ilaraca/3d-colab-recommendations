export function Footer() {
  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>3D Colab Recommendations — Laboratório de Sistemas de Recomendação</p>
        <p className="mt-1">Pipeline: encode → similaridade de cosseno → ranking</p>
      </div>
    </footer>
  );
}
