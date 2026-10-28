import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import VXETable from "vxe-table";
import "vxe-table/lib/style.css";

import "@go-wind-ui/element-pro/style.css";
import { installS2Engine } from "@go-wind-ui/bi-engine-s2";
import { installG6Engine } from "@go-wind-ui/bi-engine-g6";

installS2Engine();
installG6Engine();

import App from "./App.vue";

const app = createApp(App);
app.use(ElementPlus);
app.use(VXETable);
app.mount("#app");
