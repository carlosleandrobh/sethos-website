/** Caminho canônico: sem ".html" (o build usa format "file") e sem barra final; a home é "/". */
export function canonicalPath(pathname: string): string {
  const clean = pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/+$/, '');
  return clean || '/';
}
