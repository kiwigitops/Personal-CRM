# Contacts

Contacts are people in your CRM.

## What You Can Store

- First and last name
- Email
- Phone
- Company
- Title
- City
- Notes
- Relationship strength
- Tags through import or API-backed data

## Add A Contact

Open Contacts, choose New contact, fill the form, and submit. Creating a contact queues a memory job.

## Search And Filter

Use the search box for names, email, and notes. Use Stale only to find relationships without a recent touchpoint.

Known issue: combining search and Stale only currently returns search matches OR stale contacts, not only stale contacts matching the search.

## Import And Export

CSV import accepts pasted CSV. Supported columns include `first_name`, `last_name`, `email`, `phone`, `company`, `tags`, `title`, `city`, and `notes`.

CSV export downloads visible CRM contact fields for the workspace. Be careful opening exports in spreadsheets until formula escaping is added.
