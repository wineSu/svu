export const isObject = (val: any): val is Record<any, any> => (
    val !== null && typeof val === 'object'
);

export const hasChanged = (value: any, oldValue: any): boolean =>
  value !== oldValue && (value === value || oldValue === oldValue)

export const isArray = Array.isArray 

export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

export const isString = (val: unknown): val is string => typeof val === 'string'

export const extend = Object.assign

export const EMPTY_OBJ = {}

export const isSameVNodeType = (n1: any, n2: any) => (n1.type === n2.type && n1.key === n2.key)