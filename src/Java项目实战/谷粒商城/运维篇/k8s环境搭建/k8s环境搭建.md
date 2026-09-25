# 搭建K8S

# 一、准备工作

1、使用VMware搭建三台虚拟机，通过手工操作

https://blog.csdn.net/Edwin_Hu/article/details/126024938

安装教程

```shell
# 设置虚拟机的名称
v.name = "k8s-node#{i}" i={1,2,3}
# 设置虚拟机的内存大小
v.memory = 4096
# 设置虚拟机的CPU个数
v.cpus = 4
```

2、克隆三台虚拟机，然后修改网络配置

```shell
cd /etc/sysconfig/network-scripts

vi ifcfg-ens33

BOOTPROTO=static  启用静态IP地址
ONBOOT=yes      开启自动启用网络连接
IPADDR=192.168.152.203 设置IP地址
GATEWAY=192.168.152.2 设置网关
DNS1=8.8.8.8 
NETMASK=255.255.255.0 子网掩码

```

3、关闭防火墙

```shell
systemctl stop firewalld
systemctl disable firewalld
```

4、关闭安全策略

```shell
1、关闭安全策略
cat /etc/selinux/config
sed -i 's/enforcing/disabled/' /etc/selinux/config
修改成功后，可以看到改为了disabled
SELINUX=disabled

2、然后要记得禁全局
setenforce 0
```

5、关闭swap，避免k8s集群频繁交换影响性能

```shell
swapoff -a 临时
执行之前可以先看看cat /etc/fstab
sed -ri 's/.*swap.*/#&/' /etc/fstab 永久
free -g 验证，swap 必须为 0；
```

6、添加主机名和ip的对应关系

```shell
# 查看hostname
hostname
# 修改主机名称
hostnamectl set-hostname k8s-node1
hostnamectl set-hostname k8s-node2
hostnamectl set-hostname k8s-node3
# 再配置ip与主机名的映射关系

vi /etc/hosts
192.168.152.201 k8s-node1
192.168.152.202 k8s-node2
192.168.152.203 k8s-node3

# 也可以使用下面命令，直接再文件末尾追加
cat >> /etc/hosts <<EOF
192.168.152.201 k8s-node1
192.168.152.202 k8s-node2
192.168.152.203 k8s-node3
EOF

```

7、将桥接的 IPv4 流量传递到 iptables 的链：

```shell
# 先执行
cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
# 再执行
sysctl --system
```



自此上面的内容基本上配置完毕。然后记得再vm上面设置快照。后面出现问题了，可以回退到初始状态，懒得重新去配置



# 二、安装docker

所有节点安装 Docker、kubeadm、kubelet、kubectl

1、安装docker之前先删除docker

```shell
sudo yum remove docker \
docker-client \
docker-client-latest \
docker-common \
docker-latest \
docker-latest-logrotate \
docker-logrotate \
docker-engine
```

注意：安装docker，Linux权限得是root用户

注意：CentOS7 的镜像已经不在维护，如果去更新yum，会出现下面报错：

【解决】

```
已加载插件：fastestmirror
Loading mirror speeds from cached hostfile
Could not retrieve mirrorlist http://mirrorlist.centos.org/?release=7&arch=x86_64&repo=os&infra=stock error was
14: curl#6 - "Could not resolve host: mirrorlist.centos.org; 未知的错误"
```



这个时候需要更改镜像配置

参考博客：https://www.cnblogs.com/xy-ouyang/p/12951109.html

备份CentOS-Base.repo

```shell
cd /etc/yum.repos.d
cp CentOS-Base.repo  CentOS-Base.repo.bak_20260322
```

替换CentOS-Base.repo

```shell
# 替换CentOS-Base.repo
sudo curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```

安装几个常用命令

```shell
#安装 vim
yum install vim
#安装 wget
yum install wget
#安装 net-tools
yum install net-tools
```





2、安装docker -ce

```shell
# 必须安装的前置依赖
sudo yum install -y yum-utils \
device-mapper-persistent-data \
lvm2
```

3、添加Docker仓库

```shell
# 添加Docker仓库 
# 第一种
# sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo （可能执行失败）

# 第二种 最好使用下面阿里云的镜像
# 删除原有配置（如果有的话）
rm -f /etc/yum.repos.d/docker-ce.repo
# 使用阿里云镜像
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

4、安装docker

```shell
# 安装docker    
sudo yum install docker-ce docker-ce-cli containerd.io
```

5、配置docker镜像加速

```shell
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://vd7hitcz.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

6、docker常用命令

```shell
# 启动 Docker
sudo systemctl start docker
# 重启docker
sudo systemctl restart docker
# 配置开机自启动
sudo systemctl enable docker

# 检查 Docker 服务的运行状态
sudo systemctl status docker

# 启动后，可以看docker的状态、版本等等信息
# 查看docker的版本
docker -v
# 检查虚拟机下载了那些镜像
sudo docker images

```

# 三、安装kubeadm、kubelet和kubectl

1、先配置阿里云的yum源

```shell
cat > /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF



cat > /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF


# 检查yum是否有记录
yum list|grep kube
```

2、指定版本安装kubenetes

```shell
yum install -y kubelet-1.23.17 kubeadm-1.23.17 kubectl-1.23.17
```

3、安装成功后，一定要记得设置开机启动

```shell
systemctl enable kubelet
systemctl start kubelet

systemctl status kubelet
```

4、安装失败重新安装docker

```shell
# 1. 停掉 Docker 服务
systemctl stop docker
systemctl stop docker.socket 2>/dev/null

# 2. 删除所有容器（含运行中的）
docker rm -f $(docker ps -aq) 2>/dev/null

# 3. 删除所有镜像
docker rmi -f $(docker images -aq) 2>/dev/null

# 4. 删除所有卷、网络、构建缓存
docker volume prune -f
docker network prune -f
docker builder prune -a -f

# 5. 重启 Docker
systemctl start docker
```



# 四、部署 k8s-master

把k8s-node1当作主节点

准备master节点所需要的docker 镜像。

这里有提供的k8s的脚本，我放在了k8s-node1机器的 /root/k8s/master_images.sh

```shell
# 清理掉原来的尚硅谷提供的老版本
> master_images.sh
# 重新写入
cat > master_images.sh <<'EOF'
#!/bin/bash

images=(
    kube-apiserver:v1.23.17
    kube-proxy:v1.23.17
    kube-controller-manager:v1.23.17
    kube-scheduler:v1.23.17
    coredns:v1.8.6
    etcd:3.5.1-0
    pause:3.6
)

for imageName in ${images[@]} ; do
    docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName
    docker tag  registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName k8s.gcr.io/$imageName
    docker rmi  registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName
done
EOF

# 然后修改脚本权限
chmod +x master_images.sh
# 执行脚本
./master_images.sh
```

记得修改执行权限，然后执行脚本即可

```shell
# 修改执行权限
chmod 700 master_images.sh
# 执行脚本master_images.sh
./master_images.sh
```

执行完成后，查看docker拉取到的信息

```shell
[root@k8s-node1 ~]# docker images
REPOSITORY                           TAG        IMAGE ID       CREATED       SIZE
k8s.gcr.io/kube-apiserver            v1.23.17   62bc5d8258d6   3 years ago   130MB
k8s.gcr.io/kube-proxy                v1.23.17   f21c8d21558c   3 years ago   111MB
k8s.gcr.io/kube-controller-manager   v1.23.17   1dab4fc7b6e0   3 years ago   120MB
k8s.gcr.io/kube-scheduler            v1.23.17   bc6794cb54ac   3 years ago   51.9MB
k8s.gcr.io/etcd                      3.5.1-0    25f8c7f3da61   4 years ago   293MB
k8s.gcr.io/coredns/coredns           v1.8.6     a4ca41631cc7   4 years ago   46.8MB
k8s.gcr.io/coredns                   v1.8.6     a4ca41631cc7   4 years ago   46.8MB
k8s.gcr.io/pause                     3.6        6270bb605e12   5 years ago   683kB
```



最后，执行初始化命令，k8s-node1当作主节点

```shell
kubeadm init \
  --apiserver-advertise-address=192.168.152.201 \
  --kubernetes-version v1.23.17 \
  --service-cidr=10.96.0.0/16 \
  --pod-network-cidr=10.244.0.0/16 \
  --v=5 2>&1 | tee /tmp/init.log
```

这里下载很慢，要等4分钟，要有耐心。







如果出现报错就要重置，现在要重新删掉重新初始化

```shell
kubeadm reset -f

# 手动补刀（reset 有时清不干净）
rm -rf /etc/kubernetes/manifests/*
rm -rf /etc/cni/net.d
rm -rf /var/lib/etcd
rm -f $HOME/.kube/config

# 重启服务
systemctl restart docker
systemctl restart kubelet

# 确认端口和目录干净了
ss -lntp | grep -E '10250|6443'     # 应该没输出
ls /etc/kubernetes/manifests/       # 应该是空目录
```

然后还要记得改下配置镜像

```shell
cat > /etc/docker/daemon.json <<'EOF'
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "registry-mirrors": ["https://vd7hitcz.mirror.aliyuncs.com"]
}
EOF

systemctl daemon-reload
systemctl restart docker
```

删除重新安装

```shell
# 1. 停止服务
systemctl stop kubelet

# 2. 彻底重置
kubeadm reset -f

# 3. 手工清残留
rm -rf /etc/kubernetes/
rm -rf /var/lib/kubelet/
rm -rf /var/lib/etcd
rm -rf /etc/cni/net.d
rm -f $HOME/.kube/config

# 4. 确认 Docker 健康 + cgroup 正确
systemctl restart docker
docker info | grep -i "cgroup driver"    # systemd

# 5. 重启 kubelet（此时 255 是正常的，因为还没 init）
systemctl restart kubelet
systemctl status kubelet
```





然后重新执行kubeadm init的初始化命令

跑命令太慢了，重新优化

```shell
# 重新拉取版本
# ① 补拉正确版本的 etcd
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.5.6-0
docker tag  registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.5.6-0 registry.k8s.io/etcd:3.5.6-0
docker rmi  registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.5.6-0
# ② 其余组件：把 k8s.gcr.io 标签复制成 registry.k8s.io
for c in kube-apiserver kube-controller-manager kube-scheduler kube-proxy; do
    docker tag k8s.gcr.io/$c:v1.23.17 registry.k8s.io/$c:v1.23.17
done
docker tag k8s.gcr.io/pause:3.6 registry.k8s.io/pause:3.6
# ③ coredns 路径带子目录
docker tag k8s.gcr.io/coredns:v1.8.6 registry.k8s.io/coredns/coredns:v1.8.6


# 验证
for i in $(kubeadm config images list --kubernetes-version v1.23.17); do
  docker image inspect $i >/dev/null 2>&1 && echo "✅ $i" || echo "❌ 缺失 $i"
done

# 重新跑脚本
kubeadm reset -f
rm -rf /etc/kubernetes /var/lib/etcd /var/lib/kubelet /etc/cni/net.d

kubeadm init \
  --apiserver-advertise-address=192.168.152.201 \
  --kubernetes-version v1.23.17 \
  --service-cidr=10.96.0.0/16 \
  --pod-network-cidr=10.244.0.0/16 \
  --v=5 2>&1 | tee /tmp/init3.log

```

执行成功！！



```shell
# 1、打印的成功日志
[addons] Applied essential addon: kube-proxy

Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.152.201:6443 --token 2dv992.2avydr24eglz0y1a \
        --discovery-token-ca-cert-hash sha256:8fc3ed81b037d358051aeb7476fa3b8915b71e18c0d8fe08d10159f6f7a4e672 

# 2、把成功日志中的下面三条命令进行执行
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# 3、再把成功日志的kubeadm join ... 先粘贴出来
kubeadm join 192.168.152.201:6443 --token 2dv992.2avydr24eglz0y1a \
        --discovery-token-ca-cert-hash sha256:8fc3ed81b037d358051aeb7476fa3b8915b71e18c0d8fe08d10159f6f7a4e672
        
# 4、部署网络-安装Pod网络插件(CNI)
kubectl apply -f \
https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml # 但是这个是外网环境的，所以使用尚硅谷的本地脚本
/root/k8s/kube-flannel.yml
然后执行
kubectl apply -f kube-flannel.yml #生成网络应用
kubectl delete -f kube-flannel.yml #删除网络应用

# 检查当前运行中的容器
kubectl get pods
# 查看名称空间
kubectl get ns 

kubectl get pods --all-namespaces #查看是否运行状态

这里花了大量时间处理 节点启动问题。直接问ai吧

# 5、把第三步的内容执行，让其他两个节点加入到主节点
kubeadm join 192.168.152.201:6443 --token 2dv992.2avydr24eglz0y1a \
        --discovery-token-ca-cert-hash sha256:8fc3ed81b037d358051aeb7476fa3b8915b71e18c0d8fe08d10159f6f7a4e672

但是在加入主节点前，记得要把node2 node3的一些前置依赖配置上
见下面的操作



```





部署网络环境

```shell
mkdir -p /opt/cni/bin /etc/cni/net.d /run/flannel

cat > kube-flannel.yml <<'EOF'
---
kind: Namespace
apiVersion: v1
metadata:
  name: kube-flannel
  labels:
    k8s-app: flannel
    pod-security.kubernetes.io/enforce: privileged
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: flannel
  name: flannel
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["nodes/status"]
  verbs: ["patch"]
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: flannel
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
- kind: ServiceAccount
  name: flannel
  namespace: kube-flannel
---
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: flannel
  name: flannel
  namespace: kube-flannel
---
kind: ConfigMap
apiVersion: v1
metadata:
  name: kube-flannel-cfg
  namespace: kube-flannel
  labels:
    tier: node
    k8s-app: flannel
    app: flannel
data:
  cni-conf.json: |
    {
      "name": "cbr0",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "flannel",
          "delegate": {
            "hairpinMode": true,
            "isDefaultGateway": true
          }
        },
        {
          "type": "portmap",
          "capabilities": {
            "portMappings": true
          }
        }
      ]
    }
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds
  namespace: kube-flannel
  labels:
    tier: node
    app: flannel
    k8s-app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
      hostNetwork: true
      priorityClassName: system-node-critical
      tolerations:
      - operator: Exists
        effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
      - name: install-cni-plugin
        image: docker.io/rancher/mirrored-flannelcni-flannel-cni-plugin:v1.1.0
        command:
        - cp
        args:
        - -f
        - /flannel
        - /opt/cni/bin/flannel
        volumeMounts:
        - name: cni-plugin
          mountPath: /opt/cni/bin
      - name: install-cni
        image: docker.io/rancher/mirrored-flannelcni-flannel:v0.20.2
        command:
        - cp
        args:
        - -f
        - /etc/kube-flannel/cni-conf.json
        - /etc/cni/net.d/10-flannel.conflist
        volumeMounts:
        - name: cni
          mountPath: /etc/cni/net.d
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      containers:
      - name: kube-flannel
        image: docker.io/rancher/mirrored-flannelcni-flannel:v0.20.2
        command:
        - /opt/bin/flanneld
        args:
        - --ip-masq
        - --kube-subnet-mgr
        resources:
          requests:
            cpu: "100m"
            memory: "50Mi"
        securityContext:
          privileged: false
          capabilities:
            add: ["NET_ADMIN", "NET_RAW"]
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        volumeMounts:
        - name: run
          mountPath: /run/flannel
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
        - name: xtables-lock
          mountPath: /run/xtables.lock
      volumes:
      - name: run
        hostPath:
          path: /run/flannel
      - name: cni-plugin
        hostPath:
          path: /opt/cni/bin
      - name: cni
        hostPath:
          path: /etc/cni/net.d
      - name: flannel-cfg
        configMap:
          name: kube-flannel-cfg
      - name: xtables-lock
        hostPath:
          path: /run/xtables.lock
          type: FileOrCreate
EOF
```



加入节点前的安装前置依赖

第一步：用实际存在的名字打包

```shell
docker save -o flannel-images.tar \
  rancher/mirrored-flannelcni-flannel:v0.20.2 \
  dockerproxy.net/rancher/mirrored-flannelcni-flannel-cni-plugin:v1.1.0

ls -lh flannel-images.第二步：给 node2 打包真正需要的镜像（这个更关键）    # 应该有 60~70MB
```

第二步：给 node2 打包真正需要的镜像

```shell
docker save -o k8s-node-images.tar \
  registry.k8s.io/kube-proxy:v1.23.17 \
  registry.k8s.io/pause:3.6

ls -lh k8s-node-images.tar
```

第三步：传到 node2 node3并导入

master节点上

```shell
scp flannel-images.tar root@192.168.152.202:/root/
scp k8s-node-images.tar root@192.168.152.202:/root/
scp /opt/cni/bin/flannel root@192.168.152.202:/opt/cni/bin/

scp flannel-images.tar root@192.168.152.203:/root/
scp k8s-node-images.tar root@192.168.152.203:/root/
scp /opt/cni/bin/flannel root@192.168.152.203:/opt/cni/bin/
```

node2 / node3节点上

```shell
mkdir -p /opt/cni/bin
docker load -i /root/flannel-images.tar
docker load -i /root/k8s-node-images.tar

# 验证：这四个都该出现
docker images | grep -E 'mirrored-flannelcni|kube-proxy|pause'
ls -lh /opt/cni/bin/flannel
```

第四步 就是join 见上面的文本框



# 五、部署后要查看节点之间的状态

```shell
watch kubectl get pod -n kube-system -o wide # 监控 pod 进度

kubectl get nodes

```

测试部署了tomcat，通过`kubectl get pods`命令查看到是部署在默认命名空间里面的

```shell
kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8
```



```shell
[root@k8s-node1 k8s]# kubectl get pods
NAME                      READY   STATUS    RESTARTS   AGE
tomcat6-fd99d4dd6-bdphr   1/1     Running   0          109s
[root@k8s-node1 k8s]# kubectl get pods --all-namespaces
NAMESPACE      NAME                                READY   STATUS    RESTARTS        AGE
default        tomcat6-fd99d4dd6-bdphr             1/1     Running   0               2m21s
kube-flannel   kube-flannel-ds-6gjdm               1/1     Running   1 (4h3m ago)    5h
kube-flannel   kube-flannel-ds-qz4j4               1/1     Running   5 (7m8s ago)    4h26m
kube-flannel   kube-flannel-ds-w5rgw               1/1     Running   2 (5m19s ago)   4h26m
kube-system    coredns-bd6b6df9f-b54lq             1/1     Running   1 (4h3m ago)    6h16m
kube-system    coredns-bd6b6df9f-b92q2             1/1     Running   1 (4h3m ago)    6h16m
kube-system    etcd-k8s-node1                      1/1     Running   1 (4h3m ago)    6h16m
kube-system    kube-apiserver-k8s-node1            1/1     Running   1 (4h3m ago)    6h16m
kube-system    kube-controller-manager-k8s-node1   1/1     Running   1 (4h3m ago)    6h16m
kube-system    kube-proxy-mqgbc                    1/1     Running   2 (5m19s ago)   4h26m
kube-system    kube-proxy-rxtq9                    1/1     Running   4 (7m8s ago)    4h26m
kube-system    kube-proxy-t95wx                    1/1     Running   1 (4h3m ago)    6h16m
kube-system    kube-scheduler-k8s-node1            1/1     Running   1 (4h3m ago)    6h16m
[root@k8s-node1 k8s]# kubectl get pods -o wide -w
NAME                      READY   STATUS    RESTARTS   AGE     IP           NODE        NOMINATED NODE   READINESS GATES
tomcat6-fd99d4dd6-bdphr   1/1     Running   0          4m38s   10.244.2.6   k8s-node3   <none>           <none>
[root@k8s-node1 k8s]# kubectl get all
NAME                          READY   STATUS    RESTARTS   AGE
pod/tomcat6-fd99d4dd6-bdphr   1/1     Running   0          5m29s

NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   6h19m

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/tomcat6   1/1     1            1           48m

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/tomcat6-fd99d4dd6   1         1         1       48m


```



# 六、模拟宕机

第一种、测试不小心的情况下，关闭了tomcat，发现k8s又自动把tomcat给拉起来了

```shell
[root@k8s-node3 ~]# docker ps 
CONTAINER ID   IMAGE                       COMMAND                   CREATED              STATUS          PORTS     NAMES
1ff5bccef61d   49ab0583115a                "catalina.sh run"         About a minute ago   Up 59 seconds             k8s_tomcat_tomcat6-fd99d4dd6-bdphr_default_6b620101-de1c-4a34-9a5f-68a3b201f81a_0
71be95226bdc   registry.k8s.io/pause:3.6   "/pause"                  About a minute ago   Up 59 seconds             k8s_POD_tomcat6-fd99d4dd6-bdphr_default_6b620101-de1c-4a34-9a5f-68a3b201f81a_0
66a9fc7375f6   f21c8d21558c                "/usr/local/bin/kube…"   5 minutes ago        Up 5 minutes              k8s_kube-proxy_kube-proxy-rxtq9_kube-system_a174551b-dbc3-4166-abd3-16fe171e69f3_4
f63f807340cc   b5c6c9203f83                "/opt/bin/flanneld -…"   5 minutes ago        Up 5 minutes              k8s_kube-flannel_kube-flannel-ds-qz4j4_kube-flannel_b067cfbb-f499-43bd-a164-c4a18668ff31_5
25357738a7e8   registry.k8s.io/pause:3.6   "/pause"                  5 minutes ago        Up 5 minutes              k8s_POD_kube-proxy-rxtq9_kube-system_a174551b-dbc3-4166-abd3-16fe171e69f3_4
482bf72bef0e   registry.k8s.io/pause:3.6   "/pause"                  5 minutes ago        Up 5 minutes              k8s_POD_kube-flannel-ds-qz4j4_kube-flannel_b067cfbb-f499-43bd-a164-c4a18668ff31_4
[root@k8s-node3 ~]# docker stop 1ff5bccef61d
1ff5bccef61d
[root@k8s-node3 ~]# docker ps 
CONTAINER ID   IMAGE                       COMMAND                   CREATED          STATUS          PORTS     NAMES
3ab3ad89c318   49ab0583115a                "catalina.sh run"         6 seconds ago    Up 5 seconds              k8s_tomcat_tomcat6-fd99d4dd6-bdphr_default_6b620101-de1c-4a34-9a5f-68a3b201f81a_1
71be95226bdc   registry.k8s.io/pause:3.6   "/pause"                  6 minutes ago    Up 6 minutes              k8s_POD_tomcat6-fd99d4dd6-bdphr_default_6b620101-de1c-4a34-9a5f-68a3b201f81a_0
66a9fc7375f6   f21c8d21558c                "/usr/local/bin/kube…"   11 minutes ago   Up 11 minutes             k8s_kube-proxy_kube-proxy-rxtq9_kube-system_a174551b-dbc3-4166-abd3-16fe171e69f3_4
f63f807340cc   b5c6c9203f83                "/opt/bin/flanneld -…"   11 minutes ago   Up 11 minutes             k8s_kube-flannel_kube-flannel-ds-qz4j4_kube-flannel_b067cfbb-f499-43bd-a164-c4a18668ff31_5
25357738a7e8   registry.k8s.io/pause:3.6   "/pause"                  11 minutes ago   Up 11 minutes             k8s_POD_kube-proxy-rxtq9_kube-system_a174551b-dbc3-4166-abd3-16fe171e69f3_4
482bf72bef0e   registry.k8s.io/pause:3.6   "/pause"                  11 minutes ago   Up 11 minutes             k8s_POD_kube-flannel-ds-qz4j4_kube-flannel_b067cfbb-f499-43bd-a164-c4a18668ff31_4
[root@k8s-node3 ~]# 

```

第二种，直接把node3机器给关了

```shell
[root@k8s-node3 ~]# shutdown -h now

连接断开

# 这个时候去master看看
[root@k8s-node1 k8s]# kubectl get nodes
NAME        STATUS     ROLES                  AGE     VERSION
k8s-node1   Ready      control-plane,master   6h33m   v1.23.17
k8s-node2   Ready      <none>                 4h43m   v1.23.17
k8s-node3   NotReady   <none>                 4h43m   v1.23.17
[root@k8s-node1 k8s]# 
[root@k8s-node1 k8s]# kubectl get pods -o wide
NAME                      READY   STATUS    RESTARTS      AGE   IP           NODE        NOMINATED NODE   READINESS GATES
tomcat6-fd99d4dd6-bdphr   1/1     Running   1 (13m ago)   20m   10.244.2.6   k8s-node3   <none>           <none>

#...这里大概要等上五分钟的样子....

# 这时候就会看到node2给拉起了，node3状态是关闭状态
[root@k8s-node1 k8s]# kubectl get pods -o wide
NAME                      READY   STATUS        RESTARTS      AGE    IP           NODE        NOMINATED NODE   READINESS GATES
tomcat6-fd99d4dd6-bdphr   1/1     Terminating   1 (17m ago)   23m    10.244.2.6   k8s-node3   <none>           <none>
tomcat6-fd99d4dd6-xtmt5   1/1     Running       0             112s   10.244.1.2   k8s-node2   <none>           <none>
[root@k8s-node1 k8s]# 

# 去node2 查看是否拉起成功，结果显示已经成功拉起
[root@k8s-node2 ~]# docker images
REPOSITORY                                                       TAG           IMAGE ID       CREATED       SIZE
registry.k8s.io/kube-proxy                                       v1.23.17      f21c8d21558c   3 years ago   111MB
rancher/mirrored-flannelcni-flannel                              v0.20.2       b5c6c9203f83   3 years ago   59.6MB
dockerproxy.net/rancher/mirrored-flannelcni-flannel-cni-plugin   v1.1.0        fcecffc7ad4a   4 years ago   8.09MB
registry.k8s.io/pause                                            3.6           6270bb605e12   5 years ago   683kB
tomcat                                                           6.0.53-jre8   49ab0583115a   9 years ago   290MB
[root@k8s-node2 ~]# 
[root@k8s-node2 ~]# 
[root@k8s-node2 ~]# docker ps
CONTAINER ID   IMAGE                       COMMAND                   CREATED              STATUS              PORTS     NAMES
f0767e821236   tomcat                      "catalina.sh run"         About a minute ago   Up About a minute             k8s_tomcat_tomcat6-fd99d4dd6-xtmt5_default_41f2bacf-f8ac-46a5-baa8-9bf1851097dc_0
dea2bfcdb2fd   registry.k8s.io/pause:3.6   "/pause"                  2 minutes ago        Up 2 minutes                  k8s_POD_tomcat6-fd99d4dd6-xtmt5_default_41f2bacf-f8ac-46a5-baa8-9bf1851097dc_0
ca973e8953ae   b5c6c9203f83                "/opt/bin/flanneld -…"   27 minutes ago       Up 27 minutes                 k8s_kube-flannel_kube-flannel-ds-w5rgw_kube-flannel_5b55fc3f-8e17-48a0-8361-1ca3eef4eb42_2
1dfab89e3c33   f21c8d21558c                "/usr/local/bin/kube…"   27 minutes ago       Up 27 minutes                 k8s_kube-proxy_kube-proxy-mqgbc_kube-system_30396fc2-e87e-480b-8685-902b3050b359_2
d74dc3958cc1   registry.k8s.io/pause:3.6   "/pause"                  27 minutes ago       Up 27 minutes                 k8s_POD_kube-flannel-ds-w5rgw_kube-flannel_5b55fc3f-8e17-48a0-8361-1ca3eef4eb42_2
bf0d93eb164f   registry.k8s.io/pause:3.6   "/pause"                  27 minutes ago       Up 27 minutes                 k8s_POD_kube-proxy-mqgbc_kube-system_30396fc2-e87e-480b-8685-902b3050b359_2
[root@k8s-node2 ~]# 

# 最后把node3节点启动，这个时候就会看到

```

# 七、暴露端口

1、暴露tomcat的端口

```shell
kubectl expose deployment tomcat6 --port=8080 --target-port=8080 --type=NodePort
```

2、可以查看到对外的暴露端口

```shell
[root@k8s-node1 k8s]# kubectl expose deployment tomcat6 --port=8080 --target-port=8080 --type=NodePort
service/tomcat6 exposed
[root@k8s-node1 k8s]# 
[root@k8s-node1 k8s]# kubectl get svc
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP          7h24m
tomcat6      NodePort    10.96.76.114   <none>        8080:30945/TCP   3s
[root@k8s-node1 k8s]# kubectl get nodes -o wide
NAME        STATUS   ROLES                  AGE     VERSION    INTERNAL-IP       EXTERNAL-IP   OS-IMAGE                KERNEL-VERSION           CONTAINER-RUNTIME
k8s-node1   Ready    control-plane,master   7h24m   v1.23.17   192.168.152.201   <none>        CentOS Linux 7 (Core)   3.10.0-1160.el7.x86_64   docker://26.1.4
k8s-node2   Ready    <none>                 5h34m   v1.23.17   192.168.152.202   <none>        CentOS Linux 7 (Core)   3.10.0-1160.el7.x86_64   docker://26.1.4
k8s-node3   Ready    <none>                 5h34m   v1.23.17   192.168.152.203   <none>        CentOS Linux 7 (Core)   3.10.0-1160.el7.x86_64   docker://26.1.4
[root@k8s-node1 k8s]# 

```

3、打开浏览器输入地址，都能成功访问到tomcat

http://192.168.152.201:30945/

http://192.168.152.202:30945/

http://192.168.152.203:30945/

```shell
# 如果创建失败可以通过下面方式删除
[root@k8s-node1 k8s]# kubectl delete svc tomcat6
service "tomcat6" deleted

[root@k8s-node1 k8s]# kubectl get all
NAME                          READY   STATUS    RESTARTS   AGE
pod/tomcat6-fd99d4dd6-xtmt5   1/1     Running   0          53m

NAME                 TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
service/kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP          7h29m
service/tomcat6      NodePort    10.96.76.114   <none>        8080:30945/TCP   5m22s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/tomcat6   1/1     1            1           118m

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/tomcat6-fd99d4dd6   1         1         1       118m

```



# 八、动态扩容

1、扩容三份

```shell
kubectl scale --replicas=3 deployment tomcat6
```

2、动态扩三份

```shell
[root@k8s-node1 k8s]# kubectl scale --replicas=3 deployment tomcat6
deployment.apps/tomcat6 scaled
[root@k8s-node1 k8s]# kubectl get pods -o wide
NAME                      READY   STATUS    RESTARTS   AGE   IP           NODE        NOMINATED NODE   READINESS GATES
tomcat6-fd99d4dd6-8xqz4   1/1     Running   0          17s   10.244.1.3   k8s-node2   <none>           <none>
tomcat6-fd99d4dd6-g57mc   1/1     Running   0          17s   10.244.2.7   k8s-node3   <none>           <none>
tomcat6-fd99d4dd6-xtmt5   1/1     Running   0          58m   10.244.1.2   k8s-node2   <none>           <none>
[root@k8s-node1 k8s]# 
[root@k8s-node1 k8s]# kubectl get svc -o wide
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE     SELECTOR
kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP          7h35m   <none>
tomcat6      NodePort    10.96.76.114   <none>        8080:30945/TCP   11m     app=tomcat6
[root@k8s-node1 k8s]# 

```

其他节点也能访问到

3、缩容

```shell
[root@k8s-node1 k8s]# kubectl scale --replicas=1 deployment tomcat6
deployment.apps/tomcat6 scaled
[root@k8s-node1 k8s]# kubectl get svc -o wide
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE     SELECTOR
kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP          7h37m   <none>
tomcat6      NodePort    10.96.76.114   <none>        8080:30945/TCP   13m     app=tomcat6
[root@k8s-node1 k8s]# kubectl get pods -o wide
NAME                      READY   STATUS    RESTARTS   AGE     IP           NODE        NOMINATED NODE   READINESS GATES
tomcat6-fd99d4dd6-g57mc   1/1     Running   0          2m51s   10.244.2.7   k8s-node3   <none>           <none>
[root@k8s-node1 k8s]# 

```



为什么我这边无论做了动态扩容还是缩容，节点都能访问呢？



**这正是 Service 设计的目的——它就是为了让你"感知不到后端变化"。** 扩缩容改的是后端 Pod 数量，前端入口（ClusterIP + NodePort）从头到尾没变过。

**核心：Service 是一层"不变的代理"**

```
浏览器
  ↓  任意节点 IP:30945
NodePort（在三个节点上都监听）← 这一层永不变化
  ↓
ClusterIP:8080（10.96.76.114）
  ↓  按 endpoints 列表转发
Pod 实际 IP：10.244.1.2 / 10.244.1.3 / 10.244.2.7  ← 这一层随扩缩容变化
```

**Service 靠 label 选择器（`app=tomcat6`）动态匹配后端 Pod**，扩缩容只是让 endpoints 列表变长变短，前端的 `10.96.76.114:8080` 和 `30945` 端口**从头到尾是同一个**。

所以：

- 扩容到 3 个 → endpoints 有 3 个 IP，请求被分摊到它们
- 缩容到 1 个 → endpoints 只剩 1 个，请求全给它
- 无论哪种，**三个节点 IP + 30945 都能访问**

------

**为什么"随便哪个节点"都能访问？**

这是 **NodePort + kube-proxy** 的配合：

1. `kube-proxy` 在**每一个节点**上都写入了同样的 iptables/IPVS 规则，监听 30945
2. 你访问 node1:30945，但 Pod 其实在 node3 → kube-proxy 做 DNAT，把包转发到 `10.244.2.7`
3. 跨节点的部分由 **flannel 的 vxlan 隧道** 承载

所以**即使某节点上一个 Pod 都没跑**，它的 30945 端口照样能通——这就是"三个 IP 都能访问"的原因。可以验证一下：

```bash
kubectl get endpoints tomcat6
kubectl get ep tomcat6 -o wide
```

扩容时应该列出 3 个 IP，缩容后只剩 1 个。

------

**亲手验证负载均衡（推荐做一次）**

现在三个副本页面一模一样，看不出效果。给每个 Pod 做个标记：

```bash
# 先扩容回 3 个
kubectl scale --replicas=3 deployment tomcat6
kubectl get pods -o wide

# 给每个 Pod 写不同的标识（替换成你实际的 Pod 名）
kubectl exec tomcat6-fd99d4dd6-8xqz4 -- \
  bash -c 'echo "I am Pod-A" > /usr/local/tomcat/webapps/ROOT/index.jsp'
kubectl exec tomcat6-fd99d4dd6-g57mc -- \
  bash -c 'echo "I am Pod-B" > /usr/local/tomcat/webapps/ROOT/index.jsp'
kubectl exec tomcat6-fd99d4dd6-xtmt5 -- \
  bash -c 'echo "I am Pod-C" > /usr/local/tomcat/webapps/ROOT/index.jsp'
```

然后连续访问 10 次：

```bash
for i in {1..10}; do curl -s http://192.168.152.201:30945/ | tr -d '\n'; echo; done
```

你会看到 `I am Pod-A / B / C` **交替出现**——这就是 Service 把请求轮流分发到不同 Pod（轮询策略）。而**无论你访问 201、202 还是 203，结果都是这同一组 Pod 在应答**。

------

**两个边界情况，值得知道**

**① 缩到 0 个会怎样？**

```bash
kubectl scale --replicas=0 deployment tomcat6
curl http://192.168.152.201:30945/
```

会**连接失败**（Service 还在，但 endpoints 空了，没有后端可转发）。这印证了：能访问的前提是**至少有一个 Ready 的 Pod**，跟节点无关。

**② 扩容瞬间可能短暂失败**

新 Pod 从创建到 Running 要几秒（拉镜像、启动 JVM）。在这期间 endpoints 里还没有它，但如果你访问时刚好只有未就绪的 Pod，就会出现 `Connection refused`。生产环境靠 **readinessProbe** 保证只有真正就绪的 Pod 才进 endpoints：

```yaml
readinessProbe:
  httpGet:
    path: /
    port: 8080
  initialDelaySeconds: 20
  periodSeconds: 5
```

------

**一句话总结**

| 现象                 | 原因                                               |
| -------------------- | -------------------------------------------------- |
| 三个节点 IP 都能访问 | NodePort 在**每个节点**都监听，kube-proxy 统一转发 |
| 扩缩容不影响访问     | Service 是稳定抽象层，只有 endpoints 在变          |
| 访问入口不变         | ClusterIP `10.96.76.114` 和端口 `30945` 固定不变   |

**这就是 k8s 里 Service 的核心价值：给一组"会生老病死、会飘来飘去"的 Pod，提供一个永不变动的访问入口。** 后面装 Ingress 也是同样的思路，只是换成用域名访问。

想继续深入的话，可以试试 `kubectl delete pod` 随便删一个——Service 照样通，因为副本会被重建、endpoints 自动更新。



# 九、删除资源



```shell
Kubectl get all
kubectl delete deploy/nginx
kubectl delete service/nginx-service
```



```shell
[root@k8s-node1 k8s]# kubectl get all
NAME                          READY   STATUS    RESTARTS   AGE
pod/tomcat6-fd99d4dd6-g57mc   1/1     Running   0          36m

NAME                 TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
service/kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP          8h
service/tomcat6      NodePort    10.96.76.114   <none>        8080:30945/TCP   46m

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/tomcat6   1/1     1            1           159m

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/tomcat6-fd99d4dd6   1         1         1       159m
[root@k8s-node1 k8s]# kubectl delete deployment.apps/tomcat6
deployment.apps "tomcat6" deleted
[root@k8s-node1 k8s]# kubectl get all
NAME                 TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
service/kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP          8h
service/tomcat6      NodePort    10.96.76.114   <none>        8080:30945/TCP   48m
# 删除后查询pod 默认资源已经没有了
[root@k8s-node1 k8s]# kubectl get pods
No resources found in default namespace.
# 删除service

[root@k8s-node1 k8s]# kubectl delete service/tomcat6
service "tomcat6" deleted
[root@k8s-node1 k8s]# kubectl get all
NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   8h
# 删完后，tomcat也就不能访问了

```



# 十、K8s的其他的一些使用



```shell
# 命令的缩写 比如nodes no; pods po
[root@k8s-node1 k8s]# kubectl get no
NAME        STATUS   ROLES                  AGE     VERSION
k8s-node1   Ready    control-plane,master   8h      v1.23.17
k8s-node2   Ready    <none>                 6h28m   v1.23.17
k8s-node3   Ready    <none>                 6h28m   v1.23.17
[root@k8s-node1 k8s]# kubectl get po
No resources found in default namespace.

```

一、通过yaml创建应用

通过写入yaml来创建应用（重点，后续经常用）

```shell
# 创建应用前可以查看 帮助指令
kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --help
# 查看部署的tomcat的信息
kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml

[root@k8s-node1 ~]# kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml
W0913 10:54:07.918910   41216 helpers.go:622] --dry-run is deprecated and can be replaced with --dry-run=client.
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: tomcat6
  name: tomcat6
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tomcat6
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: tomcat6
    spec:
      containers:
      - image: tomcat:6.0.53-jre8
        name: tomcat
        resources: {}
status: {}
[root@k8s-node1 ~]# 


# 可以把上面的测试的yaml 输入到tomcat6.yaml文件。然后执行yaml文件部署，当然这个tomcat6.yaml文件可以自定义里面的一些参数
[root@k8s-node1 ~]# kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml > tomcat6.yaml
W0913 10:56:28.768246   45018 helpers.go:622] --dry-run is deprecated and can be replaced with --dry-run=client.
# 对里面参数配置修改
[root@k8s-node1 ~]# vi tomcat6.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: tomcat6
  name: tomcat6
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tomcat6
  template:
    metadata:
      labels:
        app: tomcat6
    spec:
      containers:
      - image: tomcat:6.0.53-jre8
        name: tomcat

# 通过下面方式执行tomcat6.yaml文件就可以创建3个应用
[root@k8s-node1 ~]# kubectl apply -f tomcat6.yaml
deployment.apps/tomcat6 created
[root@k8s-node1 ~]# kubectl get pods
NAME                      READY   STATUS    RESTARTS   AGE
tomcat6-fd99d4dd6-frqkh   1/1     Running   0          11s
tomcat6-fd99d4dd6-sz8sx   1/1     Running   0          11s
tomcat6-fd99d4dd6-vnl8n   1/1     Running   0          11s

```

二、通过yaml创建暴露端口

```shell
kubectl expose deployment tomcat6 --port=8080 --target-port=8080 --type=NodePort --dry-run -o yaml

kubectl expose deployment tomcat6 --port=8080 --target-port=8080 --type=NodePort --dry-run -o yaml > tomcat_expose.yaml

kubectl apply -f tomcat_expose.yaml
kubectl get svc

# 经过chrome浏览器访问，成功！！

```



三、获取pod信息

```shell
[root@k8s-node1 ~]# kubectl get pods
NAME                      READY   STATUS    RESTARTS        AGE
tomcat6-fd99d4dd6-frqkh   1/1     Running   1 (2d8h ago)    2d14h
tomcat6-fd99d4dd6-sz8sx   1/1     Running   1 (2d8h ago)    2d14h
tomcat6-fd99d4dd6-vnl8n   1/1     Running   1 (2d11h ago)   2d14h
[root@k8s-node1 ~]# kubectl get pod  tomcat6-fd99d4dd6-frqkh
NAME                      READY   STATUS    RESTARTS       AGE
tomcat6-fd99d4dd6-frqkh   1/1     Running   1 (2d8h ago)   2d14h
[root@k8s-node1 ~]# kubectl get pod  tomcat6-fd99d4dd6-frqkh -o yaml
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: "2026-09-13T09:05:57Z"
  generateName: tomcat6-fd99d4dd6-
  labels:
    app: tomcat6
    pod-template-hash: fd99d4dd6
  name: tomcat6-fd99d4dd6-frqkh
  namespace: default
  ownerReferences:
  - apiVersion: apps/v1
    blockOwnerDeletion: true
    controller: true
    kind: ReplicaSet
    name: tomcat6-fd99d4dd6
    uid: 4072b9fa-77ad-4aa4-b95d-2eaf6da8e969
  resourceVersion: "35414"
  uid: 58567b14-f765-4ac6-8894-d9801d6723ca
spec:
  containers:
  - image: tomcat:6.0.53-jre8
    imagePullPolicy: IfNotPresent
    name: tomcat
    resources: {}
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: kube-api-access-q5kfw
      readOnly: true
  dnsPolicy: ClusterFirst
  enableServiceLinks: true
  nodeName: k8s-node3
  preemptionPolicy: PreemptLowerPriority
  priority: 0
  restartPolicy: Always
  schedulerName: default-scheduler
  securityContext: {}
  serviceAccount: default
  serviceAccountName: default
  terminationGracePeriodSeconds: 30
  tolerations:
  - effect: NoExecute
    key: node.kubernetes.io/not-ready
    operator: Exists
    tolerationSeconds: 300
  - effect: NoExecute
    key: node.kubernetes.io/unreachable
    operator: Exists
    tolerationSeconds: 300
  volumes:
  - name: kube-api-access-q5kfw
    projected:
      defaultMode: 420
      sources:
      - serviceAccountToken:
          expirationSeconds: 3607
          path: token
      - configMap:
          items:
          - key: ca.crt
            path: ca.crt
          name: kube-root-ca.crt
      - downwardAPI:
          items:
          - fieldRef:
              apiVersion: v1
              fieldPath: metadata.namespace
            path: namespace
status:
  conditions:
  - lastProbeTime: null
    lastTransitionTime: "2026-09-13T14:56:02Z"
    status: "True"
    type: Initialized
  - lastProbeTime: null
    lastTransitionTime: "2026-09-15T23:17:48Z"
    status: "True"
    type: Ready
  - lastProbeTime: null
    lastTransitionTime: "2026-09-15T23:17:48Z"
    status: "True"
    type: ContainersReady
  - lastProbeTime: null
    lastTransitionTime: "2026-09-13T09:05:57Z"
    status: "True"
    type: PodScheduled
  containerStatuses:
  - containerID: docker://ebe523d1eff314009ba9b03629b59274fe90333507dd2406e5c93a1939cbab08
    image: tomcat:6.0.53-jre8
    imageID: docker-pullable://tomcat@sha256:8c643303012290f89c6f6852fa133b7c36ea6fbb8eb8b8c9588a432beb24dc5d
    lastState:
      terminated:
        containerID: docker://dc721e2400f36088bb8b17306e8b4ae7d341bec251c17c169fd2643d9aa023e5
        exitCode: 143
        finishedAt: "2026-09-13T15:02:57Z"
        reason: Error
        startedAt: "2026-09-13T14:56:03Z"
    name: tomcat
    ready: true
    restartCount: 1
    started: true
    state:
      running:
        startedAt: "2026-09-15T23:17:48Z"
  hostIP: 192.168.152.203
  phase: Running
  podIP: 10.244.2.12
  podIPs:
  - ip: 10.244.2.12
  qosClass: BestEffort
  startTime: "2026-09-13T14:56:02Z"
[root@k8s-node1 ~]# kubectl get pod  tomcat6-fd99d4dd6-frqkh -o yaml > tomcat_pod.yaml
[root@k8s-node1 ~]# ls
anaconda-ks.cfg  k8s  tomcat6.yaml  tomcat_expose.yaml  tomcat_pod.yaml
[root@k8s-node1 ~]# vi tomcat_pod.yaml 
# 查看修改的最简单的信息
[root@k8s-node1 ~]# more tomcat_pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: tomcat6-new
  name: tomcat6
  namespace: default
spec:
  containers:
  - image: tomcat:6.0.53-jre8
    imagePullPolicy: IfNotPresent
    name: tomcat6-new
  - image: nginx
    imagePullPolicy: IfNotPresent
    name: nginx
# 重新应用部署
[root@k8s-node1 ~]# kubectl apply -f tomcat_pod.yaml
pod/tomcat6 created
# 这个时候发现创建了两个pod容器
[root@k8s-node1 ~]# kubectl get pods
NAME                      READY   STATUS    RESTARTS        AGE
tomcat6                   2/2     Running   0               43s
tomcat6-fd99d4dd6-frqkh   1/1     Running   1 (2d8h ago)    2d14h
tomcat6-fd99d4dd6-sz8sx   1/1     Running   1 (2d8h ago)    2d14h
tomcat6-fd99d4dd6-vnl8n   1/1     Running   1 (2d11h ago)   2d14h

```



```shell
kubectl expose deployment tomcat6 --port=8080 --target-port=8080 --type=NodePort --dry-run -o yaml
```



# 十一、完整部署



```shell
# 删除所有资源
[root@k8s-node1 ~]# kubectl get all
NAME                          READY   STATUS    RESTARTS       AGE
pod/tomcat6                   2/2     Running   2 (2d3h ago)   2d3h
pod/tomcat6-fd99d4dd6-frqkh   1/1     Running   2 (2d3h ago)   4d17h
pod/tomcat6-fd99d4dd6-sz8sx   1/1     Running   2 (2d3h ago)   4d17h
pod/tomcat6-fd99d4dd6-vnl8n   1/1     Running   2 (2d3h ago)   4d17h

NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP          5d4h
service/tomcat6      NodePort    10.96.143.161   <none>        8080:31045/TCP   4d17h

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/tomcat6   3/3     3            3           4d17h

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/tomcat6-fd99d4dd6   3         3         3       4d17h
[root@k8s-node1 ~]# kubectl delete deployment.apps/tomcat6
deployment.apps "tomcat6" deleted
[root@k8s-node1 ~]# kubectl get all
NAME          READY   STATUS    RESTARTS       AGE
pod/tomcat6   2/2     Running   2 (2d3h ago)   2d3h

NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP          5d4h
service/tomcat6      NodePort    10.96.143.161   <none>        8080:31045/TCP   4d17h
[root@k8s-node1 ~]# kubectl delete pod/tomcat6
pod "tomcat6" deleted
[root@k8s-node1 ~]# kubectl get all
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP          5d4h
service/tomcat6      NodePort    10.96.143.161   <none>        8080:31045/TCP   4d17h
[root@k8s-node1 ~]# kubectl delete service/tomcat6
service "tomcat6" deleted
[root@k8s-node1 ~]# kubectl get all
NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   5d4h

```



```shell
# 通过yaml方式进行部署
[root@k8s-node1 ~]# kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml > tomcat6-deployment.yaml
W0918 05:28:03.128544   70617 helpers.go:622] --dry-run is deprecated and can be replaced with --dry-run=client.
[root@k8s-node1 ~]# vi tomcat6-deployment.yaml 
[root@k8s-node1 ~]# more tomcat6-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: tomcat6
  name: tomcat6
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tomcat6
  template:
    metadata:
      labels:
        app: tomcat6
    spec:
      containers:
      - image: tomcat:6.0.53-jre8
        name: tomcat
[root@k8s-node1 ~]# kubectl apply -f tomcat6-deployment.yaml 
deployment.apps/tomcat6 created
[root@k8s-node1 ~]# kubectl get all
NAME                          READY   STATUS    RESTARTS   AGE
pod/tomcat6-fd99d4dd6-4k5sw   1/1     Running   0          11s
pod/tomcat6-fd99d4dd6-b88g9   1/1     Running   0          11s
pod/tomcat6-fd99d4dd6-k84mf   1/1     Running   0          11s

NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   5d4h

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/tomcat6   3/3     3            3           11s

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/tomcat6-fd99d4dd6   3         3         3       11s
[root@k8s-node1 ~]# kubectl expose deployment tomcat6 --port=8080 --target-port=8080 --type=NodePort --dry-run -o yaml
# 把yaml的数据复制一部分放到 tomcat6-deployment.yaml


```



整合到 tomcat6-deployment.yaml

```shell
[root@k8s-node1 ~]# kubectl expose deployment tomcat6 --port=8080 --target-port=8080 --type=NodePort --dry-run -o yaml
W0918 05:37:41.404642   86294 helpers.go:622] --dry-run is deprecated and can be replaced with --dry-run=client.
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    app: tomcat6
  name: tomcat6
spec:
  ports:
  - port: 8080
    protocol: TCP
    targetPort: 8080
  selector:
    app: tomcat6
  type: NodePort
status:
  loadBalancer: {}
[root@k8s-node1 ~]# vi tomcat6-deployment.yaml 
[root@k8s-node1 ~]# more tomcat6-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: tomcat6
  name: tomcat6
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tomcat6
  template:
    metadata:
      labels:
        app: tomcat6
    spec:
      containers:
      - image: tomcat:6.0.53-jre8
        name: tomcat
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: tomcat6
  name: tomcat6
spec:
  ports:
  - port: 8080
    protocol: TCP
    targetPort: 8080
  selector:
    app: tomcat6
  type: NodePort
[root@k8s-node1 ~]# kubectl get all
NAME                          READY   STATUS    RESTARTS   AGE
pod/tomcat6-fd99d4dd6-4k5sw   1/1     Running   0          7m33s
pod/tomcat6-fd99d4dd6-b88g9   1/1     Running   0          7m33s
pod/tomcat6-fd99d4dd6-k84mf   1/1     Running   0          7m33s

NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   5d4h

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/tomcat6   3/3     3            3           7m33s

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/tomcat6-fd99d4dd6   3         3         3       7m33s
[root@k8s-node1 ~]# kubectl delete deployment.apps/tomcat6
deployment.apps "tomcat6" deleted
[root@k8s-node1 ~]# kubectl get all
NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   5d4h
# 使用改后的新文件重新部署
[root@k8s-node1 ~]#  kubectl apply -f tomcat6-deployment.yaml 
deployment.apps/tomcat6 created
service/tomcat6 created
[root@k8s-node1 ~]# kubectl get all
NAME                          READY   STATUS    RESTARTS   AGE
pod/tomcat6-fd99d4dd6-dw7hm   1/1     Running   0          4m52s
pod/tomcat6-fd99d4dd6-fj4q2   1/1     Running   0          4m52s
pod/tomcat6-fd99d4dd6-sgjlk   1/1     Running   0          4m52s

NAME                 TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)          AGE
service/kubernetes   ClusterIP   10.96.0.1     <none>        443/TCP          5d4h
service/tomcat6      NodePort    10.96.31.47   <none>        8080:31302/TCP   4m52s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/tomcat6   3/3     3            3           4m52s

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/tomcat6-fd99d4dd6   3         3         3       4m52s
[root@k8s-node1 ~]# 
```



> service/tomcat6      NodePort    10.96.31.47   <none>        8080:31302/TCP   4m52s



# 十二、使用ingress-nginx



```shell
cat > ingress-nginx.yaml <<'EOF'
---
apiVersion: v1
kind: Namespace
metadata:
  name: ingress-nginx
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ingress-nginx
rules:
- apiGroups: [""]
  resources: ["configmaps", "endpoints", "nodes", "pods", "secrets", "services"]
  verbs: ["list", "watch", "get"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses", "ingressclasses"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses/status"]
  verbs: ["update"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ingress-nginx
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ingress-nginx
subjects:
- kind: ServiceAccount
  name: ingress-nginx
  namespace: ingress-nginx
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
rules:
- apiGroups: [""]
  resources: ["configmaps", "pods", "secrets", "namespaces"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["ingress-controller-leader"]
  verbs: ["get", "update"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["create"]
- apiGroups: [""]
  resources: ["endpoints"]
  verbs: ["get", "create", "update"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ingress-nginx
subjects:
- kind: ServiceAccount
  name: ingress-nginx
  namespace: ingress-nginx
---
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
spec:
  controller: k8s.io/ingress-nginx
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ingress-nginx
    spec:
      hostNetwork: true
      dnsPolicy: ClusterFirst
      serviceAccountName: ingress-nginx
      tolerations:
      - operator: Exists          # 让 master 也跑，任意节点 IP 都能访问
      containers:
      - name: controller
        image: registry.k8s.io/ingress-nginx/controller:v1.1.3
        args:
        - /nginx-ingress-controller
        - --election-id=ingress-controller-leader
        - --ingress-class=nginx
        - --configmap=$(POD_NAMESPACE)/ingress-nginx-controller
        - --report-node-internal-ip-address
        securityContext:
          allowPrivilegeEscalation: true
          capabilities:
            drop: ["ALL"]
            add: ["NET_BIND_SERVICE"]
          runAsUser: 101
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        ports:
        - name: http
          containerPort: 80
        - name: https
          containerPort: 443
        livenessProbe:
          httpGet:
            path: /healthz
            port: 10254
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /healthz
            port: 10254
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  type: ClusterIP
  ports:
  - name: http
    port: 80
    targetPort: 80
    protocol: TCP
  - name: https
    port: 443
    targetPort: 443
    protocol: TCP
  selector:
    app.kubernetes.io/name: ingress-nginx
EOF
```



启动报错

```shell
[root@k8s-node1 k8s]# kubectl apply -f ingress-nginx.yaml 
namespace/ingress-nginx created
serviceaccount/ingress-nginx created
clusterrole.rbac.authorization.k8s.io/ingress-nginx created
clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx created
role.rbac.authorization.k8s.io/ingress-nginx created
rolebinding.rbac.authorization.k8s.io/ingress-nginx created
ingressclass.networking.k8s.io/nginx created
daemonset.apps/ingress-nginx-controller created
service/ingress-nginx-controller created
[root@k8s-node1 k8s]# kubectl get pods
NAME                      READY   STATUS    RESTARTS   AGE
tomcat6-fd99d4dd6-dw7hm   1/1     Running   0          35m
tomcat6-fd99d4dd6-fj4q2   1/1     Running   0          35m
tomcat6-fd99d4dd6-sgjlk   1/1     Running   0          35m
[root@k8s-node1 k8s]# kubectl get pods --all-namespaces
NAMESPACE       NAME                                READY   STATUS             RESTARTS       AGE
default         tomcat6-fd99d4dd6-dw7hm             1/1     Running            0              35m
default         tomcat6-fd99d4dd6-fj4q2             1/1     Running            0              35m
default         tomcat6-fd99d4dd6-sgjlk             1/1     Running            0              35m
ingress-nginx   ingress-nginx-controller-rpw6w      0/1     ErrImagePull       0              2m13s
ingress-nginx   ingress-nginx-controller-rqz8l      0/1     ErrImagePull       0              2m13s
ingress-nginx   ingress-nginx-controller-rxdlk      0/1     ImagePullBackOff   0              2m13s
kube-flannel    kube-flannel-ds-6gjdm               1/1     Running            3 (2d4h ago)   5d4h
kube-flannel    kube-flannel-ds-qz4j4               1/1     Running            9 (2d4h ago)   5d3h
kube-flannel    kube-flannel-ds-w5rgw               1/1     Running            5 (2d4h ago)   5d3h
kube-system     coredns-bd6b6df9f-b54lq             1/1     Running            3 (2d4h ago)   5d5h
kube-system     coredns-bd6b6df9f-b92q2             1/1     Running            3 (2d4h ago)   5d5h
kube-system     etcd-k8s-node1                      1/1     Running            3 (2d4h ago)   5d5h
kube-system     kube-apiserver-k8s-node1            1/1     Running            3 (2d4h ago)   5d5h
kube-system     kube-controller-manager-k8s-node1   1/1     Running            3 (2d4h ago)   5d5h
kube-system     kube-proxy-mqgbc                    1/1     Running            4 (2d4h ago)   5d3h
kube-system     kube-proxy-rxtq9                    1/1     Running            7 (2d4h ago)   5d3h
kube-system     kube-proxy-t95wx                    1/1     Running            3 (2d4h ago)   5d5h
kube-system     kube-scheduler-k8s-node1            1/1     Running            3 (2d4h ago)   5d5h
[root@k8s-node1 k8s]# 

```

排查并解决问题

```shell
[root@k8s-node1 k8s]# kubectl describe pod -n ingress-nginx ingress-nginx-controller-rpw6w | grep -A6 Events
Events:
  Type     Reason     Age                   From               Message
  ----     ------     ----                  ----               -------
  Normal   Scheduled  4m25s                 default-scheduler  Successfully assigned ingress-nginx/ingress-nginx-controller-rpw6w to k8s-node3
  Warning  Failed     4m1s                  kubelet            Failed to pull image "registry.k8s.io/ingress-nginx/controller:v1.1.3": rpc error: code = Unknown desc = Error response from daemon: Head "https://europe-west3-docker.pkg.dev/v2/k8s-artifacts-prod/images/ingress-nginx/controller/manifests/v1.1.3?rid=3bba1ea1d233b349cf412832ac9d753b": dial tcp 173.194.203.82:443: connect: connection refused
  Warning  Failed     3m24s                 kubelet            Failed to pull image "registry.k8s.io/ingress-nginx/controller:v1.1.3": rpc error: code = Unknown desc = Error response from daemon: Head "https://europe-west3-docker.pkg.dev/v2/k8s-artifacts-prod/images/ingress-nginx/controller/manifests/v1.1.3?rid=50ab6208d2fb7ab38d2ccdd95222e1b4": dial tcp 173.194.203.82:443: connect: connection refused
  Warning  Failed     2m35s                 kubelet            Failed to pull image "registry.k8s.io/ingress-nginx/controller:v1.1.3": rpc error: code = Unknown desc = Error response from daemon: Head "https://europe-west3-docker.pkg.dev/v2/k8s-artifacts-prod/images/ingress-nginx/controller/manifests/v1.1.3?rid=76dedfbe030a1e160f5e89e10f2f9b02": dial tcp 173.194.203.82:443: connect: connection refused
[root@k8s-node1 k8s]# docker pull dyrnq/ingress-nginx-controller:v1.1.3
Error response from daemon: Get "https://registry-1.docker.io/v2/": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)

```

发现是镜像没有拉下来

```shell
# 重新拉取镜像
[root@k8s-node1 k8s]# docker pull k8s.m.daocloud.io/ingress-nginx/controller:v1.1.3
v1.1.3: Pulling from ingress-nginx/controller
36ccefbf3d8a: Pull complete 
35268a6348e9: Pull complete 
f2a4e9a3eb55: Pull complete 
14d747106cad: Pull complete 
e70b23d80933: Pull complete 
3ec2f2d2702e: Pull complete 
4f4fb700ef54: Pull complete 
243b7ab51c62: Pull complete 
5c8e9b7a956a: Pull complete 
3ac4ed52c867: Pull complete 
a07890a154d1: Pull complete 
7abe9b6e1aa0: Pull complete 
dea15fded831: Pull complete 
696cd1c4c880: Pull complete 
6f4a6ef1c005: Pull complete 
Digest: sha256:31f47c1e202b39fadecf822a9b76370bd4baed199a005b3e7d4d1455f4fd3fe2
Status: Downloaded newer image for k8s.m.daocloud.io/ingress-nginx/controller:v1.1.3
k8s.m.daocloud.io/ingress-nginx/controller:v1.1.3

```

docker 重新打包 

```shell
[root@k8s-node2 ~]# docker tag  k8s.m.daocloud.io/ingress-nginx/controller:v1.1.3 \
>   registry.k8s.io/ingress-nginx/controller:v1.1.3
[root@k8s-node2 ~]# 
[root@k8s-node2 ~]# docker images | grep ingress-nginx
k8s.m.daocloud.io/ingress-nginx/controller                       v1.1.3        c1695499dda3   4 years ago   285MB
registry.k8s.io/ingress-nginx/controller                         v1.1.3        c1695499dda3   4 years ago   285MB
[root@k8s-node2 ~]# 

```

master节点执行后，node2 node3也要分别执行

最后，删除原来的pod，重新执行，

```shell
[root@k8s-node1 k8s]# kubectl delete pod -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
pod "ingress-nginx-controller-rpw6w" deleted
pod "ingress-nginx-controller-rqz8l" deleted
pod "ingress-nginx-controller-rxdlk" deleted
[root@k8s-node1 k8s]# kubectl get pods -n ingress-nginx -o wide -w
NAME                             READY   STATUS    RESTARTS   AGE    IP                NODE        NOMINATED NODE   READINESS GATES
ingress-nginx-controller-4dzs6   1/1     Running   0          5m1s   192.168.152.203   k8s-node3   <none>           <none>
ingress-nginx-controller-555dv   1/1     Running   0          5m1s   192.168.152.202   k8s-node2   <none>           <none>
ingress-nginx-controller-zqzk4   1/1     Running   0          5m1s   192.168.152.201   k8s-node1   <none>           <none>
# 这下就全部正常执行了
[root@k8s-node1 k8s]# kubectl get pods --all-namespaces
NAMESPACE       NAME                                READY   STATUS    RESTARTS       AGE
default         tomcat6-fd99d4dd6-dw7hm             1/1     Running   0              56m
default         tomcat6-fd99d4dd6-fj4q2             1/1     Running   0              56m
default         tomcat6-fd99d4dd6-sgjlk             1/1     Running   0              56m
ingress-nginx   ingress-nginx-controller-4dzs6      1/1     Running   0              5m56s
ingress-nginx   ingress-nginx-controller-555dv      1/1     Running   0              5m56s
ingress-nginx   ingress-nginx-controller-zqzk4      1/1     Running   0              5m56s
kube-flannel    kube-flannel-ds-6gjdm               1/1     Running   3 (2d5h ago)   5d4h
kube-flannel    kube-flannel-ds-qz4j4               1/1     Running   9 (2d5h ago)   5d3h
kube-flannel    kube-flannel-ds-w5rgw               1/1     Running   5 (2d5h ago)   5d3h
kube-system     coredns-bd6b6df9f-b54lq             1/1     Running   3 (2d5h ago)   5d5h
kube-system     coredns-bd6b6df9f-b92q2             1/1     Running   3 (2d5h ago)   5d5h
kube-system     etcd-k8s-node1                      1/1     Running   3 (2d5h ago)   5d5h
kube-system     kube-apiserver-k8s-node1            1/1     Running   3 (2d5h ago)   5d5h
kube-system     kube-controller-manager-k8s-node1   1/1     Running   3 (2d5h ago)   5d5h
kube-system     kube-proxy-mqgbc                    1/1     Running   4 (2d5h ago)   5d3h
kube-system     kube-proxy-rxtq9                    1/1     Running   7 (2d5h ago)   5d3h
kube-system     kube-proxy-t95wx                    1/1     Running   3 (2d5h ago)   5d5h
kube-system     kube-scheduler-k8s-node1            1/1     Running   3 (2d5h ago)   5d5h

```

# 十三、创建ingress规则

第十二步，成功创建了inress-nginx，现在要对其暴露域名

```shell
[root@k8s-node1 k8s]# more ingress-tomcat6.yaml 
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
spec:
  ingressClassName: nginx
  rules:
  - host: tomcat6.atguigu.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tomcat6
            port:
              number: 8080
[root@k8s-node1 k8s]# 
[root@k8s-node1 k8s]# 
[root@k8s-node1 k8s]# kubectl apply -f ingress-tomcat6.yaml
ingress.networking.k8s.io/web created

```



通过switchhost里面配置域名

```bash
192.168.152.201 tomcat6.atguigu.com
192.168.152.202 tomcat6.atguigu.com
192.168.152.203 tomcat6.atguigu.com
```

然后浏览器通过域名访问可以成功



关机测试 192.168.152.201 节点宕机，发现同于域名访问还是成功了。因为ingress切换到其他节点上了

# 十四、实现控制台

前面的步骤主要是通过命令行操作来实现的，现在通过控制台实现



> kubernetes-dashboard.yaml



```shell

```



尚硅谷这里没有使用了



# 十五、kubesphere前置条件

安装的前置条件

1、安装helm

```shell
# 方式 1：官方地址（能通就用这个）
curl -fsSL -o helm.tgz https://get.helm.sh/helm-v3.12.3-linux-amd64.tar.gz

# 确认下载到的是真压缩包（不是 HTML 错误页）
file helm.tgz          # 应显示 gzip compressed data

# 解压安装
tar -zxvf helm.tgz
mv linux-amd64/helm /usr/local/bin/helm
chmod +x /usr/local/bin/helm

# 验证
helm version

# 验证完毕，安装成功！！
[root@k8s-node1 ~]# helm version
version.BuildInfo{Version:"v3.12.3", GitCommit:"3a31588ad33fe3b89af5a2a54ee1d25bfe6eaa5e", GitTreeState:"clean", GoVersion:"go1.20.7"}

```



helm 实现初始化

注意，只有helm 2.X版本才会需要 创建 helm-rbac.yaml 来实现tiller

如果升级到了3.X 不需要创建yaml文件来实现，

```shell
# 验证helm，如果是下面命令情况，说明helm已经可以使用了
[root@k8s-node1 k8s]# helm list -A
NAME    NAMESPACE       REVISION        UPDATED STATUS  CHART   APP VERSION

# 现在可以正式用 Helm 了，但先做一件事：加仓库
# Helm 3 不再自带 stable 仓库，老教程里 helm install stable/xxx 会直接报 repo not found：
# 确认仓库状态
helm repo list
helm search repo mysql

[root@k8s-node1 k8s]# helm repo list
NAME    URL                                   
bitnami https://helm-charts.itboon.top/bitnami
[root@k8s-node1 k8s]# helm search repo mysql
NAME                    CHART VERSION   APP VERSION     DESCRIPTION                                       
bitnami/mysql           14.0.5          9.4.0           MySQL is a fast, reliable, scalable, and easy t...
bitnami/phpmyadmin      20.0.2          5.2.2           phpMyAdmin is a free software tool written in P...
bitnami/mariadb         23.0.1          12.0.2          MariaDB is an open source, community-developed ...
bitnami/mariadb-galera  16.0.2          12.0.2          MariaDB Galera is a multi-primary database clus...
# 去掉污点
[root@k8s-node1 k8s]# kubectl describe node k8s-node1 | grep Taint
Taints:             node-role.kubernetes.io/master:NoSchedule
[root@k8s-node1 k8s]# kubectl taint nodes k8s-node1 node-role.kubernetes.io/master:NoSchedule-
node/k8s-node1 untainted
# 这个时候污点已经去掉了
[root@k8s-node1 k8s]# kubectl describe node k8s-node1 | grep Taint
Taints:             <none>


```

安装OpenEBS 并配置storageclass

```shell
# 加仓库并查看可用版本
helm repo add openebs-localpv https://openebs.github.io/dynamic-localpv-provisioner
helm repo update
helm search repo openebs-localpv/localpv-provisioner --versions | head -20

# 安装（只装 Hostpath）
helm install openebs-localpv openebs-localpv/localpv-provisioner \
  -n openebs --create-namespace \
  --set hostpathClass.basePath=/var/openebs/local \
  --set hostpathClass.isDefaultClass=true \
  --set analytics.enabled=false
# 验证
kubectl get pods -n openebs
kubectl get sc


[root@k8s-node1 ~]# kubectl get sc
NAME                         PROVISIONER        RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
openebs-hostpath (default)   openebs.io/local   Delete          WaitForFirstConsumer   false                  14m
[root@k8s-node1 ~]#  
[root@k8s-node1 ~]# kubectl get pods -n openebs
NAME                                                   READY   STATUS    RESTARTS   AGE
openebs-localpv-localpv-provisioner-687f5bb697-8vng6   1/1     Running   0          18m

# 再次打上污点，以免别的资源抢占
[root@k8s-node1 ~]# kubectl taint nodes k8s-node1 node-role.kubernetes.io/master:NoSchedule
node/k8s-node1 tainted
[root@k8s-node1 ~]# kubectl describe node k8s-node1 | grep Taint
Taints:             node-role.kubernetes.io/master:NoSchedule
[root@k8s-node1 ~]# 


```



# 十六、安装kubesphere



```shell
[root@k8s-node1 k8s]# cat cluster-configuration.yaml 
---
apiVersion: installer.kubesphere.io/v1alpha1
kind: ClusterConfiguration
metadata:
  name: ks-installer
  namespace: kubesphere-system
spec:
  persistence:
    storageClass: ""
  authentication:
    jwtSecret: ""
  local_registry: registry.cn-beijing.aliyuncs.com
  namespace_override: kubesphereio
  etcd:
    monitoring: false
    endpointIps: 192.168.152.201
    port: 2379
    tlsEnable: true
  common:
    core:
      console:
        enableMultiLogin: true
        port: 30880
        type: NodePort
    redis:
      enabled: false
      volumeSize: 2Gi
    openldap:
      enabled: false
      volumeSize: 2Gi
    minio:
      volumeSize: 20Gi
    monitoring:
      endpoint: http://prometheus-operated.kubesphere-monitoring-system.svc:9090
    es:
      elasticsearchMasterReplicas: 1
      elasticsearchDataReplicas: 1
      logMaxAge: 7
      elkPrefix: logstash
      basicAuth:
        enabled: false
  alerting:
    enabled: false
  auditing:
    enabled: false
  devops:
    enabled: false
  events:
    enabled: false
  logging:
    enabled: false
  metrics_server:
    enabled: false
  monitoring:
    storageClass: ""
  multicluster:
    clusterRole: none
  network:
    networkpolicy:
      enabled: false
    ippool:
      type: none
    topology:
      type: none
  openpitrix:
    store:
      enabled: false
  servicemesh:
    enabled: false
  kubeedge:
    enabled: false

```



```shell
[root@k8s-node1 k8s]# more kubesphere-installer.yaml 
---
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: clusterconfigurations.installer.kubesphere.io
spec:
  group: installer.kubesphere.io
  scope: Namespaced
  names:
    plural: clusterconfigurations
    singular: clusterconfiguration
    kind: ClusterConfiguration
    shortNames:
    - cc
  versions:
  - name: v1alpha1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        x-kubernetes-preserve-unknown-fields: true

---
apiVersion: v1
kind: Namespace
metadata:
  name: kubesphere-system

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ks-installer
  namespace: kubesphere-system

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ks-installer
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ks-installer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ks-installer
subjects:
- kind: ServiceAccount
  name: ks-installer
  namespace: kubesphere-system

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ks-installer
  namespace: kubesphere-system
  labels:
    app: ks-install
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ks-install
  template:
    metadata:
      labels:
        app: ks-install
    spec:
      serviceAccountName: ks-installer
      containers:
      - name: installer
        image: registry.cn-beijing.aliyuncs.com/kubesphereio/ks-installer:v3.4.1
        imagePullPolicy: IfNotPresent
        volumeMounts:
        - mountPath: /etc/localtime
          name: host-time
          readOnly: true
      volumes:
      - name: host-time
        hostPath:
          path: /etc/localtime
          type: ""
```





```shell
# 实现最小化安装
# 1、先去除污点
kubectl taint nodes k8s-node1 node-role.kubernetes.io/master:NoSchedule-
kubectl taint nodes k8s-node1 node-role.kubernetes.io/control-plane:NoSchedule-
kubectl describe node k8s-node1 | grep -i taint    # 应显示 <none>

cd /root/k8s
# 2、下载文件。直连慢/失败就走代理（推荐）

ls -lh kubesphere-installer.yaml cluster-configuration.yaml

# 3、改镜像
# 3.1、ks-installer 自己的镜像
sed -i 's#image: kubesphere/ks-installer:#image: registry.cn-beijing.aliyuncs.com/kubesphereio/ks-installer:#' kubesphere-installer.yaml
grep -n 'image:' kubesphere-installer.yaml

# 3.2、在 cluster-configuration.yaml 里加私有仓库
# 在 spec: 下面插入两行（用 vi 改最稳妥）
vi cluster-configuration.yaml

```



开始执行

```shell
[root@k8s-node1 k8s]# kubectl apply -f kubesphere-installer.yaml
customresourcedefinition.apiextensions.k8s.io/clusterconfigurations.installer.kubesphere.io created
namespace/kubesphere-system created
serviceaccount/ks-installer created
clusterrole.rbac.authorization.k8s.io/ks-installer created
clusterrolebinding.rbac.authorization.k8s.io/ks-installer created
deployment.apps/ks-installer created
[root@k8s-node1 k8s]# kubectl apply -f cluster-configuration.yaml
clusterconfiguration.installer.kubesphere.io/ks-installer created

```



```shell
# 查看拉取进度
kubectl describe pod -n kubesphere-system ks-installer-788c488b58-w87qn | grep -A8 Events
# 盯状态，起来后立刻看日志
kubectl get pods -n kubesphere-system -w
# 查日志 当变成 Running（可能短暂显示 0/1）后再执行
kubectl logs -n kubesphere-system \
  $(kubectl get pod -n kubesphere-system -l 'app in (ks-install, ks-installer)' -o jsonpath='{.items[0].metadata.name}') -f
```

可以看到执行成功了，这里执行大概要花20分钟左右

```shell
[root@k8s-node1 k8s]# kubectl get pods -n kubesphere-system -w
NAME                                    READY   STATUS    RESTARTS   AGE
ks-apiserver-68648cb47c-lqmm9           1/1     Running   0          13m
ks-console-777b56767b-pxh5v             1/1     Running   0          13m
ks-controller-manager-86f56844c-89zbd   1/1     Running   0          13m
ks-installer-788c488b58-w87qn           1/1     Running   0          17m

```

最后检验kubesphere是否真的成功

```shell
[root@k8s-node1 k8s]# kubectl logs -n kubesphere-system ks-installer-788c488b58-w87qn --tail=30
Start installing multicluster
Start installing openpitrix
Start installing network
**************************************************
Waiting for all tasks to be completed ...
task network status is successful  (1/4)
task openpitrix status is successful  (2/4)
task multicluster status is successful  (3/4)
task monitoring status is successful  (4/4)
**************************************************
Collecting installation results ...
#####################################################
###              Welcome to KubeSphere!           ###
#####################################################

Console: http://192.168.152.201:30880
Account: admin
Password: P@88w0rd
NOTES：
  1. After you log into the console, please check the
     monitoring status of service components in
     "Cluster Management". If any service is not
     ready, please wait patiently until all components 
     are up and running.
  2. Please change the default password after login.

#####################################################
https://kubesphere.io             2026-09-19 08:13:14
#####################################################

[root@k8s-node1 k8s]# 


这里面的账号密码
Console: http://192.168.152.201:30880
Account: admin
Password: P@88w0rd
```



修改密码后

Console: http://192.168.152.201:30880
Account: admin
Password: Dailin88@#