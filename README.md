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
  ({ [Yupify.Query]: { hello } }) => {
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
  ({ [Yupify.Query]: { echo } }) => echo
);
```

> You will need to install yup. Make sure it is version 1.0.0-beta.7 and above

### Available "chunks"

`Yupify.Body`, `Yupify.Query`, `Yupify.Params`, `Yupify.Headers`, `Yupify.Response`

### Available methods

`yupify.get`, `yupify.head`, `yupify.post`, `yupify.put`, `yupify.delete`, `yupify.options`, `yupify.patch`

### How to create a hook

#### Simple example

```ts
import { HookConstructor } from "yupify";

// Everything will be type-safe, relax
export const withSecret: HookConstructor = (cb) => {
  return (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.code(401).send();
    if (token !== process.env.SECRET) return res.code(401).send();
    return await cb(req, res);
  };
};
```

#### Advanced example

```ts
import { HookConstructor } from "yupify";

export const withAuth: HookConstructor<
  // Args tuple
  [JWTVerifyGetKey],
  // Object that you can attach to .req
  { user: UserData }
> = (cb, [jwks]) => {
  return async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.code(401).send();
    const user = await getUserDataFromToken(token, jwks);
    if (!user) return res.code(401).send();
    return await cb({ ...req, user }, res);
  };
};
```
