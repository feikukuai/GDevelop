# GitHub Actions 配置说明

本文档说明如何为 GDevelop 项目配置 GitHub Actions 工作流。

## 📋 概述

已将 CircleCI 配置转换为 GitHub Actions 工作流：
- `.github/workflows/build.yml` - 完整构建流程（适用于 master、stable 分支）
- `.github/workflows/build-pr.yml` - PR 快速检查（适用于 Pull Request）

## 🔧 必需的 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets（Settings → Secrets and variables → Actions）：

### 代码签名相关（可选，用于生产构建）

| Secret 名称 | 说明 |
|------------|------|
| `CSC_LINK` | macOS 代码签名证书（Base64 编码的 .p12 文件） |
| `CSC_KEY_PASSWORD` | macOS 证书密码 |
| `ESIGNER_USER_NAME` | SSL.com eSigner 用户名（Windows 签名） |
| `ESIGNER_USER_PASSWORD` | SSL.com eSigner 密码 |
| `ESIGNER_USER_TOTP` | SSL.com eSigner TOTP（双因素认证） |

### AWS S3 相关（可选，用于上传构建产物）

| Secret 名称 | 说明 |
|------------|------|
| `AWS_ACCESS_KEY_ID` | AWS 访问密钥 ID |
| `AWS_SECRET_ACCESS_KEY` | AWS 访问密钥 |
| `AWS_REGION` | AWS 区域（默认：us-east-1） |

## 🚀 使用方法

### 1. 首次设置

1. 进入 GitHub 仓库页面
2. 点击 Settings → Secrets and variables → Actions
3. 点击 "New repository secret" 添加上述所需的 secrets

### 2. 触发构建

**自动触发**：
- 推送到 `master` 或 `stable` 分支 → 完整构建
- 推送到 `experimental-build/*` 分支 → 完整构建
- 创建 Pull Request → 快速检查

**手动触发**（需要添加手动触发工作流）：
```yaml
# 在 build.yml 的 on: 部分添加
workflow_dispatch:
```

### 3. 查看构建结果

- 进入 GitHub 仓库 → Actions 标签
- 查看运行中的工作流
- 构建完成后可下载构建产物（Artifacts）

## 📦 构建产物

每个平台构建完成后会上传以下 Artifacts：

| Artifact 名称 | 说明 | 保留天数 |
|--------------|------|---------|
| `gdevelop-js-binaries` | GDevelop.js WebAssembly 库 | 7 天 |
| `windows-build` | Windows 安装程序 | 30 天 |
| `macos-build` | macOS 应用包 | 30 天 |
| `linux-build` | Linux 安装包 | 30 天 |
| `gdevelop-js-debug` | 调试版本（带 sanitizer） | 7 天 |

## 🔍 工作流说明

### build.yml（完整构建）

**包含的 Job**：

1. **build-gdevelop-js** - 构建 GDevelop.js WebAssembly 库
   - 安装 Emscripten
   - 编译 WebAssembly
   - 运行测试

2. **build-windows** - Windows 构建
   - 依赖: build-gdevelop-js
   - 构建 NSIS 安装程序
   - 构建 AppX 包

3. **build-macos** - macOS 构建
   - 独立构建 GDevelop.js
   - 构建通用二进制文件
   - 代码签名（如果配置了 secrets）

4. **build-linux** - Linux 构建
   - 依赖: build-gdevelop-js
   - 构建 AppImage/DEB/RPM 包

5. **build-debug-sanitizers** - 调试构建（仅 master/stable）
   - 运行 clang-tidy
   - 使用 sanitizer 检测内存错误

### build-pr.yml（PR 快速检查）

**包含的 Job**：

1. **test** - 运行单元测试
2. **build-check** - 快速构建测试（不打包）
3. **lint** - 代码风格检查
4. **pr-summary** - 汇总检查结果

## ⚡ 性能优化

### 缓存策略

工作流使用 GitHub Actions 缓存加速构建：
- `node_modules` 缓存
- `~/.npm` 缓存
- 基于包 lock 文件哈希的键

### 并行执行

- Windows、macOS 构建可以并行（macOS 独立构建 GDevelop.js）
- Linux 构建等待 GDevelop.js 构建

## 🐛 故障排除

### 常见问题

1. **Node.js 版本不匹配**
   - 检查 `NODE_VERSION` 环境变量（默认 20.x）

2. **Emscripten 安装失败**
   - 可能需要增加超时时间或重试

3. **内存不足**
   - 已设置 `NODE_OPTIONS: --max-old-space-size=7168`
   - 可根据需要调整

4. **代码签名失败**
   - 检查 secrets 是否正确配置
   - 证书是否过期

### 查看日志

- 进入 Actions → 选择工作流运行 → 点击失败的任务
- 查看详细的错误日志

## 🔄 从 CircleCI 迁移

已完成的转换：

| CircleCI | GitHub Actions | 状态 |
|---------|---------------|------|
| `build-macos` | `build-macos` | ✅ |
| `build-linux` | `build-linux` | ✅ |
| `build-windows` | `build-windows` | ✅ |
| `build-gdevelop_js-wasm-only` | `build-gdevelop-js` | ✅ |
| `build-gdevelop_js-debug-sanitizers` | `build-debug-sanitizers` | ✅ |
| `trigger-appveyor-windows-build` | 已移除（Windows 构建已集成） | ✅ |

## 📝 注意事项

1. **代码签名是可选的**：不配置签名相关 secrets 仍可构建，但构建产物未签名
2. **S3 上传是可选的**：不配置 AWS secrets 仍可构建，产物只保存在 GitHub Actions Artifacts
3. **PR 构建更快**：PR 只做快速检查，不进行完整打包
4. **experimental-build 分支**：支持所有实验分支的完整构建

## 🔗 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Actions 缓存](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Electron Builder 文档](https://www.electron.build/)
- [Emscripten 文档](https://emscripten.org/docs/)
