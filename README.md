# 班级电子宠物（Class Pet）

班级电子宠物是一个基于 **React + Vite + TypeScript + Capacitor** 的班级激励系统。教师可以为学生加减分、驱动宠物成长，并在班级大屏和学生查询页中实时展示结果。

项目当前同时维护三种运行形态：
- **Web 网页端**：用于 GitHub Pages / 浏览器访问
- **Android App 端**：通过 Capacitor 将网页项目封装为原生 Android 工程
- **Windows 桌面端**：通过 Electron 封装为可直接运行的 `.exe`

---

## 当前版本说明

### Web 版本
- 当前仓库前端包版本：`0.0.0`（见 `package.json`）
- 当前网页端部署基路径：`/class-pet/`
- 适用场景：GitHub Pages、浏览器本地运行、局域网演示

### Android 版本
- 当前 Android `versionName`：`1.0`
- 当前 Android `applicationId`：`com.classpet.app`
- 适用场景：Android Studio 编译、真机安装、APK 导出

### Windows 桌面版本
- 当前桌面端打包方式：Electron + electron-builder
- 当前可执行文件输出目录：`release/`
- 适用场景：Windows 本地安装、免安装运行、教室电脑离线使用

### 版本区分原则
- **网页端更新**：使用 `npm run build`
- **Android 端更新网页资源**：使用 `npm run build:android`
- **Windows 桌面端打包**：使用 `npm run build:exe`
- **Android APK 导出**：在 Android Studio 中继续完成，不是只靠 npm 命令完成
- **Windows .exe 安装包导出**：由 Electron Builder 完成，不影响 GitHub Pages

---

## 已实现的核心功能

### 1. 统一入口门户（Portal）
- 提供教师工作台、班级大屏、学生查询三类入口

### 2. 教师工作台（Teacher Panel）
- 教师注册与登录
- 首次设置班级管理 PIN
- 学生名单维护
- 批量加减分
- 修改班级管理密码

### 3. 班级大屏（Big Screen）
- 展示全班宠物成长状态
- 实时展示经验与等级变化
- 动画反馈与可视化展示

### 4. 学生查询页（Student Query）
- 通过班级 PIN 查询学生情况
- 查看成长账单和加减分记录

### 5. 基础成长系统
- 宠物等级与经验成长
- 负分不降级的防挫折机制
- 随机进化挂件池

---

## 技术栈

- **前端**：React 19 + TypeScript + Vite
- **路由**：React Router（HashRouter）
- **状态管理**：Zustand
- **样式/UI**：Tailwind CSS + Lucide React
- **动效**：Framer Motion
- **数据存储**：浏览器 LocalStorage
- **Android 封装**：Capacitor 8 + Android Studio

---

## 本地开发

### 环境准备
建议至少具备：
- Node.js
- npm
- Android Studio（如果要编译 Android App）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认开发服务脚本为：

```bash
vite --port=3000 --host=0.0.0.0
```

启动后可在浏览器中访问，并分别进入教师端、大屏页和学生页进行测试。

---

## 常用脚本

### 1. 网页端开发

```bash
npm run dev
```

### 2. 网页端生产构建

```bash
npm run build
```

说明：
- 这条命令用于 **网页端发布构建**
- 会按照网页部署模式输出 `dist/`
- 当前会保留网页端需要的基路径 `/class-pet/`

### 3. 本地预览生产包

```bash
npm run preview
```

### 4. 类型检查

```bash
npm run lint
```

### 5. Android 构建同步命令

```bash
npm run build:android
```

它实际会执行：

```bash
npm run build:capacitor && npx cap sync
```

用途：
- 先按 Capacitor 模式构建网页资源
- 再把最新网页代码同步到 Android 工程
- **每次你改完网页代码、准备更新 Android App 时，都运行这条命令**

### 6. GitHub Pages 部署

```bash
npm run deploy
```

说明：
- `deploy` 前会自动执行 `predeploy`
- `predeploy` 会自动运行：

```bash
npm run build
```

### 7. Windows 桌面端开发模式

```bash
npm run dev:desktop
```

用途：
- 用 Electron 启动桌面开发环境
- 开发时仍然使用 Vite 本地服务
- 只影响桌面端，不影响网页端和 Android 端构建

### 8. Windows 桌面端打包

```bash
npm run build:exe
```

它实际会执行：

```bash
npm run build:desktop && electron-builder --win
```

用途：
- 生成桌面端专用前端构建
- 打包 Electron 主进程
- 输出 Windows 可运行程序与安装包

---

## 网页端发布说明

当前项目为了兼容 GitHub Pages，网页端构建保留了子路径配置。

### 发布网页端时使用

```bash
npm run build
```

如果你要发布到 GitHub Pages：

```bash
npm run deploy
```

### 注意
如果你未来把仓库名从 `class-pet` 改掉，或者 GitHub Pages 路径发生变化，需要同步调整 `vite.config.ts` 中网页端的 `base` 配置。

桌面端和 Android 端是独立构建模式：
- GitHub Pages 仍然只依赖网页端 `build`
- Electron 与 Android 都不会直接改写 Pages 发布路径
- 只要继续用 `npm run deploy` 发布网页端，就不会因为桌面端改造而额外引入白屏风险

---

## Android App 更新流程

当你修改了网页前端代码后，想把最新改动同步到 Android App，请按下面流程做。

### 第一步：在项目根目录执行

```bash
npm run build:android
```

这一步会做两件事：
1. 生成适合 Android WebView 的前端资源
2. 自动同步到 `android/` 工程中

### 第二步：打开 Android Studio

打开下面这个目录：

```text
D:\Desk\class pet\android
```

### 第三步：等待 Gradle Sync 完成

如果是第一次打开，Android Studio 可能会提示：
- 安装缺失 SDK
- 接受 License
- 更新 Gradle 组件

正常点击安装/确认即可。

---

## Windows 用户如何导出 APK

### 方式一：导出调试版 APK（最简单）

在 Android Studio 顶部菜单选择：

```text
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

构建完成后，APK 一般在：

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

适合：
- 自己安装测试
- 内部体验
- 快速验证功能

### 方式二：导出正式发布版 APK

在 Android Studio 顶部菜单选择：

```text
Build > Generate Signed Bundle / APK
```

然后按流程：
1. 选择 `APK`
2. 选择或创建 keystore
3. 填写密码、别名等信息
4. 选择 `release`
5. 完成导出

导出的正式 APK 通常位于：

```text
android\app\build\outputs\apk\release\app-release.apk
```

适合：
- 分发给他人安装
- 归档正式安装包

---

## 推荐的日常更新流程

### 如果你改的是网页端，并准备继续发布网页

```bash
npm run build
```

### 如果你改的是网页端，并准备同步到 Android App

```bash
npm run build:android
```

### 如果你改的是网页端，并准备重新生成 Windows 桌面版

```bash
npm run build:exe
```

### 如果你要重新导出 Android 安装包

1. 先执行：

```bash
npm run build:android
```

2. 再到 Android Studio 中重新构建 APK

### 如果你要重新导出 Windows 安装包

直接执行：

```bash
npm run build:exe
```

生成结果通常位于：

```text
release\Class Pet Setup 0.0.0.exe
```

免安装版本位于：

```text
release\win-unpacked\Class Pet.exe
```

---

## 数据与同步说明

本项目当前使用 **LocalStorage** 存储数据。

这意味着：
- 数据默认保存在当前设备、当前浏览器环境中
- **网页端和 Android App 端的数据默认不互通**
- 清除浏览器缓存或更换设备后，数据不会自动迁移
- 当前“实时同步”更接近同设备浏览器上下文内同步，而不是云端同步

如果你未来想让网页端和 App 端共享同一批真实数据，需要额外引入后端或云数据库。

---

## AI 功能相关说明

项目中已经有 AI 对话相关代码，但当前使用时要注意：
- API Key 保存在本地 LocalStorage 中
- 某些模型接口可能会遇到 CORS 限制
- 学生页与大屏页的 AI 配置入口体验还不完全统一

因此，AI 相关能力当前更适合作为本地实验或演示功能使用。

---

## 已知限制

### 1. 网页端与 Android 端数据不互通
当前属于两个本地存储环境，默认不会共享教师账号、学生数据或积分记录。

### 2. 纯本地存储不适合跨设备长期协作
适合演示、轻量班级使用、单设备管理；不适合多设备统一数据源。

### 3. Android 打包不等于自动生成 APK
`npm run build:android` 只负责同步网页资源到 Android 工程；真正导出 APK 仍要靠 Android Studio。

### 4. Windows 桌面版与网页端数据默认不互通
桌面端同样使用本地存储，但它运行在 Electron 容器里，不会自动和浏览器里的本地数据互通。

### 5. Windows 下 `clean` 脚本兼容性一般
当前脚本是：

```bash
rm -rf dist
```

它更适合类 Unix 环境；在 PowerShell 下如果需要清理目录，建议手动删除 `dist/` 或后续改成跨平台命令。

---

## 仓库建议提交内容

应该提交到 Git：
- 前端源码
- `android/` 原生工程源码与配置
- `capacitor.config.ts`
- `README.md`
- `.gitignore`

不应该提交到 Git：
- `node_modules/`
- `dist/`
- Android 构建输出目录
- APK / AAB
- Android Studio 本地缓存
- Gradle 本机缓存

---

## 后续建议

如果你下一步还要继续完善这个项目，建议优先做：
1. 统一 `package.json` 项目名与 README 中的产品名
2. 增加后端或云存储，实现网页端与 App 端数据互通
3. 给 Android 工程补一套正式签名发布流程文档
4. 为教师端登录/退出、PIN 验证等关键流程补自动化测试

---

## 快速命令备忘

### 网页开发

```bash
npm run dev
```

### 网页构建

```bash
npm run build
```

### Android 同步更新

```bash
npm run build:android
```

### 网页部署

```bash
npm run deploy
```

### 类型检查

```bash
npm run lint
```
