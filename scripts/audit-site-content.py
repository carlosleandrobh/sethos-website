"""Compara site_content (export do Supabase) com os fallbacks do código antigo.
Uso: python -I audit-site-content.py <site_content.json> <src_antigo> [saida.md]"""
import json, re, sys, pathlib

db = {r['key']: r for r in json.load(open(sys.argv[1], encoding='utf-8'))}
src = pathlib.Path(sys.argv[2])
pat = re.compile(r"(?:useContentValue|useContentSafe|getContent|useContent\w*)\(\s*(['\"`])([\w.\-]+)\1\s*,\s*(['\"`])((?:\.|(?!\3).)*)\3", re.S)
code = {}
for f in list(src.rglob('*.ts')) + list(src.rglob('*.tsx')):
    for m in pat.finditer(f.read_text(encoding='utf-8', errors='replace')):
        code.setdefault(m.group(2), []).append((m.group(4).replace("\'", "'"), str(f.relative_to(src))))

norm = lambda s: re.sub(r'\s+', ' ', s).strip()
only_db = sorted(set(db) - set(code))
only_code = sorted(set(code) - set(db))
diff = [k for k in sorted(set(db) & set(code)) if all(norm(db[k]['value']) != norm(v) for v, _ in code[k])]
same = len(set(db) & set(code)) - len(diff)

out = [f"# Auditoria de conteúdo\n\n- Chaves no banco: {len(db)}\n- Chaves com fallback no código: {len(code)}\n- Iguais: {same}\n- **Texto diferente (banco prevalece)**: {len(diff)}\n- **Só no banco** (sem uso no código atual, mas preservar): {len(only_db)}\n- **Só no código** (fallback nunca editado no banco; preservar): {len(only_code)}\n"]
out.append("\n## Diferentes (banco x código)\n")
for k in diff:
    out.append(f"### `{k}`\n- Banco: {db[k]['value']}\n- Código ({code[k][0][1]}): {code[k][0][0]}\n")
out.append("\n## Só no banco\n")
out += [f"- `{k}` ({db[k]['section']}): {db[k]['value'][:200]}" for k in only_db]
out.append("\n## Só no código\n")
out += [f"- `{k}` ({code[k][0][1]}): {code[k][0][0][:200]}" for k in only_code]
pathlib.Path(sys.argv[3] if len(sys.argv) > 3 else 'audit.md').write_text('\n'.join(out), encoding='utf-8')
print(len(db), len(code), same, len(diff), len(only_db), len(only_code))
