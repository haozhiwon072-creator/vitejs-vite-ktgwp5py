# MING JII 订货管理

React/Vite 订货系统，使用 Firebase Authentication 登录，并将产品、分店和订单保存到 Firestore。两台电脑通过同一个网站、登录同一个邮箱账号，可以查看同一份资料。不同登录账号的资料相互隔离。

## 免费上线

使用 Firebase **Spark 免费方案**，不要绑定账单账户或信用卡，不要升级到 Blaze。部署内容仅包括静态网站 Hosting 和 Firestore 规则，不使用 Cloud Functions、App Hosting、Cloud Storage 或付费短信登录。使用 Firebase 提供的 `web.app` 网址，无需购买域名。免费额度用完时服务可能暂时停止；保持未绑定账单账户就不会自动转为按量收费。

本仓库已准备部署文件，但目前的云端机器没有可用的 Firebase 登录身份或真实项目配置，因此尚未发布正式网站。下面几项 Google 账号操作需要项目拥有者在自己的浏览器完成。不要在聊天中发送密码、服务账号私钥、登录令牌或下载的凭据文件。

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)，新建或选择一个 **Spark** 项目。不启用 Google Analytics 也可以运行本应用。确认没有关联账单账户；如果现有项目属于 Blaze，请为此网站使用另一个没有账单账户的 Spark 项目。
2. 在 **Authentication → Sign-in method** 启用 **Email/Password**。在 **Users → Add user** 建立你自己的邮箱登录账号。正式项目无需启用匿名登录或短信登录。
3. 在 **Firestore Database** 创建默认数据库，选择 **Standard** 版本和 **Production mode**。数据库地区建议按餐厅所在地选择，例如新加坡 `asia-southeast1`；选定后不能直接修改。先使用生产模式的默认拒绝规则，下一步部署会安装本仓库的访问规则。
4. 在 **项目设置 → 常规** 注册一个网页应用。将网页应用的公开配置填写到本地 `.env.local`；可先复制 `.env.example`。至少填写 `VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID` 和 `VITE_FIREBASE_APP_ID`，并设定 `VITE_USE_EMULATORS=false`。使用配置中的原值，不使用变量替换。`VITE_APP_ID` 用于资料路径，上线后应保持一致。
5. 在能打开你自己的浏览器的电脑终端执行：

   ```bash
   npm ci
   npm run firebase:login
   npm run deploy:free -- --project YOUR_PROJECT_ID
   ```

   将 `YOUR_PROJECT_ID` 替换成控制台显示的项目 ID。首次登录通过 Google 官方页面完成。远程终端无法打开浏览器时，可以使用 Firebase 官方的 `firebase login --no-localhost` 登录方式；登录验证应在你自己的终端完成。
6. 部署成功后，打开终端输出的 Hosting 网址（通常为 `https://YOUR_PROJECT_ID.web.app`）。登录第二步建立的邮箱账号，保存一笔测试订单，再从另一台电脑打开相同网址、登录同一个账号，确认资料同步。

`deploy:free` 会先确认网页配置与目标项目一致，再只读查询 Google Cloud Billing。只有明确返回**未启用计费且未关联账单账户**时才构建和部署；权限不足、查询失败、配置不符、模拟器项目或已付费项目都会阻止部署。构建后还会再次检查账单状态。此命令不会创建项目、绑定账单账户或升级方案。不要绕过这个检查改用其他部署方式；也不要为了查询失败而开通账单账户。

如果账单状态查询因权限失败，请确认当前登录的 Google 账号是项目拥有者或有查看项目账单状态的权限。如果是云环境网络限制，请允许所需的 Firebase/Google API 域名后再重试。正式网站还需要在 Firebase Authentication 的 **Authorized domains** 中保留部署使用的 Hosting 域名。

## 本地开发

建议使用 Node.js 24 LTS 和 Java 21。安装依赖时使用仓库锁文件：

```bash
npm ci
cp .env.example .env.local
npm run dev
```

本地演示可以使用 Firebase Authentication 和 Firestore 模拟器，不需要真实 Firebase 项目或账单账户。先在一个终端启动 `demo-ming-jii-cloud` 项目的模拟器：

```bash
npm run emulators
```

等待模拟器就绪后，在另一个终端运行 `npm run dev:demo`。此命令仅为本次开发启用模拟器，保持 `.env.local` 中的 `VITE_USE_EMULATORS=false` 即可继续用于生产部署。匿名演示账号和模拟器数据仅用于本地开发；正式网站使用邮箱登录。默认模拟器数据可能在停止服务后丢失，也不会自动迁移到正式项目。如需保留测试数据，请使用 Firebase 官方模拟器的 `--import` / `--export-on-exit` 参数，或本环境已保存的模拟器启动说明。

常用验证命令：

```bash
npm run lint
npm run build
npm run test:deploy
```

## 资料访问与跨电脑使用

Firestore 规则只允许已登录账号访问 `artifacts/{appId}/users/{uid}` 下自己的产品、分店和订单。其他账号以及未登录访客无法读取这些资料。不同邮箱账号不会自动看到同一份订单；当前的跨电脑使用方式是由同一个管理账号登录自己的不同电脑。

代码保存在 GitHub，与业务资料分开保存。更换电脑后可以通过 GitHub 取回同一份代码；已部署网站则可以直接用浏览器访问，不需要在每台电脑安装开发工具。上线后修改代码，需要重新部署网站。`.env.local` 和登录凭据不会提交到 GitHub。

免费方案和各服务额度请以官方说明为准：

- [Firebase Spark 与 Blaze 方案](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Hosting 用量与免费额度](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
- [Firestore 免费额度](https://firebase.google.com/docs/firestore/quotas)
- [Firebase CLI 登录](https://firebase.google.com/docs/cli#sign-in-test-cli)

本次云环境无法读取上述 Firebase 文档页面，因此没有把未经当前核实的具体免费额度写成承诺。Codex/GitHub 本身的账号套餐或额度与 Firebase 网站费用分开计算。
