"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  EmptyState,
  Input,
  Plus,
  Search,
  Textarea,
  Upload
} from "@personal-crm/ui";
import type { ContactListItem } from "@personal-crm/types";
import { getInitials } from "@personal-crm/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/auth-provider";

const contactSchema = z.object({
  city: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  notes: z.string().optional(),
  phone: z.string().optional(),
  relationshipStrength: z.coerce.number().min(0).max(100),
  title: z.string().optional()
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactsPage() {
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [staleOnly, setStaleOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [csv, setCsv] = useState("");
  const contacts = useQuery({
    queryFn: () => api.listContacts({ query, staleOnly }),
    queryKey: ["contacts", query, staleOnly]
  });
  const savedFilters = useQuery({
    queryFn: () => api.listSavedFilters(),
    queryKey: ["saved-filters"]
  });
  const dedupe = useQuery({
    queryFn: () => api.dedupeSuggestions(),
    queryKey: ["dedupe-suggestions"]
  });
  const form = useForm<ContactFormValues>({
    defaultValues: {
      city: "",
      companyName: "",
      email: "",
      firstName: "",
      lastName: "",
      notes: "",
      phone: "",
      relationshipStrength: 55,
      title: ""
    },
    resolver: zodResolver(contactSchema)
  });
  const createContact = useMutation({
    mutationFn: (values: ContactFormValues) =>
      api.createContact({
        ...values,
        email: values.email || null
      }),
    onSuccess: async () => {
      toast.success("Contact created");
      form.reset();
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    }
  });
  const importCsv = useMutation({
    mutationFn: () => api.importContactsCsv(csv),
    onSuccess: async (result) => {
      toast.success(`Imported ${result.imported} contacts`);
      setCsv("");
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    }
  });
  const saveFilter = useMutation({
    mutationFn: () =>
      api.createSavedFilter({
        name: query ? `Search: ${query}` : staleOnly ? "Stale contacts" : "All contacts",
        query,
        staleOnly
      }),
    onSuccess: async () => {
      toast.success("Filter saved");
      await queryClient.invalidateQueries({ queryKey: ["saved-filters"] });
    }
  });

  const onExport = async () => {
    const content = await api.exportContactsCsv();
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-[2rem] border border-border bg-card/90 p-6 shadow-soft md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-primary">Relationship database</p>
          <h1 className="font-display text-4xl font-semibold">Contacts</h1>
          <p className="text-muted-foreground">Search, segment, import, export, and enrich your network.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowForm((value) => !value)} type="button">
            <Plus size={16} />
            New contact
          </Button>
          <Button onClick={onExport} type="button" variant="secondary">
            Export CSV
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <Input
                className="pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email, notes..."
                value={query}
              />
            </div>
            <Button
              onClick={() => setStaleOnly((value) => !value)}
              type="button"
              variant={staleOnly ? "primary" : "secondary"}
            >
              Stale only
            </Button>
            <Button onClick={() => saveFilter.mutate()} type="button" variant="outline">
              Save filter
            </Button>
          </Card>

          {showForm ? (
            <Card className="space-y-4">
              <div>
                <CardTitle>Add a contact</CardTitle>
                <CardDescription>New contacts immediately trigger memory and health agents.</CardDescription>
              </div>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={form.handleSubmit((values) => createContact.mutate(values))}>
                <Input placeholder="First name" {...form.register("firstName")} />
                <Input placeholder="Last name" {...form.register("lastName")} />
                <Input placeholder="Email" {...form.register("email")} />
                <Input placeholder="Phone" {...form.register("phone")} />
                <Input placeholder="Company" {...form.register("companyName")} />
                <Input placeholder="Title" {...form.register("title")} />
                <Input placeholder="City" {...form.register("city")} />
                <Input placeholder="Relationship strength" type="number" {...form.register("relationshipStrength")} />
                <Textarea className="md:col-span-2" placeholder="Notes" {...form.register("notes")} />
                <Button className="md:col-span-2" disabled={createContact.isPending} type="submit">
                  {createContact.isPending ? "Creating..." : "Create contact"}
                </Button>
              </form>
            </Card>
          ) : null}

          <Card className="overflow-hidden p-0">
            {contacts.data?.length ? (
              <div className="divide-y divide-border">
                {contacts.data.map((contact) => (
                  <ContactRow contact={contact} key={contact.id} />
                ))}
              </div>
            ) : (
              <div className="p-5">
                <EmptyState
                  actionLabel="Add first contact"
                  description="Create or import a contact to start tracking relationship history."
                  onAction={() => setShowForm(true)}
                  title="No contacts found"
                />
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-3">
            <div>
              <CardTitle>Saved filters</CardTitle>
              <CardDescription>Quickly return to useful segments.</CardDescription>
            </div>
            {savedFilters.data?.map((filter) => (
              <button
                className="block w-full rounded-2xl bg-muted p-3 text-left text-sm"
                key={filter.id}
                onClick={() => {
                  setQuery(filter.query ?? "");
                  setStaleOnly(filter.staleOnly);
                }}
                type="button"
              >
                {filter.name}
              </button>
            ))}
          </Card>

          <Card className="space-y-3">
            <div>
              <CardTitle>Dedupe</CardTitle>
              <CardDescription>Possible duplicates from emails, phones, and names.</CardDescription>
            </div>
            {dedupe.data?.length ? (
              dedupe.data.slice(0, 4).map((item) => (
                <div className="rounded-2xl bg-muted p-3 text-sm" key={`${item.primaryContactId}-${item.duplicateContactId}`}>
                  <p className="font-semibold">{Math.round(item.confidence * 100)}% match</p>
                  <p className="text-muted-foreground">{item.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No duplicate suggestions yet.</p>
            )}
          </Card>

          <Card className="space-y-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload size={18} />
                Import CSV
              </CardTitle>
              <CardDescription>Columns: first_name, last_name, email, phone, company, tags.</CardDescription>
            </div>
            <Textarea onChange={(event) => setCsv(event.target.value)} placeholder="Paste CSV here..." value={csv} />
            <Button disabled={!csv || importCsv.isPending} onClick={() => importCsv.mutate()} type="button">
              Import contacts
            </Button>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function ContactRow({ contact }: { contact: ContactListItem }) {
  return (
    <Link
      className="grid gap-4 p-4 transition hover:bg-muted/60 md:grid-cols-[1.3fr_0.8fr_0.8fr_auto]"
      href={`/contacts/${contact.id}`}
    >
      <div className="flex items-center gap-3">
        <Avatar imageUrl={contact.avatarUrl}>{getInitials(contact.firstName, contact.lastName)}</Avatar>
        <div>
          <p className="font-semibold">{contact.firstName} {contact.lastName}</p>
          <p className="text-sm text-muted-foreground">{contact.title ?? "No title"}</p>
        </div>
      </div>
      <div className="text-sm">
        <p>{contact.companyName ?? "No company"}</p>
        <p className="text-muted-foreground">{contact.city ?? contact.email ?? "No location"}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {contact.tags.slice(0, 3).map((tag) => (
          <Badge key={tag.id}>{tag.name}</Badge>
        ))}
      </div>
      <Badge>{contact.warmthScore} warmth</Badge>
    </Link>
  );
}
