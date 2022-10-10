import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import yup from "yup";
import fp from "fastify-plugin";

const convertNamedObjectsArrayToObject = <
  K extends string | number | symbol,
  V
>(
  list: Array<Readonly<[K, V]>>
) => {
  const map = {} as Record<K, V>;
  for (const ele of list) {
    map[ele[0]] = ele[1];
  }
  return map;
};

type HTTPMethod =
  | "get"
  | "head"
  | "post"
  | "put"
  | "delete"
  | "options"
  | "patch";
const HTTP_METHODS: Array<HTTPMethod> = [
  "get",
  "head",
  "post",
  "put",
  "delete",
  "options",
  "patch",
];

export enum Yupify {
  Body = "body",
  Query = "querystring",
  Params = "params",
  Headers = "headers",
  Response = "response",
}

type YupifySchema<
  BodySchema extends yup.Schema,
  QuerySchema extends yup.Schema,
  ParamsSchema extends yup.Schema,
  HeadersSchema extends yup.Schema,
  ResponseSchema extends yup.Schema
> = Partial<{
  [Yupify.Body]: BodySchema;
  [Yupify.Query]: QuerySchema;
  [Yupify.Params]: ParamsSchema;
  [Yupify.Headers]: HeadersSchema;
  [Yupify.Response]: ResponseSchema;
}>;

type YupifyShape<
  BodySchema extends yup.Schema,
  QuerySchema extends yup.Schema,
  ParamsSchema extends yup.Schema,
  HeadersSchema extends yup.Schema,
  ResponseSchema extends yup.Schema
> = {
  Body: yup.InferType<BodySchema>;
  Query: yup.InferType<QuerySchema>;
  Params: yup.InferType<ParamsSchema>;
  Headers: yup.InferType<HeadersSchema>;
  Response: yup.InferType<ResponseSchema>;
};

type YupifyCallback<
  BodySchema extends yup.Schema,
  QuerySchema extends yup.Schema,
  ParamsSchema extends yup.Schema,
  HeadersSchema extends yup.Schema,
  ResponseSchema extends yup.Schema
> = (
  req: FastifyRequest<
    YupifyShape<
      BodySchema,
      QuerySchema,
      ParamsSchema,
      HeadersSchema,
      ResponseSchema
    >
  >,
  res: FastifyReply
) => void;

const createX = <
  BodySchema extends yup.Schema,
  QuerySchema extends yup.Schema,
  ParamsSchema extends yup.Schema,
  HeadersSchema extends yup.Schema,
  ResponseSchema extends yup.Schema
>(
  server: FastifyInstance,
  path: string,
  method: HTTPMethod,
  schema: YupifySchema<
    BodySchema,
    QuerySchema,
    ParamsSchema,
    HeadersSchema,
    ResponseSchema
  >,
  cb: YupifyCallback<
    BodySchema,
    QuerySchema,
    ParamsSchema,
    HeadersSchema,
    ResponseSchema
  >
) => {
  return server[method]<
    YupifyShape<
      BodySchema,
      QuerySchema,
      ParamsSchema,
      HeadersSchema,
      ResponseSchema
    >
  >(path, { schema }, cb);
};

export const createYupify = (fastify: FastifyInstance) => {
  const arrayOfNamedMethods = HTTP_METHODS.map(
    (method) =>
      [
        method,
        <
          BodySchema extends yup.Schema,
          QuerySchema extends yup.Schema,
          ParamsSchema extends yup.Schema,
          HeadersSchema extends yup.Schema,
          ResponseSchema extends yup.Schema
        >(
          path: string,
          schema: YupifySchema<
            BodySchema,
            QuerySchema,
            ParamsSchema,
            HeadersSchema,
            ResponseSchema
          >,
          cb: YupifyCallback<
            BodySchema,
            QuerySchema,
            ParamsSchema,
            HeadersSchema,
            ResponseSchema
          >
        ) => createX(fastify, path, method, schema, cb),
      ] as const
  );
  return convertNamedObjectsArrayToObject(arrayOfNamedMethods);
};

const yupDefaultOptions = {
  strict: false,
  abortEarly: false,
  stripUnknown: true,
  recursive: true,
};
const createYupValidatorCompiler =
  (yupOptions = yupDefaultOptions) =>
  ({ schema }: { schema: yup.AnyObjectSchema }) =>
  (data: any) => {
    try {
      const result = schema.validateSync(data, yupOptions);
      return { value: result };
    } catch (error) {
      return { error };
    }
  };
const plugin: FastifyPluginCallback<typeof yupDefaultOptions> = (
  fastify,
  options,
  done
) => {
  const yupValidatorCompiler = createYupValidatorCompiler(options);
  fastify.setValidatorCompiler(yupValidatorCompiler);
  done();
};
export const yupifyPlugin = fp(plugin);
