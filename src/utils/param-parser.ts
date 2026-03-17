/**
 * Safely extract a single string parameter from Express request
 * Route parameters can be string | string[], this ensures we get a single string
 */
export function getParamString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] as string;
  }
  return (param as string) || '';
}
