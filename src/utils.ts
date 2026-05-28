export const stripChildTag = (s: string) => s.replace(/CHILD_[A-Z0-9]+[\s_]*/gi, '');
