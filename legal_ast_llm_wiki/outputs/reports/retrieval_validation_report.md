# Retrieval Validation Report

Generated at: 2026-05-20T00:04:33.844443+00:00

## Scope

This report validates candidate retrieval only. It does not generate legal advice and does not assert final legal conclusions.

## Test Queries

- q01: What counts as personal data in Singapore?
- q02: Can a company transfer personal data overseas?
- q03: Does an organisation need consent before using personal data?
- q04: What are the obligations of organisations under Singapore data protection rules?
- q05: What happens if a company breaches data protection obligations?
- q06: What are the rules for electronic transactions?
- q07: What cybersecurity obligations are mentioned in the documents?
- q08: How is digital governance described in these documents?

## Summary Metrics

- Test queries: 8
- Average enhanced relevance score: 0.5787
- Queries returning professional terms: 8/8
- Queries returning AST nodes: 8/8
- Queries returning Wiki pages: 8/8
- Queries returning source documents: 8/8

## Per-Query Results

| query_id | mapped_terms | top_ast_nodes | top_wiki_pages | source_docs | relevance_score |
| --- | --- | --- | --- | --- | ---: |
| q01 | definition of personal data, personal data protection, unknown, disclosure, individual | entranslation_of_the_personal_data_protection_act_0_1c77b4099e_chunk_0063_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0002_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0020_ast, entranslation_of_the_personal_data_protection_act_0_1c77b4099e_chunk_0037_ast, entranslation_of_the_personal_data_protection_act_0_1c77b4099e_chunk_0044_ast | sources/personal_data_protection_amendment_act_2020_d7cc5937b1, sources/personal_data_protection_act_2012_e857c5e9da, issues/personal_data_protection, concepts/loss, concepts/gain | personal_data_protection_amendment_act_2020_d7cc5937b1, personal_data_protection_act_2012_e857c5e9da, companies_act_1967_c8232023ef, entranslation_of_the_personal_data_protection_act_0_1c77b4099e, document_0e841274ea | 0.6545 |
| q02 | cross-border transfer of personal data, personal data protection, data protection, transfer, transfer data | personal_data_protection_act_2012_e857c5e9da_chunk_0053_ast, personal_data_protection_amendment_act_2020_d7cc5937b1_chunk_0126_ast, entranslation_of_the_personal_data_protection_act_0_1c77b4099e_chunk_0044_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0172_ast, m_29_1bf3c639ac_chunk_0016_ast | sources/personal_data_protection_act_2012_e857c5e9da, sources/personal_data_protection_amendment_act_2020_d7cc5937b1, issues/personal_data_protection, structured_nodes/entranslation_of_the_personal_data_protection_act_0_1c77b4099e_chunk_0044_ast, structured_nodes/entranslation_of_the_personal_data_protection_act_0_1c77b4099e_chunk_0063_ast | entranslation_of_the_personal_data_protection_act_0_1c77b4099e, m_29_1bf3c639ac, personal_data_protection_amendment_act_2020_d7cc5937b1, personal_data_protection_act_2012_e857c5e9da, companies_act_1967_c8232023ef | 0.613 |
| q03 | personal data, data protection, consent, data subject, data controller | personal_data_protection_amendment_act_2020_d7cc5937b1_chunk_0013_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0037_ast, personal_data_protection_amendment_act_2020_d7cc5937b1_chunk_0015_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0040_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0039_ast | sources/personal_data_protection_amendment_act_2020_d7cc5937b1, sources/personal_data_protection_act_2012_e857c5e9da, issues/personal_data_protection, concepts/news_organisation, structured_nodes/entranslation_of_the_personal_data_protection_act_0_1c77b4099e_chunk_0063_ast | companies_act_1967_c8232023ef, entranslation_of_the_personal_data_protection_act_0_1c77b4099e, personal_data_protection_amendment_act_2020_d7cc5937b1, personal_data_protection_act_2012_e857c5e9da, document_0e841274ea | 0.601 |
| q04 | transfer, transfer data, business, data protection, individual | personal_data_protection_act_2012_e857c5e9da_chunk_0001_ast, personal_data_protection_amendment_act_2020_d7cc5937b1_chunk_0032_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0154_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0020_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0002_ast | sources/personal_data_protection_amendment_act_2020_d7cc5937b1, sources/personal_data_protection_act_2012_e857c5e9da, issues/personal_data_protection, concepts/loss, concepts/gain | personal_data_protection_amendment_act_2020_d7cc5937b1, personal_data_protection_act_2012_e857c5e9da, entranslation_of_the_personal_data_protection_act_0_1c77b4099e | 0.5989 |
| q05 | transfer, transfer data, business, data protection, individual | personal_data_protection_act_2012_e857c5e9da_chunk_0151_ast, personal_data_protection_amendment_act_2020_d7cc5937b1_chunk_0106_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0022_ast, personal_data_protection_act_2012_e857c5e9da_chunk_0003_ast, personal_data_protection_amendment_act_2020_d7cc5937b1_chunk_0126_ast | sources/personal_data_protection_act_2012_e857c5e9da, sources/personal_data_protection_amendment_act_2020_d7cc5937b1, concepts/calling_line_identity, issues/personal_data_protection, laws/consumer_protection | companies_act_1967_c8232023ef, entranslation_of_the_personal_data_protection_act_0_1c77b4099e, personal_data_protection_amendment_act_2020_d7cc5937b1, personal_data_protection_act_2012_e857c5e9da, m_29_1bf3c639ac | 0.5337 |
| q06 | enforcement, authority, business, electronic transactions, electronic transaction system | companies_act_1967_c8232023ef_chunk_1022_ast, companies_act_1967_c8232023ef_chunk_0053_ast, companies_act_1967_c8232023ef_chunk_0111_ast, companies_act_1967_c8232023ef_chunk_0105_ast, companies_act_1967_c8232023ef_chunk_0002_ast | laws/electronic_transactions, concepts/electronic_transaction, structured_nodes/companies_act_1967_c8232023ef_chunk_1022_ast, structured_nodes/companies_act_1967_c8232023ef_chunk_0053_ast, structured_nodes/companies_act_1967_c8232023ef_chunk_0111_ast | companies_act_1967_c8232023ef | 0.6058 |
| q07 | 网络安全, 关键信息基础设施, 网络运营者, 法律责任, network data | document_ba5049f6a2_chunk_0006_ast, document_ba5049f6a2_chunk_0008_ast, document_ba5049f6a2_chunk_0009_ast, document_ba5049f6a2_chunk_0002_ast, document_ba5049f6a2_chunk_0005_ast | issues/cybersecurity_obligation, concepts/cybersecurity, laws/cybersecurity, concepts/term_53c3c313, sources/personal_data_protection_act_2012_e857c5e9da | entranslation_of_the_personal_data_protection_act_0_1c77b4099e, document_ba5049f6a2, personal_data_protection_act_2012_e857c5e9da, personal_data_protection_amendment_act_2020_d7cc5937b1, document_0e841274ea | 0.5296 |
| q08 | liability, Authority, Authority’s website, banking corporation, borrowing corporation | personal_data_protection_amendment_act_2020_d7cc5937b1_chunk_0048_ast, companies_act_1967_c8232023ef_chunk_0046_ast, document_318a65d5a2_chunk_0001_ast, document_318a65d5a2_chunk_0002_ast, document_318a65d5a2_chunk_0005_ast | concepts/digital_governance, laws/digital_governance, concepts/address_harvesting_software, concepts/applicable_telephone_number, concepts/applicable_message | personal_data_protection_amendment_act_2020_d7cc5937b1, personal_data_protection_act_2012_e857c5e9da, companies_act_1967_c8232023ef, document_318a65d5a2, entranslation_of_the_personal_data_protection_act_0_1c77b4099e | 0.4928 |

## A/B Comparison

A = raw text chunk retrieval only. B = professional glossary + AST nodes + LLM Wiki retrieval.

| query_id | A top5 | A doc concentration | B top5 | B doc concentration | B terms | B AST | B Wiki | B sources |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| q01 | 5 | 0.6 | 5 | 0.417 | yes | yes | yes | yes |
| q02 | 5 | 0.8 | 5 | 0.278 | yes | yes | yes | yes |
| q03 | 5 | 0.8 | 5 | 0.417 | yes | yes | yes | yes |
| q04 | 5 | 0.6 | 5 | 0.667 | yes | yes | yes | yes |
| q05 | 5 | 0.6 | 5 | 0.217 | yes | yes | yes | yes |
| q06 | 5 | 1.0 | 5 | 1.0 | yes | yes | yes | yes |
| q07 | 5 | 1.0 | 5 | 0.3 | yes | yes | yes | yes |
| q08 | 5 | 0.6 | 5 | 0.5 | yes | yes | yes | yes |

## Observations

- B returns structured candidate evidence: professional terms, AST node IDs, Wiki page paths, and source document IDs.
- A is useful as a sanity-check baseline because it searches the converted text directly.
- B is generally more explainable because each candidate can be traced through a term, node, Wiki page, and source document.
- B can inherit noise from rule-generated AST fields and glossary candidates, so every result remains `review_status = pending` until human review.
- The current scoring is local and lightweight; it uses TF-IDF, keyword overlap, phrase hits, and field weighting rather than embeddings.

## Limitations

- This prototype returns candidate retrieval results only and must not be treated as formal legal advice.
- Rule-generated terms may be overlong or too broad when source chunks include table-of-contents text.
- Wiki title and tag matching is lightweight and can miss relevant pages if the page title differs from the user's wording.
- Future improvements should add reviewed gold questions, manual relevance labels, better legal-domain filters, and optional embedding search.
