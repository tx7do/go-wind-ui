const modules = import.meta.glob<{ default: Record<string, unknown> }>('./*.json', {
  eager: true,
});

const zhCN: Record<string, Record<string, unknown>> = {};
for (const [path, mod] of Object.entries(modules)) {
  const ns = path.replace('./', '').replace(/\.json$/, '');
  zhCN[ns] = mod.default;
}

export default zhCN;
