/**
 * Where the paid cards sit (docs §130.5): one or two lead the results grid,
 * each marked «Προώθηση»; three or more stay their own section so the stripe
 * stays honest.
 */
export function promotedLayout(count: number): 'inline' | 'section' {
  return count <= 2 ? 'inline' : 'section';
}
