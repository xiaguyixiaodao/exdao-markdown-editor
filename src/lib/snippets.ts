export interface Snippet {
  name: string;
  label: string;
  language: string;
  code: string;
}

export const snippets: Snippet[] = [
  {
    name: "react-component",
    label: "React 组件",
    language: "tsx",
    code: `import React from "react";

interface Props {}

export function Component({}: Props) {
  return (
    <div></div>
  );
}`,
  },
  {
    name: "react-hook",
    label: "React Hook",
    language: "tsx",
    code: `import { useState, useEffect } from "react";

export function useCustomHook() {
  const [state, setState] = useState();

  useEffect(() => {}, []);

  return state;
}`,
  },
  {
    name: "python-function",
    label: "Python 函数",
    language: "python",
    code: `def function_name():
    """函数文档字符串"""
    pass`,
  },
  {
    name: "python-class",
    label: "Python 类",
    language: "python",
    code: `class ClassName:
    """类文档字符串"""

    def __init__(self):
        pass`,
  },
  {
    name: "js-function",
    label: "JavaScript 函数",
    language: "javascript",
    code: `function functionName() {
  // TODO: implement
}`,
  },
  {
    name: "js-async",
    label: "Async 函数",
    language: "javascript",
    code: `async function fetchData() {
  try {
    const response = await fetch("");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}`,
  },
  {
    name: "ts-interface",
    label: "TypeScript 接口",
    language: "typescript",
    code: `interface InterfaceName {
  // TODO: define properties
}`,
  },
  {
    name: "html-template",
    label: "HTML 模板",
    language: "html",
    code: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Document</title>
</head>
<body>

</body>
</html>`,
  },
  {
    name: "css-reset",
    label: "CSS Reset",
    language: "css",
    code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}`,
  },
  {
    name: "rust-function",
    label: "Rust 函数",
    language: "rust",
    code: `fn function_name() -> Result<(), Box<dyn std::error::Error>> {
    // TODO: implement
    Ok(())
}`,
  },
  {
    name: "go-function",
    label: "Go 函数",
    language: "go",
    code: `func functionName() error {
    // TODO: implement
    return nil
}`,
  },
  {
    name: "java-class",
    label: "Java 类",
    language: "java",
    code: `public class ClassName {
    // TODO: implement
}`,
  },
  {
    name: "sql-select",
    label: "SQL 查询",
    language: "sql",
    code: `SELECT column1, column2
FROM table_name
WHERE condition
ORDER BY column1;`,
  },
  {
    name: "markdown-table",
    label: "Markdown 表格",
    language: "markdown",
    code: `| 列1 | 列2 | 列3 |
|------|------|------|
| 数据 | 数据 | 数据 |
| 数据 | 数据 | 数据 |`,
  },
];
