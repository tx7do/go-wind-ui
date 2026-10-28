import { useMemo, useState } from "react";
import { Radio } from "antd";
import { BiProvider, BiDashboard, BiDesignerReact } from "@go-wind-ui/bi-react";
import type { BiDashboardSchema } from "@go-wind-ui/bi-core";

const SCHEMA: Partial<BiDashboardSchema> = {
  name: "render-demo",
  datasets: [
    {
      id: "ds_month",
      name: "月度销售",
      type: "static",
      rows: Array.from({ length: 12 }, (_, i) => ({
        month: `${i + 1}月`,
        sales: Math.round(80 + Math.sin(i / 2) * 60 + i * 8),
        target: 160,
      })),
    },
    {
      id: "ds_channel",
      name: "渠道分布",
      type: "static",
      rows: [
        { channel: "直销", amount: 420 },
        { channel: "渠道A", amount: 300 },
        { channel: "渠道B", amount: 180 },
        { channel: "线上", amount: 260 },
      ],
    },
    {
      id: "ds_api_orders",
      name: "城市订单 (API)",
      type: "api",
      api: {},
    },
  ],
  charts: [
    {
      id: "r_bar",
      title: "月度销售",
      datasetId: "ds_month",
      type: "bar",
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      encoding: { dimension: "month", measure: "sales" },
    },
    {
      id: "r_area",
      title: "销售趋势",
      datasetId: "ds_month",
      type: "area",
      x: 6,
      y: 0,
      w: 6,
      h: 4,
      encoding: { dimension: "month", measure: "sales" },
    },
    {
      id: "r_donut",
      title: "渠道分布",
      datasetId: "ds_channel",
      type: "donut",
      x: 0,
      y: 4,
      w: 4,
      h: 4,
      encoding: { dimension: "channel", measure: "amount" },
    },
    {
      id: "r_radar",
      title: "城市订单",
      datasetId: "ds_api_orders",
      type: "radar",
      x: 4,
      y: 4,
      w: 4,
      h: 4,
      encoding: { dimension: "city", measure: "orders" },
    },
    {
      id: "r_line",
      title: "目标对照",
      datasetId: "ds_month",
      type: "line",
      x: 8,
      y: 4,
      w: 4,
      h: 4,
      encoding: { dimension: "month", measure: "target" },
    },
  ],
};

// api 数据集 resolver 演示（真实场景走应用的请求层）
const resolvers = {
  ds_api_orders: async () => {
    await new Promise((r) => setTimeout(r, 600));
    return Array.from({ length: 6 }, (_, i) => ({
      city: ["北京", "上海", "广州", "深圳", "杭州", "成都"][i],
      orders: Math.round(120 + Math.random() * 380),
    }));
  },
};

type BiView = "render" | "designer";

export default function BiDemo() {
  const schema = useMemo(() => SCHEMA, []);
  const [view, setView] = useState<BiView>("render");

  return (
    <BiProvider env={{ resolvers, emptyText: "暂无数据" }}>
      <div className="bi-demo">
        <div className="bi-demo__hint">
          <Radio.Group value={view} onChange={(e) => setView(e.target.value)}>
            <Radio.Button value="render">渲染器</Radio.Button>
            <Radio.Button value="designer">设计器（React 桥接）</Radio.Button>
          </Radio.Group>
        </div>
        <div className="bi-demo__main">
          {view === "render" ? (
            <BiDashboard schema={schema} />
          ) : (
            <BiDesignerReact
              demo
              env={{ resolvers }}
              onChange={(s) => console.log("[bi-demo] designer change:", s.name, s.charts.length, "charts")}
            />
          )}
        </div>
      </div>
    </BiProvider>
  );
}
