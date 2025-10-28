// Small
export const registry = {
  'small-01-use-countdown': () => import('./challenges/small/01-use-countdown/index.jsx'),
  'small-02-dropdown': () => import('./challenges/small/02-dropdown/index.jsx'),
  'small-03-star-rating': () => import('./challenges/small/03-star-rating/index.jsx'),
  'small-04-gallery': () => import('./challenges/small/04-gallery/index.jsx'),
  'small-05-autosave': () => import('./challenges/small/05-autosave/index.jsx'),
  'small-06-toggle-list': () => import('./challenges/small/06-toggle-list/index.jsx'),
  // Medium
  'medium-01-form-wizard': () => import('./challenges/medium/01-form-wizard/index.jsx'),
  'medium-02-reorderable-list': () => import('./challenges/medium/02-reorderable-list/index.jsx'),
  'medium-03-notes-reducer': () => import('./challenges/medium/03-notes-reducer/index.jsx'),
  'medium-04-modal-manager': () => import('./challenges/medium/04-modal-manager/index.jsx'),
  'medium-05-search-table': () => import('./challenges/medium/05-search-table/index.jsx'),
}

export const prettyName = (key) => key
  .replace('small-', 'Small: ')
  .replace('medium-', 'Medium: ')
  .replace(/\d+-/, m => `#${m.match(/\d+/)[0]} `)
  .replace(/-/g, ' ')
  .replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
