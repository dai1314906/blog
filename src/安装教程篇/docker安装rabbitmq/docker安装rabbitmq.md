# docker安装RabbitMQ



一、安装rabbitmq

```shell
docker run -d --name rabbitmq -p 5671:5671 -p 5672:5672 -p 4369:4369 -p 25672:25672 -p 15671:15671 -p 15672:15672 rabbitmq:management
```



配置开机自启

```shell
docker update rabbitmq --restart=always
```



rabbitmq登录地址：

http://192.168.152.20:15672

账号密码：guest/guest

