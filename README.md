# AI 图片描述生成器

基于 Next.js 14 App Router 构建的智能图片描述生成工具，支持单张和批量模式，使用您的 AIhubMIX API 密钥生成专业的图片描述。

## ✨ 功能特性

### 🔧 API 配置管理
- **自定义 API**：支持用户输入自己的 AIhubMIX API 密钥
- **服务地址配置**：可自定义 API 服务地址
- **安全存储**：API 密钥安全保存在本地浏览器
- **配置验证**：实时验证 API 配置有效性

### 🖼️ 灵活的图片输入
- **单张模式**：支持本地上传或 URL 链接，最大 5MB
- **批量模式**：一次上传多张图片，最多 20 张，单张最大 10MB
- **拖拽上传**：支持拖拽操作，提升用户体验
- **格式支持**：JPG、PNG、WebP 格式，自动验证

### 📝 智能内容生成
- **产品信息可选**：可填写产品信息辅助生成，也可仅基于图片生成
- **多种模型**：通用描述、营销文案、详细特性、社交媒体等不同风格
- **提示词模板**：预设多种常用提示词模板，也支持自定义
- **批量处理**：支持批量生成，自动处理多张图片

### 🎯 结果展示与管理
- **实时生成**：AI 实时生成高质量图片描述
- **批量结果管理**：批量模式下可查看每张图片的生成状态和结果
- **一键复制**：生成结果可一键复制到剪贴板
- **批量导出**：支持复制全部结果或下载为文本文件
- **重试机制**：失败的项目可单独重试或批量重试
- **历史记录**：自动保存最近 10 条生成记录

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 🛠️ 技术栈

- **框架**: Next.js 14+ (App Router)
- **UI 组件**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand (支持持久化)
- **通知系统**: Sonner
- **图标**: Lucide React
- **语言**: TypeScript

## 📋 使用说明

### 1. 配置 API 密钥
- 点击"API 设置"展开配置面板
- 输入您的 AIhubMIX API 密钥
- 配置 API 服务地址（默认已填入）
- 系统会自动验证配置有效性

### 2. 选择工作模式
- **单张模式**：处理单张图片，适合精细化处理
- **批量模式**：一次处理多张图片，提高效率

### 3. 上传图片
**单张模式：**
- 点击"本地上传"选择图片文件
- 或切换到"图片链接"粘贴图片URL
- 支持格式：JPG、PNG、WebP，最大5MB

**批量模式：**
- 拖拽或点击上传多张图片
- 最多支持 20 张图片
- 单张图片最大 10MB

### 4. 填写产品信息（可选）
- 可选填产品的名称、功能、特点、用途等
- 最多 500 个字符
- 留空将仅基于图片生成描述

### 5. 选择生成模型
- **通用描述模型**：适合大多数图片的基础描述
- **营销文案模型**：适合营销推广的文案风格
- **详细特性模型**：详细介绍图片内容和特性
- **社交媒体模型**：适合社交平台分享的风格

### 6. 设置提示词
- 选择预设模板或自定义提示词
- 提示词会影响生成内容的风格和重点
- 可根据使用场景选择合适的模板

### 7. 生成和管理结果
**单张模式：**
- 点击"生成图片描述"开始AI生成
- 生成完成后可一键复制结果
- 不满意可点击"重新生成"

**批量模式：**
- 点击"批量生成"开始处理
- 可查看每张图片的处理状态
- 支持复制单个结果或批量导出
- 失败的项目可单独重试

## ⚙️ 配置说明

### API 集成
当前使用模拟 API，实际使用时需要：

1. 修改 `src/lib/aihubmix.ts` 中的 API 调用逻辑
2. 替换为真实的 AIhubMIX API 接口
3. 添加 API 密钥配置

```typescript
// 示例：替换模拟API为真实API
export async function generateProductDescription(request: GenerateDescriptionRequest) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_KEY}`
    },
    body: JSON.stringify(request)
  })
  
  return response.json()
}
```

### 环境变量
创建 `.env.local` 文件添加必要的环境变量：

```bash
# AI服务API密钥
API_KEY=your_api_key_here

# API服务地址
API_BASE_URL=https://api.example.com
```

## 🎨 自定义样式

项目使用 Tailwind CSS 和 shadcn/ui，可以轻松自定义：

- 修改 `src/styles/globals.css` 调整全局样式
- 编辑组件文件中的 className 属性
- 通过 `tailwind.config.js` 自定义主题

## 📁 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   └── page.tsx           # 主页面
├── components/
│   ├── ui/                # shadcn/ui 组件
│   ├── UploadImage.tsx    # 图片上传组件
│   ├── PromptSelect.tsx   # 提示词选择组件
│   └── ResultCard.tsx     # 结果展示组件
├── lib/
│   ├── utils.ts          # 工具函数
│   └── aihubmix.ts       # API 封装
├── store/
│   ├── counter.ts        # 示例状态
│   └── generator.ts      # 生成器状态管理
└── styles/
    └── globals.css       # 全局样式
```

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run check

# 类型检查
npm run typecheck
```

## 📝 待办事项

- [ ] 集成真实的 AI API 服务
- [ ] 添加更多生成模型选项
- [ ] 支持批量处理多个产品
- [ ] 添加导出功能（PDF、Word等）
- [ ] 用户账户和历史记录云同步
- [ ] 支持多语言生成

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📄 许可证

MIT License