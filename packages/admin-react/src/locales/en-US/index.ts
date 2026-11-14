const modules = import.meta.glob<{ default: Record<string, unknown> }>('./*.json', {
  eager: true,
});

const enUS: Record<string, Record<string, unknown>> = {};
for (const [path, mod] of Object.entries(modules)) {
  const ns = path.replace('./', '').replace(/\.json$/, '');
  enUS[ns] = mod.default;
}

export default enUS;
