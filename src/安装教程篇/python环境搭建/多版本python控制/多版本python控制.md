# 多版本python控制

一、下载pyenv

https://github.com/pyenv-win/pyenv-win/blob/master/docs/installation.md#pyenv-win-zip

二、配置环境

1、自己配置的文件夹下，如：

`D:\developtools\pyenv\pyenv-win`



然后再系统变量里面添加

```bash
# 变量：
PYENV
# 值：
D:\developtools\pyenv\pyenv-win
```

2、配置path路径

```bash
%PYENV%\bin
%PYENV%\shims
```

3、cmd验证

```bash
pyenv --version
```

如果出现 `pyenv 3.1.1`表示安装成功！！

三、pyenv使用









1、python下载

```bash
# 指定python版本下载
pyenv install 3.13.4

# 下载成功
C:\Users\DL>pyenv install 3.13.4
:: [Info] ::  Mirror: https://www.python.org/ftp/python
:: [Info] ::  Mirror: https://downloads.python.org/pypy/versions.json
:: [Info] ::  Mirror: https://api.github.com/repos/oracle/graalpython/releases
:: [Downloading] ::  3.13.4 ...
:: [Downloading] ::  From https://www.python.org/ftp/python/3.13.4/python-3.13.4-amd64.exe
:: [Downloading] ::  To   D:\developtools\pyenv\pyenv-win\install_cache\python-3.13.4-amd64.exe
:: [Installing] ::  3.13.4 ...
:: [Info] :: completed! 3.13.4
```

2、查看

```bash
# 查看当前版本信息：
pyenv versions
# 执行结果如下：
C:\Users\DL>pyenv versions
  3.13.4
# 如果未指定具体版本，会按照当前版本的最高版本下载
C:\Users\DL>pyenv install 2.7
:: [Info] ::  Mirror: https://www.python.org/ftp/python
:: [Info] ::  Mirror: https://downloads.python.org/pypy/versions.json
:: [Info] ::  Mirror: https://api.github.com/repos/oracle/graalpython/releases
:: [Downloading] ::  2.7.18 ...
:: [Downloading] ::  From https://www.python.org/ftp/python/2.7.18/python-2.7.18.amd64.msi
:: [Downloading] ::  To   D:\developtools\pyenv\pyenv-win\install_cache\python-2.7.18.amd64.msi
:: [Installing] ::  2.7.18 ...
:: [Info] :: completed! 2.7.18

C:\Users\DL>pyenv versions
  2.7.18
  3.13.4
```

3、卸载对应的版本

```bash
# pyenv uninstall 2.7.18

C:\Users\DL>pyenv uninstall 2.7.18
pyenv: Successfully uninstalled 2.7.18

C:\Users\DL>pyenv versions
  3.13.4
```



四、设置命令

```bash
1.
global
设置全局解释器
用法：pyenv global 3.8.5
通过这个命令可以方便的切换python的全局版本
2.
local
设置局部解释器
用法： pyenv local
3.8.5
这个命令主要是在指定的目录下，设置python的版本

3.
shell
设置终端解释器
用法： pyenv shell
3.8.5
# 设置当前终端的默认解释器版本
4.
version
显示当前解释器版本
用法： pyenv version
# 查看当前终端使用的是那个版本
```

其他命令

```bash
1.commands
显示所有可用的命令

2.update
新 pyenv 到最新版本

3.which
显示 python 或者 pip 命令的路径
```



总结

安装命令

| install   | 安装指定版本 Python  | 用法：pyenv install 3.8.5   |
| --------- | -------------------- | --------------------------- |
| uninstall | 卸载指定版本 Python  | 用法：pyenv uninstall 3.8.5 |
| versions  | 查看安装 Python 列表 | 用法：pyenv versions        |

设置命令

| global  | 设置全局解释器     | 用法：pyenv global 3.8.5 |
| ------- | ------------------ | ------------------------ |
| local   | 设置局部解释器     | 用法：pyenv local  3.8.5 |
| shell   | 设置终端解释器     | 用法：pyenv shell  3.8.5 |
| version | 显示当前解释器版本 | 用法: pyenv version      |

其他命令

| commands | 显示所有可用的命令              | pyenv commands                          |
| -------- | ------------------------------- | --------------------------------------- |
| update   | 更新 pyenv 到最新版本           | pyenv update                            |
| which    | 显示 python 或者 pip 命令的路径 | pyenv which python<br />pyenv which pip |



五、虚拟环境搭建



>基于 pyenv-win 创建虚拟环境的步骤如下：
>
>1. 使用命令 `pyenv shell 版本` 设置当前虚拟环境的版本
>2. 使用命令 `python -m venv 名字` 创建虚拟环境
>3. 使用命令 `.\名字\Scripts\activate` 激活虚拟环境
>4. 使用命令 `deactivate` 退出环境
>
>如果需要删除虚拟环境，则删除虚拟环境目录即可。



```bash
cmd D:\developtools\pyenv
# 创建虚拟环境前，一定要注意版本
D:\developtools\pyenv>pyenv version
3.13.4 (set by D:\developtools\pyenv\pyenv-win\version)

D:\developtools\pyenv>python -m venv demo01-env

# 可以看见在当前目录下创建了对应的虚拟环境

# 这里是激活虚拟环境
D:\developtools\pyenv>.\demo01-env\Scripts\activate

(demo01-env) 
# 不激活虚拟环境
D:\developtools\pyenv>deactivate
# 通过下面命令可以检查当前虚拟环境的使用版本
D:\developtools\pyenv>python -V
Python 3.13.4

# 创建一个虚拟环境目录 envs 后面好方便管理
cmd D:\developtools\pyenv\envs

# 如果删除，找到对应的env文件目，直接删掉就行了

```

后面为了方便使用不同版本的python 建议使用 `pyenv shell [python版本]`，这种方式的好处就是不要global 或者 local那么麻烦切换，命令窗口关闭也就失效了，只有设置打开后才有效



六、配置pyenv以及pycharm

1、通过pyenv创建虚拟环境

为了防止自己有可能使用到自己安装的python环境，可以使用下面命令，就之间指定是pyenv来创建

```bash
# 使用 pyenv-win 创建虚拟环境
pyenv shell 3.8.5
pyenv exec python -m venv demo01-env

# 如果没有自己安装python，那么直接使用 pyenv
python -m venv demo01-env

# 检查pip 安装的虚拟环境的位置
D:\developtools\pyenv\envs>pip --version
pip 25.1.1 from D:\developtools\pyenv\pyenv-win\versions\3.13.4\Lib\site-packages\pip (python 3.13)

# 激活虚拟环境
D:\developtools\pyenv\envs>.\demo01-env\Scripts\activate
(demo01-env) 

# 重新检查pip 这个时候 pip指定到了demo01-env就是我们创建的虚拟环境  这一步很重要！！！！
(demo01-env) D:\developtools\pyenv\envs>pip --version
pip 25.1.1 from D:\developtools\pyenv\envs\demo01-env\Lib\site-packages\pip (python 3.13)

# 检查没有问题了后，就使用 pip install 下载工具包了
(demo01-env) D:\developtools\pyenv\envs>pip install matplotlib
WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None)) after connection broken by 'ReadTimeoutError("HTTPSConnectionPool(host='pypi.org', port=443): Read timed out. (read timeout=15)")': /simple/matplotlib/
Collecting matplotlib
  Downloading matplotlib-3.11.2-cp313-cp313-win_amd64.whl.metadata (80 kB)
Collecting contourpy>=1.0.1 (from matplotlib)
  Downloading contourpy-1.4.0-cp313-cp313-win_amd64.whl.metadata (3.8 kB)
WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None)) after connection broken by 'ReadTimeoutError("HTTPSConnectionPool(host='pypi.org', port=443): Read timed out. (read timeout=15)")': /simple/cycler/
WARNING: Retrying (Retry(total=3, connect=None, read=None, redirect=None, status=None)) after connection broken by 'ReadTimeoutError("HTTPSConnectionPool(host='pypi.org', port=443): Read timed out. (read timeout=15)")': /simple/cycler/
Collecting cycler>=0.10 (from matplotlib)
  Downloading cycler-0.12.1-py3-none-any.whl.metadata (3.8 kB)
Collecting fonttools>=4.28.2 (from matplotlib)
  Downloading fonttools-4.66.0-cp313-cp313-win_amd64.whl.metadata (131 kB)
Collecting kiwisolver>=1.3.1 (from matplotlib)
  Downloading kiwisolver-1.5.1-cp313-cp313-win_amd64.whl.metadata (5.2 kB)
Collecting numpy>=1.25 (from matplotlib)
  Downloading numpy-2.5.3-cp313-cp313-win_amd64.whl.metadata (6.6 kB)
Collecting packaging>=20.0 (from matplotlib)
  Downloading packaging-26.3-py3-none-any.whl.metadata (3.5 kB)
Collecting pillow>=9 (from matplotlib)
  Downloading pillow-12.3.0-cp313-cp313-win_amd64.whl.metadata (9.3 kB)
Collecting pyparsing>=3 (from matplotlib)
  Downloading pyparsing-3.3.3-py3-none-any.whl.metadata (5.9 kB)
Collecting python-dateutil>=2.7 (from matplotlib)
  Downloading python_dateutil-2.9.0.post0-py2.py3-none-any.whl.metadata (8.4 kB)
Collecting six>=1.5 (from python-dateutil>=2.7->matplotlib)
  Downloading six-1.17.0-py2.py3-none-any.whl.metadata (1.7 kB)
Downloading matplotlib-3.11.2-cp313-cp313-win_amd64.whl (9.3 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 9.3/9.3 MB 787.2 kB/s eta 0:00:00
Downloading contourpy-1.4.0-cp313-cp313-win_amd64.whl (234 kB)
Downloading cycler-0.12.1-py3-none-any.whl (8.3 kB)
Downloading fonttools-4.66.0-cp313-cp313-win_amd64.whl (2.5 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.5/2.5 MB 2.8 MB/s eta 0:00:00
Downloading kiwisolver-1.5.1-cp313-cp313-win_amd64.whl (70 kB)
Downloading numpy-2.5.3-cp313-cp313-win_amd64.whl (12.6 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 12.6/12.6 MB 4.6 MB/s eta 0:00:00
Downloading packaging-26.3-py3-none-any.whl (129 kB)
Downloading pillow-12.3.0-cp313-cp313-win_amd64.whl (7.2 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 7.2/7.2 MB 6.8 MB/s eta 0:00:00
Downloading pyparsing-3.3.3-py3-none-any.whl (126 kB)
Downloading python_dateutil-2.9.0.post0-py2.py3-none-any.whl (229 kB)
Downloading six-1.17.0-py2.py3-none-any.whl (11 kB)
Installing collected packages: six, pyparsing, pillow, packaging, numpy, kiwisolver, fonttools, cycler, python-dateutil, contourpy, matplotlib
Successfully installed contourpy-1.4.0 cycler-0.12.1 fonttools-4.66.0 kiwisolver-1.5.1 matplotlib-3.11.2 numpy-2.5.3 packaging-26.3 pillow-12.3.0 pyparsing-3.3.3 python-dateutil-2.9.0.post0 six-1.17.0

[notice] A new release of pip is available: 25.1.1 -> 26.2.1
[notice] To update, run: python.exe -m pip install --upgrade pip

(demo01-env) D:\developtools\pyenv\envs>

# 这里是根据上面的 [notice] 根据提示给的命令升级pip

(demo01-env) D:\developtools\pyenv\envs>python.exe -m pip install --upgrade pip
Requirement already satisfied: pip in d:\developtools\pyenv\envs\demo01-env\lib\site-packages (25.1.1)
Collecting pip
  Downloading pip-26.2.1-py3-none-any.whl.metadata (4.6 kB)
Downloading pip-26.2.1-py3-none-any.whl (1.8 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.8/1.8 MB 6.1 MB/s eta 0:00:00
Installing collected packages: pip
  Attempting uninstall: pip
    Found existing installation: pip 25.1.1
    Uninstalling pip-25.1.1:
      Successfully uninstalled pip-25.1.1
Successfully installed pip-26.2.1

(demo01-env) D:\developtools\pyenv\envs>
```



配置pycharm的时候，因为我没有安装python是通过pyenv来安装的，所以这个时候要到settings下指定当前python的运行版本

`settings -> python -> interpreter ->选存在的`

然后记得选择是创建的比如`D:\developtools\pyenv\envs\demo01-env\Scripts\python.exe `即可



使用pyCharm的时候记得一定要看看前面有没有前缀(python3_13_4)，这样执行安装命令的时候才能下载到虚拟环境

```bash
(python3_13_4) PS F:\languageStudy\PythonStudy> 

(python3_13_4) PS F:\languageStudy\PythonStudy> pip freeze  # 查看安装的包
cn2an==0.5.24
contourpy==1.4.0
cycler==0.12.1
fonttools==4.66.0
kiwisolver==1.5.1
matplotlib==3.11.2
numpy==2.5.3
packaging==26.3
pillow==12.3.0
proces==0.1.7
pyparsing==3.3.3
python-dateutil==2.9.0.post0
six==1.17.0
```

