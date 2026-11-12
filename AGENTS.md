<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Reception area lives under `/recepcao` (layout with sidebar in `src/routes/recepcao.tsx`); client data and its rules (CPF check, last visit) live in `src/lib/clientes.ts`. Why: one place to swap the in-memory sample store for the real database later.
- Psychologist area is `/psicologo` (single page, no sidebar); prontuário rules (who may annotate which session, session history) live in `src/lib/prontuario.ts`, scheduling rules in `src/lib/agenda.ts`. Why: keeps rules testable and separate from UI; session notes must stay out of reception screens.
- Pages whose output depends on the current clock (agenda, painel) render inside `<ClientOnly>`. Why: server runs in UTC, so SSR would mismatch the user's local time.
