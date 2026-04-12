# git使用命令



查看git配置

```shell
git config --global --list
```

修改git的ssl验证为false

```shell
git config --global http.sslVerify "false"
git config --global https.sslVerify "false"
```

修改git push时候的大文件上传

```shell
git config --global http.postBuffer 524288000
```



我本地git配置

```shell
user.name=XXXXXX
user.email=XXXXXX
http.sslverify=false
http.postbuffer=524288000
https.sslverify=false
```

