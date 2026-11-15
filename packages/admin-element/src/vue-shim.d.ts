// .vue 单文件组件模块声明（包内 PreferencesPanel 等被 ts barrel 引用所需）
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
