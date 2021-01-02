export const isObject = (val: any): val is Record<any, any> => (
    val !== null && typeof val === 'object'
);

export const hasChanged = (value: any, oldValue: any): boolean =>
  value !== oldValue && (value === value || oldValue === oldValue)

export const isArray = Array.isArray 