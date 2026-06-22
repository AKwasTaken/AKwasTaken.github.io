---
title: Markdown Frenzy
date: 2026-06-23
---

## Prologue

Markdown is, by far, my favorite markup language (with HTML being its only real competitor). I use it everywhere. After spending an entire semester taking notes in Obsidian, my typing speed skyrocketed, and my notes started looking incredibly sharp. The best part? There is zero friction, you just open the editor and start typing.

Eventually, I wanted to take all those raw notes and publish them in a professional, tidy format. That spark of inspiration led me down a rabbit hole where I discovered **Quartz** and **Marked.js**.

---

## Quartz

Quartz is an absolute gem of a tool for students, created by [JZhao](https://github.com/jackyzha0). My friend and I used it to publish our notes for the upcoming semester, and the workflow felt like magic:

1. Drop your Obsidian vault into the `content` folder.
2. Let GitHub Actions handle the JavaScript compilation during deployment.
3. Your site is live!

While it is incredibly automated, I quickly realized the project comes with a fair amount of bloat. Because it has had so many contributors over the years, the codebase contains redundant, deprecated junk code. The sheer number of dependencies made it feel overly complicated, and my lack of fluency in JavaScript became a hurdle I had to stumble over. I needed something leaner.

---

## Marked.js

Enter **Marked.js** a much simpler alternative. While it is barebones and naturally has fewer features out of the box than Quartz, it targets a different audience and turned out to be exactly what I needed.

It gives me total control:

* **Math rendering** (via extensions).
* **Custom typesetting** using my own stylesheets.
* **Minimalist architecture** with zero bloat.

It took me just three hours to get this blog up and running, something I’m incredibly proud of. The minimalist layout was heavily inspired by [Nicolas Nguyen](https://www.nic-nguyen.com/), whose website I stumbled across in this fantastic [GitHub repository of developer portfolios](https://github.com/emmabostian/developer-portfolios). I'm incredibly grateful for the inspiration!