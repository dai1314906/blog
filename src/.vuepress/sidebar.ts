import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    {
      text: "如何使用",
      icon: "laptop-code",
      prefix: "demo/",
      link: "demo/",
      children: "structure",
    },
    {
      text: "文章",
      icon: "book",
      prefix: "posts/",
      children: "structure",
    },
    {
      text: "标签",
      icon: "book",
      prefix: "tags/",
      children: "structure",
    },
    {
      text: "算法01",
      icon: "book",
      prefix: "posts/",
      collapsible: true,
      children: [
        {
          text: "算法",
          prefix: "算法/",
          collapsible: true,
          children: [
            {
              text: "左程云算法学习",
              prefix: "左程云算法学习/",
              collapsible: true,
              children: [
                {
                  text: "01经典排序",
                  prefix: "01经典排序/",
                  collapsible: true,
                  children: "structure",
                },
                {
                  text: "02链表",
                  prefix: "02链表/",
                  collapsible: true,
                  children: [
                    {
                      text: "判断单链表是否为回文结构",
                      link: "判断单链表是否为回文结构",
                    }
                  ],
                },
                {
                  text: "03二叉树",
                  prefix: "03二叉树/",
                  collapsible: true,
                  children: "structure",
                },
              ],
            }
          ],
        }
      ],
    },
    {
      text: "Java高频八股文",
      icon: "book",
      prefix: "Java高频八股文/",
      collapsible: true,
      children: [
        {
          text: "MySQL篇",
          icon: "book",
          prefix: "MySQL篇/",
          collapsible: true,
          children: [
              {
                text: "索引问题",
                prefix: "索引问题/",
                collapsible: true,
                children: "structure",
              },
              {
                text: "锁问题",
                prefix: "锁问题/",
                collapsible: true,
                children: [
                  {
                    text: "乐观锁与悲观锁",
                    link: "乐观锁与悲观锁",
                  },
                  {
                    text: "排它锁与互斥锁",
                    link: "排它锁与互斥锁",
                  }
                ],
              },
          ],
        }
      ],
    },
    {
      text: "算法",
      icon: "book",
      prefix: "算法/",
      collapsible: true,
      children: [
        {
          text: "左程云算法学习",
          icon: "book",
          prefix: "左程云算法学习/",
          collapsible: true,
          children: [
            {
              text: "01经典排序",
              prefix: "01经典排序/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "02链表",
              prefix: "02链表/",
              collapsible: true,
              children: [
                {
                  text: "判断单链表是否为回文结构",
                  link: "判断单链表是否为回文结构",
                }
              ],
            },
            {
              text: "03二叉树",
              prefix: "03二叉树/",
              collapsible: true,
              children: "structure",
            },
          ],
        },
        {
          text: "面试高频算法",
          icon: "book",
          prefix: "面试高频算法/",
          collapsible: true,
          children: [
            {
              text: "leetcode100",
              prefix: "leetcode100/",
              collapsible: true,
              children: "structure",
            },
            {
              text: "牛客100",
              prefix: "牛客100/",
              collapsible: true,
              children: [
                {
                  text: "01链表",
                  prefix: "01链表/",
                  collapsible: true,
                  children: [
                      {
                        text: "链表",
                        link: "链表",
                      }
                  ]
                }
              ],
            }
          ],
        }
      ],
    },
    "intro",
    {
      text: "幻灯片",
      icon: "person-chalkboard",
      link: "https://ecosystem.vuejs.press/zh/plugins/markdown/revealjs/demo.html",
    },
  ],
});
