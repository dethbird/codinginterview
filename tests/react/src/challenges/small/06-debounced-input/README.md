# Debounced Input

Build <SearchInput onSearch={fn} delay={500}/> that calls onSearch(value) 500ms after typing stops.
Requirements:
- Debounce with cleanup on unmount and value change.

