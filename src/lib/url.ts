/** Caminho canônico: sem ".html" (o build usa format "file") e sem barra final; a home é "/". */
export function canonicalPath(pathname: string): string {
  const clean = pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/+$/, '');
  return clean || '/';
}

/** Nome do arquivo da imagem de compartilhamento (Open Graph) de uma página: "/" → "home", "/servicos/x" → "servicos-x". */
export function ogSlug(pathname: string): string {
  const path = canonicalPath(pathname);
  return path === '/' ? 'home' : path.slice(1).replace(/\//g, '-');
}
