

export const strValSchema = (opt?: boolean, max?: number, min?: number) => ({
  isString: true, optional: opt ?? false, isLength: { options: { min: min ?? 0, max: max ?? 512 } }
})
