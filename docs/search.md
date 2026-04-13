# Search

## Implemented Search

Global search route:

```http
GET /v1/search/global?query=<text>
```

It searches:

- Contacts by first name, last name, email, notes
- Companies by name
- Interactions by title and notes
- Follow-ups by prompt

Contacts page search:

```http
GET /v1/contacts?query=<text>&staleOnly=true&tagId=<tag>
```

## Current Limitations

- Search uses Prisma `contains` with `mode: "insensitive"`.
- The `pg_trgm` extension is enabled in platform init SQL, but no trigram indexes are defined.
- Contacts page `query + staleOnly` currently combines conditions with `OR`, not `AND`, so stale-only search can return unrelated stale contacts.
- Global company results link to `/companies/:id`, but no company page exists.
- No pagination beyond fixed `take` limits.
- No saved filter application endpoint; saved filters are client-side conveniences.

## Recommended Improvements

- Fix contacts filter semantics.
- Add indexed full-text or trigram search.
- Add pagination/cursors.
- Remove or implement company detail route.
- Add integration tests for search/filter combinations.
