# 编译warning问题



编译项目出现下面问题

![1](img\1.png)



![2](img\2.png)



经过排查发现是vuepress中有一个官方提供`markdown.md`文件里面有问题，把这个文件移除就OK了（这个删除后，不影响）

![3](img\3.png)

再次编译就不会有问题了