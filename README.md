![cover](cover.png)

# yupify - be fast, be type-safe

In fact, it's just a plugin for [`fastify`](https://github.com/fastify/fastify) that combinig validation schema declaration and typing for any request. No more, no less

#### Before

```ts
fastify.post<{ Querystring: { hello: string } }>(
  "/",
  { schema: { querystring: { hello: string } } },
  ({ query: { hello } }) => {
    return hello;
  }
);
```

#### After

```ts
yupify.post(
  "/",
  { [Yupify.Query]: yup.object({ hello: yup.string() }) },
  ({ query: { hello } }) => {
    return hello;
  }
);
```

## When to use it

- You want pretty-damn easy solution to add schema validation to your fastify app
- You don't want to add messy generics to your codebase

## When NOT to use it

- You need to have maximum control over the server (#todo)

## Small docs

### How to use it

1. Register the plugin

```ts
const server = fastify();
server.register(yupifyPlugin);
```

2. Create Yupify instance

```ts
const yupify = createYupify(server);
```

3. Use it at your own

```ts
yupify.get(
  "/hello",
  {
    [Yupify.Query]: yup.object({
      echo: yup.string(),
    }),
  },
  ({ query: { echo } }) => echo
);
```

### Available "chunks"

`Yupify.Body`, `Yupify.Query`, `Yupify.Params`, `Yupify.Headers`, `Yupify.Response`

### Available methods

`yupify.get`, `yupify.head`, `yupify.post`, `yupify.put`, `yupify.delete`, `yupify.options`, `yupify.patch`
