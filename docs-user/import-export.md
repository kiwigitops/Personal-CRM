# Import And Export

## Import CSV

Open Contacts and paste CSV into the Import CSV panel.

Useful columns:

- `first_name`
- `last_name`
- `name`
- `email`
- `phone`
- `company`
- `tags`
- `title`
- `city`
- `notes`
- `relationship_strength`

The importer creates contacts and optionally companies/tags.

## Export CSV

Open Contacts and choose Export CSV.

## Limitations And Cautions

- Import has no duplicate resolution UI.
- Import can create many records if large CSV is pasted.
- Export does not yet escape spreadsheet formulas.
- Dedupe suggestions are suggestions only; there is no merge flow.
