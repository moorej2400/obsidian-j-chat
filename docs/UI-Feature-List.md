# J Chat — UI Feature List

Combined feature list for the design overhaul. Original bullets are kept verbatim; additions are marked **➕**.

## App / global shell
- side panel UI (generally will be used as a side panel not a full size browser window
- the app in the side panel is completly self contained
- ➕ narrow-width responsive design (~300px) and theme-agnostic styling — design the side-panel case explicitly, not just a roomy window
- ➕ first-run / no-provider-configured onboarding, plus empty states (no chat, no sessions, no search results)

## Settings page
- needs a settings page designed to be able to grow with time and ui components and sections and sub sections to supports different types of inputs, such as
    - multiple ai provider connection configs
    - models and model settings
    - managing multiple modles and thinking about how there are different providers to organize that
    - managing system prompt,  custom modes, and custom styles
- ➕ settings data model: Provider (connection) → Models (enable/disable + per-model defaults) → default model, with Modes/Styles as reusable items; add Context/Retrieval, Edit-behavior, and Data/privacy sections so it scales

## Chat screen
- chat screen and showing thinking, tool calling, (collpaing that information in the main chat once done expandable if needed)
- chat screen should have a way to add attachments
- ➕ note-editing / "apply to note" flow — preview an AI-proposed edit with diff → approve/reject, plus per-response Insert at cursor / Replace selection / Apply to note
- ➕ context management beyond a binary toggle — @-mention notes, add a folder, attach the selection, and show which sources the answer actually used
- ➕ per-message actions — copy, regenerate, edit-and-resend, delete, and branch/fork a conversation
- ➕ streaming + stop generation, and error/retry states (bad key, rate limit, network) drawn distinctly from normal messages
- ➕ tool-call & thinking detail states — tool name + collapsed/expanded inputs & outputs, and running / done / error per step

## Text input / composer
- text input with some display of current model and other info like used context and then settings for whatever current custom relavant session specific options apply, and from the text menu a quick expanding menu that does not take over the whole screen but allows the user to quickly change settings for the chat like choosing if only the current page should apply or all pages, the modal, mode (modes are custom instructions for how the ai should behave like researcher, summarizer, ), style (custom prompts for how responses should be formatted), etc
- ➕ "preset" concept (model + mode + style bundled) so the quick-menu switches one thing instead of three dropdowns

## Sessions
- multiple session hisotry, tracking, renmaing, switching, popout menu to control them and bookmark sessions to stay at the top

## Saved prompts
- A saved prompts page where prompt can quickly be injected into the message field
- ➕ saved-prompt variables + insert-vs-run — placeholders like `{{selection}}`, `{{title}}`, `{{clipboard}}` that fill in on insert, plus a choice to insert into the field vs run immediately
