/**
 * 中文文案（默认语言）。
 *
 * 键值取自 go-wind-admin vue-element 端同名键，键形保持
 * common.* / curd.* 与应用侧一致，便于双向同步。
 */
export default {
  "common": {
    "button": {
      "add": "新增",
      "delete": "删除",
      "import": "导入",
      "export": "导出",
      "search": "搜索",
      "reset": "重置",
      "retry": "重试",
      "expand": "展开",
      "collapse": "收起",
      "confirm": "确定",
      "cancel": "取消",
      "more": "更多",
      "edit": "编辑",
      "view": "查看",
      "update": "更新",
      "close": "关闭"
    },
    "title": {
      "confirm": "确认"
    },
    "table": {
      "noData": "暂无数据"
    },
    "message": {
      "loadDataFailed": "数据加载失败"
    },
    "modal": {
      "create": "创建{moduleName}",
      "update": "更新{moduleName}",
      "view": "查看{moduleName}"
    },
    "drawer": {
      "unsavedMessage": "表单内容已修改，是否放弃本次编辑？",
      "discardButton": "确定放弃"
    },
    "iconSelect": {
      "selectPlaceholder": "点击选择图标",
      "searchPlaceholder": "搜索图标",
      "elementTab": "Element 图标"
    },
    "notification": {
      "createSuccess": "创建成功",
      "createFailed": "创建失败",
      "updateSuccess": "更新成功",
      "updateFailed": "更新失败"
    },
    "operationFailed": "操作失败"
  },
  "curd": {
    "toolbar": {
      "filter": "筛选列",
      "filterAll": "全部",
      "filterReset": "恢复默认",
      "refresh": "刷新",
      "search": "搜索",
      "batchImport": "批量导入",
      "fullscreen": "全屏",
      "columnSetting": "列设置"
    },
    "search": {
      "expand": "展开",
      "collapse": "收起"
    },
    "export": {
      "exportAll": "导出全部",
      "csv": "CSV (逗号分隔)",
      "xlsx": "Excel 工作簿",
      "serverXlsx": "服务端全量 (XLSX)",
      "success": "已导出 {count} 行",
      "failed": "导出失败"
    },
    "import": {
      "title": "导入数据",
      "file": "文件",
      "dragText": "将文件拖到此处，或",
      "clickText": "点击上传",
      "fileTypeTip": "*.xlsx / *.xls 格式的文件",
      "downloadTemplate": "下载导入模板"
    },
    "message": {
      "selectDeleteItems": "请勾选要删除的项",
      "confirmDelete": "确认删除?",
      "deleteSuccess": "删除成功",
      "noDeleteAction": "未配置 deleteAction",
      "selectFields": "请选择要导出的字段",
      "noExportsAction": "未配置 exportsAction",
      "selectFile": "请选择要导入的文件",
      "noImportTemplate": "未配置 importTemplate",
      "importSuccess": "导入数据成功",
      "noImportAction": "未配置 importAction",
      "noImportsAction": "未配置 importsAction",
      "noDataParsed": "未解析到数据",
      "readFileFailed": "读取文件失败",
      "importFailed": "导入失败",
      "noModifyAction": "未配置 modifyAction",
      "noExportAction": "未配置 exportAction",
      "operationSuccess": "操作成功"
    }
  }
};
