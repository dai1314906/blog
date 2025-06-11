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
      text: "分组1",
      icon: "java",
      prefix: "posts/",
      collapsible: true,
      children: [
        {
          text: "分组1-1",
          prefix: "apple/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "分组1-2",
          prefix: "banana/",
          collapsible: true,
          children: "structure",
        }
      ],
    },

    {
      text: "设计模式",
      icon: "java",
      prefix: "posts/",
      collapsible: true,
      children: [
        {
          text: "分组1-1",
          prefix: "apple/",
          collapsible: true,
          children: "structure",
        },
        {
          text: "分组1-2",
          prefix: "banana/",
          collapsible: true,
          children: "structure",
        }
      ],
    },
    {
      text: "算法",
      icon: "book",
      prefix: "posts/",
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
                children: "structure",
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
    },
    "intro",
    {
      text: "幻灯片",
      icon: "person-chalkboard",
      link: "https://ecosystem.vuejs.press/zh/plugins/markdown/revealjs/demo.html",
    },
  ],
});
