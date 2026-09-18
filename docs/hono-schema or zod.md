```

// zod schemas
// zodの挙動検証
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const dateSchema = z.date();

const objectSchema = z.object({
  id: z.number(),
  name: z.string(),
});

app.post("/validation", zValidator("json", objectSchema), (c) => {
  const data = c.req.valid("json");
  console.log(data);
  return c.json(data);
});

// curlでPOSTリクエストを送る例

// curl -i -X POST http://localhost:8787/validation \
//   -H "Content-Type: application/json" \
//   -d '{"id":1,"name":"yuji"}'

// オプション説明
// -i  → Response Headerも表示
// -X  → HTTP Method
// -H  → Request Header
// -d  → Request Body

```
