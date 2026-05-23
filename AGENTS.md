<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:styling-rules -->
# Styling Rules
- **Avoid Inline Styling**: Keep inline styling (`style={{...}}`) to an absolute minimum, only using it when dynamic properties are required.
- **Consolidate to Global CSS**: Move layout, alignment, colors, and repeated styling definitions to `src/app/globals.css` or module CSS files to preserve maintainability and avoid repeat definitions.
<!-- END:styling-rules -->
