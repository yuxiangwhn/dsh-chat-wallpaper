# dsh-chat-wallpaper

在 DeepSeek Harness 聊天界面背后铺一张图，并把前面的界面重新做成玻璃材质——图透出来，而不是被盖住。

[English](README.md)

![内置默认壁纸](assets/wallpaper-preview.jpg)

## 它做什么

- **壁纸层。** 一个固定的图片层铺在整个外壳背后，同时把应用的背景色 token 换成半透明色，于是边框、侧栏、内容列都能透出画面。
- **玻璃表面。** 输入框卡片、你自己发的消息气泡、新会话按钮换成磨砂材质（模糊 + 着色 + 1px 内描边），看起来像浮在壁纸前面的材质，而不是平板色块。
- **模糊跟着对话走。** 空的新会话只显示滑杆设定的模糊；一旦输入框里有文字，或这段对话已经有消息，就在此基础上自动 **+5px**，带 0.45s 过渡，并且发送后仍然保持。
- **设置类窗口让背景磨砂。** 有叠放窗口打开时（设置、插件市场、配对弹窗……），背景瞬间磨砂，前面的窗口保持清晰；关掉立刻恢复清晰。输入框里的 `/` 命令面板这类弹出菜单不算窗口，不会让背景冻结。
- **自己的图。** 面板里的「选择图片…」把任意本地图片存进 IndexedDB（只存在这个浏览器配置里，不上传）。「默认」恢复内置图片。
- **控制按钮在侧栏底部。** 常见工具图标旁边一个小按钮，点开就是滑杆，没有往设置页里加东西。

## 安装

```
dsh plugin add dsh-chat-wallpaper
```

目前没有发到 npm，可以装预构建的 tarball：

```
dsh plugin add https://github.com/yuxiangwhn/dsh-chat-wallpaper/releases/download/v1.1.0/dsh-chat-wallpaper-1.1.0.tgz
```

收录之后也可以在 DSH 的插件市场里搜索 `dsh-chat-wallpaper` 一键安装。

## 控制项

| 控制 | 范围 | 作用 |
| --- | --- | --- |
| 亮度 | 50–220% | 壁纸层的 brightness |
| 透明度 | 15–100% | 壁纸层的不透明度 |
| 磨砂 | 0–24px | 壁纸层的基础模糊 |
| 面板 | 15–98% | 外壳（内容、侧栏、面板）着色的不透明度 |
| 图片 | — | 选择本地图片，或恢复内置默认图 |
| 重置 | — | 回到默认参数 |

参数存在 `localStorage` 的 `dsh-chat-wallpaper:settings:v1`；选择的图片存在 IndexedDB（`dsh-chat-wallpaper`）。

## 兼容性

在 DSH 桌面窗口（Windows，DSH `0.2.2-rc.1`）上开发和验证。网页版走同一套代码；macOS 使用外壳提供的 `darwin` 框架规则。

## 隐私

插件不发网络请求，没有宿主端代码，也不写任何文件。内置默认图由 `scripts/make-wallpaper.py` 生成；你选的图片只留在本机这个浏览器配置的 IndexedDB 里。

## 已知限制

- 玻璃材质依赖外壳当前的 DOM 结构（输入框卡片、用户气泡行、侧栏底部）。宿主大版本更新改名后，部分界面可能暂时没有材质，需要同步选择器。
- 壁纸是一整层：超宽屏或多显示器按窗口铺满缩放，不是逐屏平铺。
- 模糊与透明都是页面内的 CSS 效果，不影响窗口自身的阴影和系统标题栏。

## 开发

```
python build_client.py                 # client.src.js -> lib/client.js，并内嵌 assets/wall.jpg
python scripts/make-wallpaper.py       # 重新生成内置默认图
```

`client.src.js` 是可读源码；`lib/client.js` 是 DSH 实际加载的文件，里面把图片存成 data URL（桌面外壳会自己响应看起来像文件的 `dsh-app://` 路径，所以图片不能按 URL 取）。

## 许可

MIT。内置壁纸由上面的脚本程序化生成，采用同样的许可。
