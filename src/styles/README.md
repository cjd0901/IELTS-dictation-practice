# 样式顺序

入口先加载 `global.css`，App 再依次加载 `workspace.css`、`theme.css`、`selects.css`、`layout.css`。

这是原项目的既有覆盖顺序。目录整理和格式化后，各文件经过 Lightning CSS 标准化得到的输出与备份逐字节相同。暂不合并覆盖规则或推断删除旧样式，防止改变断点、选择器优先级、原生下拉框回退及弹窗的外观。
