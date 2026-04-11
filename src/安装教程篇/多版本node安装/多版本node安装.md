# Windows11实现nodejs、npm多版本管理以及切换



## 1、介绍nvm

nvm(Node Version Manager)‌ 是一个用于在Windows上管理多个Node.js版本的工具

## 2、安装、配置nvm

### 2.1、卸载现有的nodejs（如果有安装了nodejs一定要卸载！！！）

检查当前电脑是否安装了nodejs

```shell
# 查看node版本
node -v
# 查看npm版本
npm -v

# 我这里电脑装的是版本比较高，是因为我要用这些高版本的运行vuepress博客项目
# node: v22.22.1 
# npm: 10.9.4
```



### 2.2、卸载node

 打开电脑控制面板->卸载程序->找到node，右键点击卸载

检查安装在node的位置，我是放在d盘，删除后，就只保留了【node_cache】【node_global 】



![查看node版本以及安装位置](.\img\1.png)

### 2.3、安装nvm

下载nvm-forwindows

GitHub下载地址：https://github.com/coreybutler/nvm-windows/releases

我这里下载最新的版本：1.2.2

![下载nvm](.\img\2.png)



1.双击运行下载的nvm-setup.exe。

2.选择”1 accept..."，点击“Next”

![安装nvm](.\img\3.png)

3.填写nvm 的安装目录，例如：`D:\developtools\nvm_forwindows\nvm`，点击“Next”

![安装nvm](.\img\4.png)

4.填写Node.js的活动版本位置（此目录将自动添加到系统路径中），例如：`D:\developtools\nodejs`

![安装nvm](.\img\5.png)

5.桌面通知选项，都去除勾选，点击“Next”

![安装nvm](.\img\6.png)

6.接收通知邮箱，不用填，点击“Next”

![安装nvm](.\img\7.png)

7.点击”Install“，开始安装

![安装nvm](.\img\8.png)

8.去除勾选，点击“Finish”

![安装nvm](.\img\9.png)

### 2.4、验证安装

```shell
nvm version
```



![验证安装的nvm版本](.\img\10.png)



如果正确输出了nvm的版本号（例如1.2.2），则说明安装成功。

### 2.5、配置nvm

#### 1、配置国内镜像源

为了加速从网络下载Node.js版本，将镜像源设置为国内的淘宝镜像。

桌面右击，点击“在终端中打开”，将打开PowerShell终端，输入以下命令：

```shell
nvm node_mirror https://npmmirror.com/mirrors/node/
nvm npm_mirror https://npmmirror.com/mirrors/npm/
```

 

![配置nvm镜像源](.\img\11.png)



#### 2、配置完成后，就可以开始多版本的node和npm切换了

安装配置好nvm后，管理Node.js版本就变得非常简单。
桌面右击，点击“在终端中打开”，将打开PowerShell终端。执行接下来的步骤：



```shell
# 列出所有可安装的版本
nvm list available

# 安装指定版本的 Node.js 22.22.1
nvm install 22.22.1
# 查看已安装的版本
nvm list
# 使用 Node.js 版本 22.22.1
nvm use 22.22.1
# 再次查看已安装的版本，*开头得就是当前得版本
nvm list
# 验证当前的 Node.js 版本
node -v
# 验证当前的npm 版本
npm -v

```

1、列出可以安装的node版本

![列出可以安装的node版本](.\img\12.png)



2、安装22.22.1版本



![安装的node22.22.1版本](.\img\13.png)

3、使用node 22.22.1版本

记得不用自己自定目录，nvm会自己创建

![使用node22.22.1版本](.\img\14.png)

4、检查node 和 npm版本

![检查node和npm的版本](.\img\15.png)

这里npm版本报错，换成cmd普通窗口权限看到是正常的

![检查node和npm的版本](.\img\16.png)

验证npm是否生效，我使用我的博客网站看看npm能否正常执行

![npm执行情况](.\img\17.png)

当我安装旧版本的node的版本时候出现报错`nvm install 10.16.3`

![安装10.16.3版本报错](.\img\18.png)



```shell
Downloading node.js version 10.16.3 (64-bit)...
Complete
Downloading npm...
Creating C:\Users\DL\AppData\Local\Temp\nvm-install-2803335203\temp

Downloading npm version 6.9.0... Complete
Installing npm v6.9.0...
error installing 10.16.3: open C:\Users\DL\AppData\Local\Temp\nvm-npm-3548181780\npm-v6.9.0.zip: The system cannot find the file specified.
```



经过网上排查发现，nvm下载node成功了，但是npm下载出现了问题

![安装10.16.3版本问题排查](.\img\19.png)

`cd C:\Users\DL\AppData\Local\Temp\nvm-install-2803335203`该目录确实成功安装了node版本

![安装10.16.3版本问题排查](.\img\20.png)

`cd C:\Users\DL\AppData\Local\Temp\nvm-npm-3548181780\`看临时目录是个空文件夹，意味着nvm下载失败

![安装10.16.3版本问题排查](.\img\21.png)

解决方案一，nvm替换成`1.1.12`版本，卸载当前的`1.2.2`版本

执行【unins000.exe】卸载当前版本

![卸载](.\img\22.png)

安装nvm 1.1.12版本

![安装nvm1.1.12版本](.\img\23.png)

替换了版本后安装10.16.3版本的node成功！！！

![nvm安装不同node版本](.\img\24.png)

### 2.6、配置node环境变量配置

（1） 配置全局安装的模块路径和缓存路径
首先在NVM的安装目录新建两个文件夹node_global和node_cache

 `D:\developtools\nvm_forwindows\nvm`

创建文件夹

（2）创建完两个文件夹后，在cmd窗口中输入以下命令（两个路径即是两个文件夹的路径）
npm config set prefix "D:\developtools\nvm_forwindows\nvm\node_global"
npm config set cache "D:\developtools\nvm_forwindows\nvm\node_cache"

npm config set registry https://registry.npmmirror.com

npm install -g cnpm --registry=https://registry.npmmirror.com

**这个每个版本切换后注意都要指定一下**

![配置全局模块路径和缓存路径](.\img\25.png)

（3）设置系统变量
path变量的设置和用户变量中一致

先配置【系统变量】

![配置系统变量](.\img\26.png)



![配置系统变量](.\img\27.png)



再配置用户变量

![配置用户变量](.\img\28.png)

## 3、运行项目进行验证

1、运行博客这个使用的是22.22.1版本

![验证项目-博客](.\img\29.png)

![验证项目-博客](.\img\30.png)

![验证项目-博客](.\img\31.png)



2、验证谷粒商城，使用的是10.16.3

