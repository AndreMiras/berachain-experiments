export const handleMainError = (error: unknown) => {
  console.log(error);
  Deno.exit(1);
};
