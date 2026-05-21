# AST + LLM Wiki 法律知识库原型最终构建报告

生成时间：2026-05-20T04:53:53.708690+00:00

## 1. 项目背景

本项目围绕 9 篇新加坡相关法律、政策与数字治理文献，构建一个可运行的法律知识库原型。原型目标不是直接替代法律专业判断，而是验证能否将原始文献转化为可追溯、可维护、可检索的结构化知识资产。

## 2. 构建目标

项目目标包括：读取原始文献、转换纯文本、进行法律/政策文本切块、生成类 AST 结构化节点、构建 LLM Wiki、建立专业词汇库与口语表达映射，并通过轻量检索实验观察方案可行性。

## 3. 数据来源说明

原始文献统一放置在 `legal_ast_llm_wiki/raw/documents/`。流水线只读取原始文件，不修改、重命名或删除原始文献。当前样本数量有限，仅用于原型验证，不代表完整的新加坡法律知识库。

## 4. 九篇文献处理情况

| doc_id | 文件名 | 格式 | 读取状态 | chunk 数 | AST 节点数 |
| --- | --- | --- | --- | --- | --- |
| companies_act_1967_c8232023ef | Companies Act 1967.pdf | .pdf | success | 1130 | 1130 |
| entranslation_of_the_personal_data_protection_act_0_1c77b4099e | entranslation_of_the_personal_data_protection_act_0.pdf | .pdf | success | 117 | 117 |
| m_29_1bf3c639ac | M-29.pdf | .pdf | success | 19 | 19 |
| personal_data_protection_amendment_act_2020_d7cc5937b1 | Personal Data Protection (Amendment) Act 2020.pdf | .pdf | success | 173 | 173 |
| personal_data_protection_act_2012_e857c5e9da | Personal Data Protection Act 2012.pdf | .pdf | success | 213 | 213 |
| t_0052_bb7bba92b8 | T_0052.pdf | .pdf | success | 93 | 93 |
| document_0e841274ea | 中华人民共和国个人信息保护法.docx | .docx | success | 9 | 9 |
| document_ba5049f6a2 | 中华人民共和国网络安全法.docx | .docx | success | 9 | 9 |
| document_318a65d5a2 | 网络预约出租汽车经营服务管理暂行办法.docx | .docx | success | 6 | 6 |

## 5. 系统架构说明

系统采用模块化流水线：`file_loader` 负责读取文件，`text_cleaner` 负责保守清洗，`chunker` 负责法律/政策友好的切块，`ast_parser` 负责本地规则解析，`wiki_builder` 负责 Markdown Wiki，`glossary_builder` 负责词汇与映射，`retriever` 和 `evaluator` 负责检索验证，`report_generator` 负责最终报告。

关键产物统计如下：

| 指标 | 数量 |
| --- | --- |
| 文献数量 | 9 |
| 成功读取文献 | 9 |
| 失败读取文献 | 0 |
| chunk 数量 | 1769 |
| AST 节点数量 | 1769 |
| Wiki 页面数量 | 1848 |
| 专业术语数量 | 5690 |
| 口语映射数量 | 116 |
| 同义词/近义词记录 | 652 |
| 检索测试问题数量 | 8 |

Wiki 页面分布：

| Wiki 区域 | 页面数 |
| --- | --- |
| concepts | 55 |
| glossary | 3 |
| issues | 4 |
| laws | 6 |
| root | 2 |
| sources | 9 |
| structured_nodes | 1769 |

## 6. 为什么采用“类 AST + LLM Wiki”

普通全文检索主要依赖关键词或相似度，难以显式区分法律主体、行为、对象、条件、义务、例外和后果。类 AST 将法律/政策文本拆成可检索字段；LLM Wiki 则把这些字段组织为人类、Obsidian 和后续 Agent/LLM 都能阅读的知识层。二者结合的主要价值是提高检索精确性、可解释性、可追溯性和知识维护能力。

## 7. 类 AST 节点设计

本项目中的 AST 不是代码语法树，而是法律/政策文本的结构化解析树。每个节点保留 `doc_id`、`chunk_id`、`source_file`、`original_text`、`source_evidence` 等来源字段，并尝试抽取法域、文献类型、法律领域、法律主体、法律行为、法律对象、适用条件、义务、权利、禁止事项、法律后果、例外、定义、专业术语、相关术语、用户可能问题、置信度与审核状态。

识别出的法律领域分布：

| 法律领域 | 节点数 |
| --- | --- |
| unknown | 1127 |
| data protection | 617 |
| cybersecurity | 8 |
| digital governance | 7 |
| electronic transactions | 5 |
| consumer protection | 5 |

## 8. LLM Wiki 页面结构

LLM Wiki 不是回答模型，而是知识存储、组织和维护层。它包括来源文献页面、法律/政策主题页面、概念页面、问题页面、术语表页面和结构化节点页面。后续 Agent 或 LLM 可以基于 Wiki 进行问答、检索、核验和更新，但 Wiki 本身不直接提供最终法律结论。

## 9. 专业词汇库构建方法

词汇库从 AST 节点的法律主体、行为、对象、条件、义务、权利、禁止事项、法律后果、定义、专业术语和相关术语中抽取候选词，并保留来源节点、来源文献和证据片段。当前词汇库为候选结果，全部需要人工审核。

| 词汇类别 | 数量 |
| --- | --- |
| condition | 2167 |
| obligation | 1640 |
| legal_consequence | 696 |
| definition | 409 |
| right | 275 |
| prohibition | 254 |
| professional_term | 222 |
| legal_action | 8 |
| legal_subject | 7 |
| legal_domain | 5 |
| issue | 4 |
| legal_object | 3 |

## 10. 口语表达映射方法

口语表达映射用于把普通用户的问题表达映射到专业术语、法律问题或概念。例如，关于“send my data overseas”的问题会尝试映射到跨境传输或 personal data transfer 相关术语。当前映射由规则和 AST 证据生成，仍属于待审核候选结果。

## 11. 检索验证方法

检索验证使用 8 个英文问题，采用本地轻量方法：TF-IDF 相似度、关键词命中、专业术语匹配、AST 字段权重、Wiki 标题与 YAML tags 匹配，以及原文 chunk 相似度。检索只输出候选结果和证据，不冒充正式法律咨询。

## 12. 检索验证结果

平均增强检索得分为 0.5787。8/8 个问题返回了专业术语，8/8 个问题返回了 AST 节点，8/8 个问题返回了 Wiki 页面，8/8 个问题返回了来源文献。

| query_id | 问题 | 映射术语示例 | AST 命中数 | Wiki 命中数 | 得分 |
| --- | --- | --- | --- | --- | --- |
| q01 | What counts as personal data in Singapore? | definition of personal data, personal data protection, unknown, disclosure | 5 | 5 | 0.6545 |
| q02 | Can a company transfer personal data overseas? | cross-border transfer of personal data, personal data protection, data protection, transfer | 5 | 5 | 0.613 |
| q03 | Does an organisation need consent before using personal data? | personal data, data protection, consent, data subject | 5 | 5 | 0.601 |
| q04 | What are the obligations of organisations under Singapore data protection rules? | transfer, transfer data, business, data protection | 5 | 5 | 0.5989 |
| q05 | What happens if a company breaches data protection obligations? | transfer, transfer data, business, data protection | 5 | 5 | 0.5337 |
| q06 | What are the rules for electronic transactions? | enforcement, authority, business, electronic transactions | 5 | 5 | 0.6058 |
| q07 | What cybersecurity obligations are mentioned in the documents? | 网络安全, 关键信息基础设施, 网络运营者, 法律责任 | 5 | 5 | 0.5296 |
| q08 | How is digital governance described in these documents? | liability, Authority, Authority’s website, banking corporation | 5 | 5 | 0.4928 |

## 13. 与普通全文检索的对比

A 方案只检索原始文本 chunk，优点是直接、透明，适合作为基线。B 方案使用专业词汇库、AST 节点和 Wiki 页面，能够返回专业术语、AST 节点、Wiki 页面和来源文献，因此解释性和可追溯性更强。B 方案的不足是会继承规则抽取产生的噪声，尤其当 chunk 来自目录页或长条款时，候选术语可能过长或过宽。

## 14. 当前方案优势

- 保留从原始文献到文本、chunk、AST 节点、Wiki 页面和检索结果的链路。
- 将法律主体、行为、对象、条件、义务、后果等字段显式化，便于后续检索和审核。
- Markdown Wiki 适合 Obsidian、人类维护和 LLM/Agent 调用。
- 在没有外部 LLM API 的情况下，仍可用本地规则和 TF-IDF 完成可运行原型。

## 15. 当前方案不足

- 当前九篇文献只是原型验证样本，不代表完整法律知识库。
- 规则解析无法替代专业法律解释，可能产生过度抽取、漏抽取或字段分类错误。
- 词汇库、口语映射和 AST 节点均为候选结果，需要人工审核。
- 检索验证没有人工标注的 gold set，因此只能说明原型可运行，不能证明法律准确性。

## 16. 后续优化方向

- 建立人工审核工作流，为 AST 节点、Wiki 页面和词汇条目添加 approved/rejected 状态。
- 引入更细的文献类型识别、法律领域过滤和条文层级识别。
- 使用人工标注问题集评估 Top-K 相关性、召回率、准确率和证据质量。
- 在环境变量配置 API Key 的前提下，可选接入 LLM 或 embedding 模型辅助解析和检索。
- 加入增量构建能力，避免每次运行都重建全部 Wiki 页面。

## 17. 结论

本原型证明“类 AST + LLM Wiki”用于法律/政策文献知识组织是可行的。它不能直接给出权威法律结论，但能把原始文献转化为带来源证据的结构化候选知识，并支持专业术语映射、Wiki 组织和可解释检索。当前结果适合作为后续 Agent/LLM 问答、人工审核和检索增强实验的基础。

> 重要提示：本报告和所有生成内容仅为原型验证材料，不构成法律意见。所有候选 AST 节点、Wiki 页面、词汇库和检索结果均应保持 `review_status = pending`，直到经过人工审核。
