# 英検词库（词光扩展）

- `eiken_pre2_wordlist.json`：2,021 个词的完整数据（美式拼写、CEFR-J 等级、中文/英文/日文释义、日文读音、例句）。
- 网站实际加载的是精简版 `public/atlas/eiken-pre2.json`（只含与开放图鉴不同的部分，插画和录音沿用原词库）。

## 英検5・4級（`public/atlas/eiken-45.json`）

- CEFR-J A1 中词光已收录的词，逐词标注 5級 / 4級（人工判断，仅供参考），并为小学生挑选义项（如 bear 取“クマ”）。
- 补充了词光缺失的基础词 81 个（数字、代词、疑问词、go / have / happy / zoo、March / May 等），这些词没有插画，发音由设备语音朗读。
- 日文释义的汉字全部带振假名。
- 同一级别内的顺序：有插画的名词、问候语和数字优先，其次按词频。

## 选词方法（準2級）

CEFR-J Wordlist 中 A1–A2 级的词，与词光 Word Atlas 词库取交集。英検準2級约对应 CEFR A2。英検没有公开官方词表，这是代理标准。

## 内容说明

- 美式拼写：CEFR-J 中的美式写法优先，其余按英美拼写词典转换并人工修正；例句和搭配同步改为美式拼写。
- 日文释义：由 AI 按义项逐条撰写，与中文释义一一对应，未经逐条人工审校。
- 日文读音：自动生成并修正了常见误读，仍可能有个别不准。

## 来源与授权

- The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies.（研究与商业用途免费，需注明出处）
- 词光 Word Atlas — Word Atlas contributors, CC BY 4.0。本目录的派生内容同样以 CC BY 4.0 提供。
