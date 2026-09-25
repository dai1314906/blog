# elasticsearch安装



# 1、ES简介

## 1.1、理解es

![es架构图](.\img\1.png)



为了方便理解ES，可以拿传统数据库作对比

| mysql数据库           | ElasticSearch |
| --------------------- | ------------- |
| 数据库 database       | 索引 index    |
| 数据表 table          | 类型 type     |
| 数据表里面的数据 data | 文档 doc      |
| 数据表的列名          | 属性          |



## 1.2、倒排索引

![倒排索引实现](.\img\2.png)



在我们MySQL中存储数据时，通常会使用正向索引。每条数据都有一个唯一ID，数据本身按行存储。假设我们在电影表中存了大量电影，现在要检索“红海行动”相关的影片。如果写 `LIKE '%红海行动%'`，MySQL就会逐条扫描所有记录，检查每条记录中是否包含“红海行动”这几个字。这是一个非常慢的操作。

Elasticsearch之所以能快速检索出相关电影数据，核心在于它的**倒排索引机制**。

在存储数据时，假设我们要保存五条电影记录：红海行动、探索红海行动、红海特别行动、红海纪录片、特工红海特别探索。

ES在保存每条记录时，会先做一步操作——**分词**，把整句话拆分成一个个独立的单词。

比如第一条"红海行动"，可以拆分成"红海"和"行动"两个词。ES保存这条记录（即1号文档）的同时，会额外维护一张倒排索引表，记录"红海"和"行动"这两个词出现在1号文档中。

接着保存第二条"探索红海行动"，分词得到"探索""红海""行动"。ES会在倒排索引表中添加："探索"出现在2号文档，"红海"和"行动"也追加记录2号文档。

第三条"红海特别行动"拆成"红海""特别""行动"，倒排索引继续更新这三个词对应的文档编号。

第四条"红海纪录片"拆成"红海""纪录片"，其中"纪录片"是首次出现的新词。

第五条"特工红海特别探索"拆成"特工""红海""特别""探索"，同样更新倒排索引。

最终，倒排索引表就变成了这样一个结构：每个单词后面都记录了它出现在哪些文档里。

当我们搜索"红海特工行动"时，ES也会先将查询条件分词，得到"红海""特工""行动"三个词。然后去倒排索引表中查找：

- "红海"出现在1、2、3、4、5号文档
- "特工"出现在5号文档
- "行动"出现在1、2、3号文档

所以包含至少一个关键词的文档是1、2、3、4、5号全部命中。

但哪个结果最相关呢？ES会计算**相关性得分**。比如"红海特工行动"共三个词，3号文档命中了"红海"和"行动"两个词（共3个词中命中2个），而5号文档虽然也命中了"红海"和"特工"两个词，但5号文档本身有4个词（特工、红海、特别、探索），命中比例更低。因此3号文档的相关性得分更高。

最终ES会按相关性得分从高到低排序，返回最匹配的结果。

如果用MySQL来实现同样的功能，需要写各种复杂的 `LIKE`组合，性能差且实现困难。而Elasticsearch的优势正在于**全文检索**，并且检索完成后还能对数据进行复杂的聚合分析。这就是ES的核心价值所在。



# 2、安装ES和Kibana

## 2.1、下载镜像文件

```shell
#存储和检索数据
docker pull elasticsearch:7.4.2
#可视化检索数据
docker pull kibana:7.4.2
```

下载完成后，记得`docker images`检查一下

注意，如果不是root用户操作的，建议前面加个`sudo`

## 2.2、创建实例

```shell
#创建目录
mkdir -p /mydata/elasticsearch/config
mkdir -p /mydata/elasticsearch/data
# 这个表示任何机器都能风访问es，所以写到es的配置文件里面
echo "http.host: 0.0.0.0" >> /mydata/elasticsearch/config/elasticsearch.yml
# 保证权限
chmod -R 777 /mydata/elasticsearch/
# 创建容器实例
docker run --name elasticsearch -p 9200:9200 -p 9300:9300 \
-e "discovery.type=single-node" \
-e ES_JAVA_OPTS="-Xms64m -Xmx512m" \
-v /mydata/elasticsearch/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
-v /mydata/elasticsearch/data:/usr/share/elasticsearch/data \
-v /mydata/elasticsearch/plugins:/usr/share/elasticsearch/plugins \
-d elasticsearch:7.4.2
```



这里记得看一下`elasticsearch`的权限有没有开放，

记录排查es启动失败

第一步、通过`docker logs elasticsearch`命令查看es报错，得到报错信息

```shell
OpenJDK 64-Bit Server VM warning: Option UseConcMarkSweepGC was deprecated in version 9.0 and will likely be removed in a future release.
{"type": "server", "timestamp": "2026-07-11T20:56:18,454Z", "level": "WARN", "component": "o.e.b.ElasticsearchUncaughtExceptionHandler", "cluster.name": "elasticsearch", "node.name": "ac4556ed2eeb", "message": "uncaught exception in thread [main]", 
"stacktrace": ["org.elasticsearch.bootstrap.StartupException: ElasticsearchException[failed to bind service]; nested: AccessDeniedException[/usr/share/elasticsearch/data/nodes];",
"at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:163) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:150) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:125) ~[elasticsearch-cli-7.4.2.jar:7.4.2]",
"at org.elasticsearch.cli.Command.main(Command.java:90) ~[elasticsearch-cli-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:115) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:92) ~[elasticsearch-7.4.2.jar:7.4.2]",
"Caused by: org.elasticsearch.ElasticsearchException: failed to bind service",
"at org.elasticsearch.node.Node.<init>(Node.java:614) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.node.Node.<init>(Node.java:255) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Bootstrap$5.<init>(Bootstrap.java:221) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:221) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:349) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:159) ~[elasticsearch-7.4.2.jar:7.4.2]",
"... 6 more",
"Caused by: java.nio.file.AccessDeniedException: /usr/share/elasticsearch/data/nodes",
"at sun.nio.fs.UnixException.translateToIOException(UnixException.java:90) ~[?:?]",
"at sun.nio.fs.UnixException.rethrowAsIOException(UnixException.java:111) ~[?:?]",
"at sun.nio.fs.UnixException.rethrowAsIOException(UnixException.java:116) ~[?:?]",
"at sun.nio.fs.UnixFileSystemProvider.createDirectory(UnixFileSystemProvider.java:389) ~[?:?]",
"at java.nio.file.Files.createDirectory(Files.java:693) ~[?:?]",
"at java.nio.file.Files.createAndCheckIsDirectory(Files.java:800) ~[?:?]",
"at java.nio.file.Files.createDirectories(Files.java:786) ~[?:?]",
"at org.elasticsearch.env.NodeEnvironment.lambda$new$0(NodeEnvironment.java:272) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.env.NodeEnvironment$NodeLock.<init>(NodeEnvironment.java:209) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.env.NodeEnvironment.<init>(NodeEnvironment.java:269) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.node.Node.<init>(Node.java:275) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.node.Node.<init>(Node.java:255) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Bootstrap$5.<init>(Bootstrap.java:221) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:221) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:349) ~[elasticsearch-7.4.2.jar:7.4.2]",
"at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:159) ~[elasticsearch-7.4.2.jar:7.4.2]",
"... 6 more"] }

```



根据日志分析，这是因为没有权限导致的

第二步、查看`/mydata/elasticsearch/`目录下的权限

```shell
[root@localhost elasticsearch]# ll
总用量 0
drwxr-xr-x. 2 root root 31 7月  12 04:52 config
drwxr-xr-x. 2 root root  6 7月  12 04:50 data
drwxr-xr-x. 2 root root  6 7月  12 04:56 plugins
```

第三步、修改权限

`chmod -R 777 /mydata/elasticsearch/`

```shell
[root@localhost elasticsearch]# ll
总用量 0
drwxrwxrwx. 2 root root 31 7月  12 04:52 config
drwxrwxrwx. 2 root root  6 7月  12 04:50 data
drwxrwxrwx. 2 root root  6 7月  12 04:56 plugins
```

第四步、重启es

```shell
# 查看实例的容器id
docker ps -a
# 启动停掉的es
docker start [es的容器id]
```

![启动docker实例](.\img\3.png)

这时候最好再执行一次`docker logs elasticsearch`看日志是否执行成功。

第五步，打开浏览器看看是否可以正常访问

>http://192.168.152.20:9200/

返回信息如下就表示可以正常访问

```json
{
  "name": "ac4556ed2eeb",
  "cluster_name": "elasticsearch",
  "cluster_uuid": "sJq9x2ZoTwqx1lkFVcAGnw",
  "version": {
    "number": "7.4.2",
    "build_flavor": "default",
    "build_type": "docker",
    "build_hash": "2f90bbf7b93631e52bafb59b3b049cb44ec25e96",
    "build_date": "2019-10-28T20:40:44.881551Z",
    "build_snapshot": false,
    "lucene_version": "8.2.0",
    "minimum_wire_compatibility_version": "6.8.0",
    "minimum_index_compatibility_version": "6.0.0-beta1"
  },
  "tagline": "You Know, for Search"
}
```

## 2.3、创建kibana实例

一定要将url改为自己的地址

```shell
docker stop kibana && docker rm kibana
docker run -d --name kibana \
  --network host \
  -e ELASTICSEARCH_HOSTS=http://127.0.0.1:9200 \
  kibana:7.4.2
```

![启动kibana实例](.\img\4.png)

然后浏览器地址访问

>http://192.168.152.20:5601



返回得到页面，安装成功

![安装成功](.\img\5.png)

# 3、设置开机自启

## docker自启动ES和Kibana

每次开启虚拟机后，都要手动去启动es和kibana，可以设置为自动启动

```shell
# 设置自启动命令
sudo docker update kibana --restart=always
sudo docker update elasticsearch --restart=always
```

# 4、安装IK分词器

因为es默认分割英文版的，对于中午不是很友好，所有安装开源的ik分词器

下载ik分词器：https://release.infinilabs.com/analysis-ik/stable/

因为es的版本是7.4.2，所以按照7.4.2版本即可

按照时候，可以不用进入到容器内部，之前映射已经再`/mydata/elasticsearch`目录下映射了`plugins`文件夹，到时候安装ik分词器，就按照在这个目录即可`/mydata/elasticsearch/plugins`

安装命令

```shell
wget https://release.infinilabs.com/analysis-ik/stable/elasticsearch-analysis-ik-7.4.2.zip
```

如果没有wget、unzip命令，就安装一下

```shell
yum install wget
yum install unzip
```



![安装成功](.\img\6.png)



解压安装包

```shell
mkdir -p ik
unzip elasticsearch-analysis-ik-7.4.2.zip
```

进入容器内部查看插件安装情况

```shell
# 进入容器内部
docker exec -it elasticsearch /bin/bash
# 进入到es里面
cd /usr/share/elasticsearch/bin
# 查看插件安装情况
elasticsearch-plugin list

```

最后kibana执行一下测试语句看看分词成功没



```json
# 分词
POST _analyze
{
  "analyzer": "standard",
  "text": "尚硅谷电商项目"
}

POST _analyze
{
  "analyzer": "ik_smart",
  "text": "尚硅谷电商项目"
}


POST _analyze
{
  "analyzer": "ik_smart",
  "text": "我是一个中国人"
}
```



# 5、自定义词库

## 1、安装nginx

```shell
# /mydata 目录下创建nginx文件夹
mkdir -p nginx

# 创建nginx镜像
# 即使没有安装nginx，下面命令也会下载nginx镜像并启动
docker run -p 80:80 --name nginx -d nginx:1.10

# 将容器内的配置文件拷贝到当前目录：
docker container cp nginx:/etc/nginx .

#拷贝完成后，记得删除当前nginx
docker stop nginx
docker rm nginx

#修改nginx为conf，并重新再创建一个nginx文件夹，再把conf目录移动到nginx
mv nginx conf
mkdir -p nginx
mv conf nginx

#这个时候nginx里面就了配置文件夹，这个时候再重新创建一个nginx实例
docker run -p 80:80 --name nginx \
-v /mydata/nginx/html:/usr/share/nginx/html \
-v /mydata/nginx/logs:/var/log/nginx \
-v /mydata/nginx/conf:/etc/nginx \
-d nginx:1.10

# 创建完成后，记得看下 /mydata/nginx 目录下是否有下面三个文件夹
conf  html  logs

#创建html访问页面和es分词器
cd /mydata/nginx/html
vi index.html # 输入<h1>Gulimall</h1>
#然后浏览器刷新看下是否能成功访问到
http://192.168.152.20/

# 继续再html文件夹目录下，创建es文件夹。并且在里面创建fenci.txt文件
mkdir -p es
cd /mydata/nginx/html/es
vi fenci.txt

# 创建完成后，可以通过浏览器界面，访问
# 对于ng而言，html目录下就是通过浏览器的访问路径，所以这个时候，可以直接跟上es/fenci.txt就能看到内容，如下：
http://192.168.152.20/es/fenci.txt

```



以上就是通过安装验证把ng的环境搭建好了，接下来就可以开始安装远程的分词



```shell
# 进入到es，修改其配置的IK分词器
cd /mydata/elasticsearch/plugins/ik/config

vi IKAnalyzer.cfg.xml

# 把【用户可以在这里配置远程扩展字典】的注释放开，并且把远程访问地址放进去

# 这是修改前的配置
<!--用户可以在这里配置远程扩展字典 -->
<!-- <entry key="remote_ext_dict">words_location</entry> -->


# 这是修改后的配置
<!--用户可以在这里配置远程扩展字典 -->
<entry key="remote_ext_dict">http://192.168.152.20/es/fenci.txt</entry>

# 配置完成后，记得要重新启动ES
docker restart elasticsearch
```



测试自定义的分词器

```shell
#自定义分词器的内容：
尚硅谷
坤坤
蔡徐坤


POST _analyze
{
  "analyzer": "ik_max_word",
  "text": "蔡徐坤尚硅谷"
}

# 得到分词效果如下：
{
  "tokens" : [
    {
      "token" : "蔡徐坤",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "CN_WORD",
      "position" : 0
    },
    {
      "token" : "尚硅谷",
      "start_offset" : 3,
      "end_offset" : 6,
      "type" : "CN_WORD",
      "position" : 1
    },
    {
      "token" : "硅谷",
      "start_offset" : 4,
      "end_offset" : 6,
      "type" : "CN_WORD",
      "position" : 2
    }
  ]
}


```





# 最后注意

注意，只要每次`docker rm <容器名>`删除了容器，就要设置自启动

```shell
sudo docker update <容器名> --restart=always
```



