# Chunking Quality Report

Generated at: 2026-05-19T15:42:45.963653+00:00
Total documents in metadata: 9
Total chunks: 1769

## Per-Document Summary

| doc_id | source_file | chunks | avg_length | min_length | max_length |
| --- | --- | ---: | ---: | ---: | ---: |
| companies_act_1967_c8232023ef | Companies Act 1967.pdf | 1130 | 1021.2 | 109 | 1300 |
| entranslation_of_the_personal_data_protection_act_0_1c77b4099e | entranslation_of_the_personal_data_protection_act_0.pdf | 117 | 972.0 | 108 | 1297 |
| m_29_1bf3c639ac | M-29.pdf | 19 | 870.1 | 163 | 1275 |
| personal_data_protection_amendment_act_2020_d7cc5937b1 | Personal Data Protection (Amendment) Act 2020.pdf | 173 | 941.6 | 184 | 1296 |
| personal_data_protection_act_2012_e857c5e9da | Personal Data Protection Act 2012.pdf | 213 | 992.4 | 133 | 1299 |
| t_0052_bb7bba92b8 | T_0052.pdf | 93 | 960.9 | 147 | 1280 |
| document_0e841274ea | 中华人民共和国个人信息保护法.docx | 9 | 1149.3 | 377 | 1298 |
| document_ba5049f6a2 | 中华人民共和国网络安全法.docx | 9 | 1235.2 | 1148 | 1296 |
| document_318a65d5a2 | 网络预约出租汽车经营服务管理暂行办法.docx | 6 | 1240.2 | 1121 | 1292 |

## Possible Issues

- 147 chunks are shorter than 400 characters; review whether they are headings or fragments.

## AST Parsing Recommendations

- Use `heading_guess` and `possible_legal_section` as weak signals, not final legal labels.
- Preserve `doc_id`, `chunk_id`, `start_char`, and `end_char` in every AST node for traceability.
- Prefer extracting obligations, rights, prohibitions, definitions, exceptions, and consequences only when explicit evidence appears in `chunk_text`.
- Keep all generated AST nodes at `review_status = pending` until human review.
