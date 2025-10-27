// Registry maps keys like 'small-01-counter' to dynamic imports
export const registry = {
  'small-01-counter': () => import('./challenges/small/01-counter/index.jsx'),
  'small-02-char-count': () => import('./challenges/small/02-char-count/index.jsx'),
  'small-03-theme-toggle': () => import('./challenges/small/03-theme-toggle/index.jsx'),
  'small-04-fetch-users': () => import('./challenges/small/04-fetch-users/index.jsx'),
  'small-05-filter-list': () => import('./challenges/small/05-filter-list/index.jsx'),
  'small-06-debounced-input': () => import('./challenges/small/06-debounced-input/index.jsx'),
  'small-07-use-localstorage': () => import('./challenges/small/07-use-localstorage/index.jsx'),
  'small-08-tabs': () => import('./challenges/small/08-tabs/index.jsx'),
  'small-09-stopwatch': () => import('./challenges/small/09-stopwatch/index.jsx'),
  'small-10-checkbox-group': () => import('./challenges/small/10-checkbox-group/index.jsx'),

  'medium-01-todos-crud': () => import('./challenges/medium/01-todos-crud/index.jsx'),
  'medium-02-pagination': () => import('./challenges/medium/02-pagination/index.jsx'),
  'medium-03-modal-portal': () => import('./challenges/medium/03-modal-portal/index.jsx'),
  'medium-04-form-validation': () => import('./challenges/medium/04-form-validation/index.jsx'),
  'medium-05-infinite-scroll': () => import('./challenges/medium/05-infinite-scroll/index.jsx'),
  'medium-06-sorting-table': () => import('./challenges/medium/06-sorting-table/index.jsx'),
}

export const prettyName = (key) => key       .replace('small-', 'Small: ')       .replace('medium-', 'Medium: ')       .replace(/\d+-/, lambda => `#${lambda.match(/\d+/)[0]} `)       .replace(/-/g, ' ')       .replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
